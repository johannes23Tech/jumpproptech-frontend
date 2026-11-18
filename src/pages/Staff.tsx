import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Plus, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { api } from '../utils/api';
import { validatePassword } from '../utils/security';
import { STAFF_ROLES, STAFF_ROLE_LABELS, roleLabel } from '../config/roles';
import Modal from '../components/Modal';
import PremiumButton from '../components/PremiumButton';
import { PageBanner, SubmitButton } from '../components/FormFeedback';

type StaffMember = {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  staff_role?: string | null;
  role?: string;
  is_active?: number | boolean;
};

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [staffRole, setStaffRole] = useState('property_manager');

  const fetchStaff = async () => {
    setLoadError('');
    try {
      const data = await api.getStaff();
      setStaff(Array.isArray(data?.staff) ? data.staff : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Staff accounts could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStaff();
  }, []);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setStaffRole('property_manager');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setSubmitError(passwordError);
      return;
    }

    setSubmitting(true);
    try {
      await api.createStaff({
        full_name: fullName,
        email,
        phone,
        password,
        staff_role: staffRole,
      });
      setIsModalOpen(false);
      resetForm();
      setSuccessMessage('Staff account created.');
      await fetchStaff();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The staff account could not be created.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateMember = async (member: StaffMember, changes: { staff_role?: string; is_active?: boolean }) => {
    setSuccessMessage('');
    setLoadError('');
    try {
      await api.updateStaff({ id: member.id, ...changes });
      setSuccessMessage('Staff account updated.');
      await fetchStaff();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'The staff account could not be updated.');
    }
  };

  return (
    <div className="animate-fade-in">
      {successMessage && <PageBanner message={successMessage} onDismiss={() => setSuccessMessage('')} />}
      {loadError && (
        <div role="alert" className="mb-6 rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {loadError}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Staff</h2>
          <p className="text-sm text-gray-500">Internal accounts and approved roles.</p>
        </div>
        <PremiumButton
          onClick={() => {
            setSubmitError('');
            setSuccessMessage('');
            setIsModalOpen(true);
          }}
          icon={<Plus size={18} />}
        >
          Add Staff
        </PremiumButton>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading staff accounts...</p>
      ) : staff.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          No staff accounts yet.
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => {
            const active = member.is_active === undefined ? true : Boolean(Number(member.is_active));
            return (
              <article key={member.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-black truncate">{member.full_name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}
                      >
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 break-all">{member.email}</p>
                    {member.phone && <p className="text-xs text-gray-400">{member.phone}</p>}
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      {roleLabel(member.staff_role || member.role)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs font-semibold text-gray-500">
                      Role
                      <select
                        value={member.staff_role || ''}
                        onChange={(event) => void updateMember(member, { staff_role: event.target.value })}
                        className="ml-2 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-black"
                        aria-label={`Role for ${member.full_name}`}
                      >
                        {!member.staff_role && <option value="">Legacy: {roleLabel(member.role)}</option>}
                        {STAFF_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {STAFF_ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => void updateMember(member, { is_active: !active })}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold ${
                        active ? 'bg-danger/10 text-danger hover:bg-danger/20' : 'bg-success/10 text-success hover:bg-success/20'
                      }`}
                    >
                      {active ? <UserX size={15} /> : <UserCheck size={15} />}
                      {active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add staff account"
        subtitle="INTERNAL ACCESS"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg bg-gold/10 p-3 text-xs text-gray-700">
            <ShieldCheck size={16} className="shrink-0 text-gold" />
            Staff accounts can only be created by an authorised administrator. Every change is audited.
          </div>

          <label className="block text-sm font-semibold text-gray-700">
            Full name
            <input
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
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
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              autoComplete="email"
            />
          </label>

          <label className="block text-sm font-semibold text-gray-700">
            Phone number
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              autoComplete="tel"
              placeholder="+27"
            />
          </label>

          <label className="block text-sm font-semibold text-gray-700">
            Role
            <select
              value={staffRole}
              onChange={(event) => setStaffRole(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {STAFF_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-gray-700">
            Temporary password
            <div className="relative mt-1">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-11"
                autoComplete="new-password"
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
              The staff member should change this after signing in.
            </span>
          </label>

          <SubmitButton loading={submitting} loadingText="Creating staff account..." error={submitError}>
            Create staff account
          </SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
