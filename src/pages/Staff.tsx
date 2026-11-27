import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Plus, Search, ShieldCheck, UserCheck, UserX, Users, Filter, ChevronRight, BadgeCheck, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { validatePassword } from '../utils/security';
import { STAFF_ROLES, STAFF_ROLE_LABELS, roleLabel } from '../config/roles';
import Modal from '../components/Modal';
import PremiumButton from '../components/PremiumButton';
import TiltCard from '../components/TiltCard';
import Skeleton from '../components/Skeleton';
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
  const navigate = useNavigate();
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

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

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

  const isActiveMember = (member: StaffMember) => member.is_active === undefined ? true : Boolean(Number(member.is_active));

  const stats = useMemo(() => {
    const total = staff.length;
    const active = staff.filter(isActiveMember).length;
    const inactive = total - active;
    const roles = new Set(staff.map((m) => m.staff_role || m.role).filter(Boolean)).size;
    return { total, active, inactive, roles };
  }, [staff]);

  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    for (const m of staff) {
      const r = m.staff_role || m.role;
      if (r) set.add(String(r));
    }
    return Array.from(set);
  }, [staff]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((member) => {
      const active = isActiveMember(member);
      if (statusFilter === 'active' && !active) return false;
      if (statusFilter === 'inactive' && active) return false;
      const roleKey = String(member.staff_role || member.role || '');
      if (roleFilter !== 'all' && roleKey !== roleFilter) return false;
      if (!q) return true;
      const hay = [member.full_name, member.email, member.phone, roleLabel(member.staff_role || member.role)].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [staff, query, statusFilter, roleFilter]);

  return (
    <div className="animate-fade-in space-y-6">
      {successMessage && <PageBanner message={successMessage} onDismiss={() => setSuccessMessage('')} />}
      {loadError && (
        <div role="alert" className="mb-2 rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {loadError}
        </div>
      )}

      <div className="bg-gradient-to-r from-charcoal via-black to-charcoal p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold opacity-10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs text-gold tracking-widest uppercase mb-2 font-semibold"><Shield size={14} /> Staff Management</p>
            <h1 className="font-display text-3xl md:text-4xl text-ivory mb-2">Internal Team & Roles</h1>
            <p className="text-gray-400 text-sm max-w-2xl">Create and manage internal accounts, assign approved roles, and control access. All changes are audited.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3 min-w-[110px]">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total</p>
              <p className="font-display text-2xl text-ivory font-bold">{loading ? '…' : stats.total}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3 min-w-[110px]">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Active</p>
              <p className="font-display text-2xl text-success font-bold">{loading ? '…' : stats.active}</p>
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
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TiltCard>
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Users size={16} /><p className="text-xs font-bold uppercase tracking-wider">Total accounts</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : stats.total}</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 text-success mb-1"><UserCheck size={16} /><p className="text-xs font-bold uppercase tracking-wider">Active</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : stats.active}</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 text-danger mb-1"><UserX size={16} /><p className="text-xs font-bold uppercase tracking-wider">Inactive</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : stats.inactive}</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 text-gold mb-1"><BadgeCheck size={16} /><p className="text-xs font-bold uppercase tracking-wider">Roles in use</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : stats.roles}</p>
        </TiltCard>
      </div>

      <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-premium">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, phone or role..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-gold focus:bg-white transition-colors"
              aria-label="Search staff"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
              <Filter size={14} className="ml-2 text-gray-400" />
              {(['all', 'active', 'inactive'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${statusFilter === s ? 'bg-black text-gold shadow-sm' : 'text-gray-600 hover:bg-white'}`}>{s}</button>
              ))}
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-gold focus:bg-white"
              aria-label="Filter by role"
            >
              <option value="all">All roles</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>{roleLabel(r)}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">Showing {filtered.length} of {staff.length} account(s). Click a card to view full details, edit, reset password, or delete.</p>
      </div>

      {loading ? (
        <div className="space-y-3"><Skeleton type="row" /><Skeleton type="row" /><Skeleton type="row" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400"><Users size={24} /></div>
          <h3 className="font-display text-xl font-bold text-black mb-1">No staff accounts found</h3>
          <p className="text-sm text-gray-500 mb-5">{staff.length === 0 ? 'Create your first internal staff account to get started.' : 'Try adjusting your search or filters.'}</p>
          {staff.length === 0 && <PremiumButton onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>Add Staff</PremiumButton>}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((member) => {
            const active = isActiveMember(member);
            return (
              <article
                key={member.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/staff/${member.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/staff/${member.id}`);
                  }
                }}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-premium hover:border-gold/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40"
                aria-label={`Open staff account for ${member.full_name}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-charcoal to-black text-gold flex items-center justify-center font-display font-bold text-lg shrink-0 border border-gold/20">
                      {member.full_name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() || 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-black truncate">{member.full_name}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 break-all">{member.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 font-semibold text-gray-700"><ShieldCheck size={13} className="text-gold" /> {roleLabel(member.staff_role || member.role)}</span>
                        {member.phone && <span className="inline-flex items-center rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-gray-600">{member.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-gold transition-colors shrink-0 mt-1" />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <span>Role</span>
                    <select
                      value={member.staff_role || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(event) => void updateMember(member, { staff_role: event.target.value })}
                      className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm text-black outline-none focus:border-gold"
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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/staff/${member.id}`);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void updateMember(member, { is_active: !active });
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
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
          <div className="flex items-start gap-3 rounded-xl bg-gold/10 border border-gold/20 p-4 text-sm text-gray-700">
            <ShieldCheck size={18} className="shrink-0 text-gold mt-0.5" />
            <div>
              <p className="font-semibold text-black mb-0.5">Authorized administrators only</p>
              <p className="text-xs text-gray-600">Staff accounts are internal. Assign the correct role to ensure proper dashboard access and permissions. Every change is audited.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm font-semibold text-gray-700">
              Full name
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                autoComplete="name"
                placeholder="e.g. Jane Mokoena"
              />
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                autoComplete="email"
                placeholder="name@company.com"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm font-semibold text-gray-700">
              Phone number
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                autoComplete="tel"
                placeholder="+27"
              />
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Role
              <select
                value={staffRole}
                onChange={(event) => setStaffRole(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              >
                {STAFF_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {STAFF_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-semibold text-gray-700">
            Temporary password
            <div className="relative mt-1.5">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 pr-11 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
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
            <span className="mt-1.5 block text-xs font-normal text-gray-500">
              Use 8–12 chars with upper/lowercase, number and symbol. The staff member should change it after signing in.
            </span>
          </label>

          <div className="pt-2">
            <SubmitButton loading={submitting} loadingText="Creating staff account..." error={submitError}>
              Create staff account
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
