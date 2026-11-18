import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Save, ShieldCheck, Trash2, UserCheck, UserX } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { validatePassword } from '../utils/security';
import { STAFF_ROLES, STAFF_ROLE_LABELS, roleLabel } from '../config/roles';
import PremiumButton from '../components/PremiumButton';
import { PageBanner, SubmitButton } from '../components/FormFeedback';

type StaffMember = {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  staff_role?: string | null;
  role?: string | null;
  is_active?: number | boolean;
  created_at?: string | null;
  account_type?: string | null;
};

export default function StaffDetail() {
  const { id } = useParams();
  const staffId = Number(id);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [member, setMember] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [staffRole, setStaffRole] = useState('property_manager');
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isSelf = !!currentUser && !!member && Number(currentUser.id) === Number(member.id);

  const hydrateForm = (m: StaffMember) => {
    setFullName(m.full_name || '');
    setEmail(m.email || '');
    setPhone(m.phone || '');
    setStaffRole(m.staff_role || (m.role && STAFF_ROLES.includes(m.role as any) ? m.role : 'property_manager'));
    setIsActive(m.is_active === undefined ? true : Boolean(Number(m.is_active)));
  };

  const load = async () => {
    if (!Number.isFinite(staffId) || staffId <= 0) {
      setLoadError('Invalid staff account.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const data = await api.getStaffMember(staffId);
      const m = data?.staff as StaffMember | undefined;
      if (!m) {
        setLoadError('Staff account not found.');
        setMember(null);
      } else {
        setMember(m);
        hydrateForm(m);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Staff account could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!member) return;
    setSaveError('');
    setSuccessMessage('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      setSaveError('Full name is required.');
      return;
    }
    if (!trimmedEmail) {
      setSaveError('A valid email address is required.');
      return;
    }

    if (newPassword) {
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        setSaveError(passwordError);
        return;
      }
    }

    if (isSelf && staffRole !== (member.staff_role || '')) {
      setSaveError('You cannot change your own staff role.');
      return;
    }
    if (isSelf && !isActive) {
      setSaveError('You cannot deactivate your own account.');
      return;
    }

    setSaving(true);
    try {
      await api.updateStaff({
        id: member.id,
        full_name: trimmedName,
        email: trimmedEmail,
        phone: phone.trim(),
        staff_role: staffRole,
        is_active: isActive,
        ...(newPassword ? { password: newPassword } : {}),
      });
      setNewPassword('');
      setSuccessMessage('Staff account updated.');
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'The staff account could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (isSelf) {
      setSaveError('You cannot delete your own account.');
      return;
    }
    const ok = window.confirm(
      `Delete staff account "${member.full_name}" (${member.email})? This cannot be undone. If the account is linked to records, you may need to deactivate it instead.`
    );
    if (!ok) return;

    setDeleting(true);
    setSaveError('');
    setSuccessMessage('');
    try {
      await api.deleteStaff(member.id);
      navigate('/staff', { replace: true });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'The staff account could not be deleted.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading staff account...</div>;
  }

  if (loadError || !member) {
    return (
      <div className="space-y-4">
        <Link to="/staff" className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:underline">
          <ArrowLeft size={16} /> Back to Staff
        </Link>
        <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {loadError || 'Staff account not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/staff" className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:underline mb-2">
            <ArrowLeft size={16} /> Back to Staff
          </Link>
          <h1 className="font-display text-2xl font-bold text-black">Staff Account</h1>
          <p className="text-sm text-gray-500">View, edit, activate/deactivate, or remove this account.</p>
        </div>
        <div className="flex gap-2">
          <PremiumButton
            type="button"
            variant="secondary"
            onClick={() => void handleDelete()}
            disabled={deleting || isSelf}
            icon={<Trash2 size={16} />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </PremiumButton>
        </div>
      </div>

      {successMessage && <PageBanner message={successMessage} onDismiss={() => setSuccessMessage('')} />}
      {saveError && (
        <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="font-bold text-black mb-3">Account summary</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-semibold text-black">{member.full_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-semibold text-black break-all">{member.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-semibold text-black">{member.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Role</dt>
              <dd className="font-semibold text-black">{roleLabel(member.staff_role || member.role)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
            {member.created_at && (
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="font-semibold text-black">{member.created_at}</dd>
              </div>
            )}
            {isSelf && (
              <div className="rounded-lg bg-gold/10 p-3 text-xs text-gray-700">
                This is your account. You cannot change your own role, deactivate, or delete yourself.
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-gold" />
            <h2 className="font-bold text-black">Edit account</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">Changes are audited. To assign an Administrator, select the <strong>Administrator</strong> role below and save.</p>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-gray-700">
                Full name
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  autoComplete="name"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Email address
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  autoComplete="email"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Phone number
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  autoComplete="tel"
                  placeholder="+27"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Role
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  disabled={isSelf}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {STAFF_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSelf}
                className="h-4 w-4"
              />
              <span className="text-sm">
                <span className="font-semibold text-gray-800">Account active</span>
                <span className="block text-xs text-gray-500">Inactive accounts cannot sign in. Deactivating will invalidate active sessions when supported.</span>
              </span>
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Set new password (optional)
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-11"
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-black"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className="mt-1 block text-xs font-normal text-gray-500">
                If set, this becomes the account password immediately (use 8–12+ chars per policy with upper/lower, number, symbol).
              </span>
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <SubmitButton loading={saving} loadingText="Saving changes..." error="">
                <span className="inline-flex items-center gap-2"><Save size={16} /> Save changes</span>
              </SubmitButton>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset form
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
