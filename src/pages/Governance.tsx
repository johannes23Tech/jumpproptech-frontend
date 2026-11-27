import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  FileClock,
  KeyRound,
  Lock,
  RefreshCw,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { api } from '../utils/api';
import {
  STAFF_ROLES,
  STAFF_ROLE_LABELS,
  roleLabel,
  type StaffRole,
} from '../config/roles';

type StaffMember = {
  id: number;
  full_name: string;
  email: string;
  staff_role?: string | null;
  role?: string | null;
  is_active?: number | boolean;
};

// Derived from the role-based home routing in App.tsx. These describe the
// workspace a role is routed to; effective access is decided by the
// server-issued permission list, never by these labels alone.
const ROLE_FOCUS: Record<StaffRole, string> = {
  super_administrator: 'Platform administration via the Control Center (accounts, audit, sessions and tokens).',
  administrator: 'Administrator workspace for internal configuration and oversight.',
  property_manager: 'Property manager workspace for the property, unit and tenant portfolio.',
  finance_accountant: 'Finance workspace for rent collection, arrears and budgets.',
  maintenance_manager: 'Maintenance manager workspace for tickets and technician assignments.',
  maintenance_technician: 'Technician workspace for assigned maintenance tickets.',
  reception_support: 'Reception support workspace for tenants and applications.',
  auditor: 'Auditor workspace for read-only review and oversight.',
};

// Permission strings actually checked by the frontend (App.tsx route guards,
// Layout.tsx navigation guards and page-level action guards). This is a
// reference only — the authoritative catalogue is backend-only.
const PERMISSION_GROUPS: { group: string; items: { permission: string; usedFor: string }[] }[] = [
  {
    group: 'Administration & support',
    items: [
      { permission: 'staff.manage', usedFor: 'Staff page, account create/edit and activation' },
      { permission: 'applications.view', usedFor: 'Applications screen access' },
      { permission: 'applications.review', usedFor: 'Application approve / reject actions' },
      { permission: 'qr.manage', usedFor: 'Unit QR onboarding actions' },
      { permission: 'flux.use', usedFor: 'Messages access via Flux AI' },
    ],
  },
  {
    group: 'Portfolio',
    items: [
      { permission: 'properties.view', usedFor: 'Properties screen access' },
      { permission: 'units.view', usedFor: 'Units screen access' },
      { permission: 'units.manage', usedFor: 'Unit create, edit and archive actions' },
      { permission: 'tenants.view', usedFor: 'Tenants screen access' },
      { permission: 'tenants.manage', usedFor: 'Tenancy lifecycle management actions' },
    ],
  },
  {
    group: 'Leases & documents',
    items: [
      { permission: 'leases.view', usedFor: 'Tenancy and lease records access' },
      { permission: 'leases.manage', usedFor: 'Lease create, sign and renewal actions' },
      { permission: 'deposits.view', usedFor: 'Deposit records access' },
      { permission: 'deposits.manage', usedFor: 'Deposit record actions' },
      { permission: 'contracts.view', usedFor: 'Lease Agreements screen access' },
      { permission: 'contracts.manage', usedFor: 'Contract create, issue and edit actions' },
      { permission: 'templates.manage', usedFor: 'Contract template management' },
    ],
  },
  {
    group: 'Finance',
    items: [
      { permission: 'payments.view', usedFor: 'Rent and payments screen access' },
      { permission: 'arrears.view', usedFor: 'Rent screen access for arrears' },
      { permission: 'payments.record_cash', usedFor: 'Record cash payment action' },
      { permission: 'payments.verify_eft', usedFor: 'Verify EFT proof action' },
      { permission: 'payments.reverse', usedFor: 'Reverse payment action' },
      { permission: 'budgets.view', usedFor: 'Budgets screen access' },
      { permission: 'budgets.manage', usedFor: 'Budget create and delete actions' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { permission: 'maintenance.view', usedFor: 'Maintenance screen access' },
      { permission: 'messages.view', usedFor: 'Messages screen access' },
    ],
  },
];

const isActiveMember = (member: StaffMember): boolean =>
  member.is_active === undefined ? true : Boolean(Number(member.is_active));

export default function Governance() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await api.getStaff();
      if (!raw || !Array.isArray(raw.staff)) {
        throw new Error('Staff data was returned in an unexpected format.');
      }
      setStaff(raw.staff as StaffMember[]);
    } catch (err) {
      setStaff([]);
      setError(err instanceof Error ? err.message : 'Staff accounts could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-gradient-to-r from-charcoal via-black to-charcoal rounded-3xl border border-gray-800 p-6 shadow-2xl md:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
              <Shield size={14} /> Access & governance
            </p>
            <h2 className="font-display text-3xl text-ivory md:text-4xl">Governance</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-400">
              Approved roles, internal staff access and the permission vocabulary enforced by the application.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/control-center"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-ivory hover:bg-white/10"
            >
              <FileClock size={15} /> Audit viewer
            </Link>
            <Link
              to="/staff"
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-black hover:opacity-90"
            >
              <Users size={15} /> Manage staff
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          <p className="flex items-center gap-2 font-semibold"><AlertCircle size={16} /> Staff accounts could not be loaded.</p>
          <p className="mt-1">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-2 inline-flex items-center gap-2 font-bold underline">
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}

      <section>
        <div className="mb-3">
          <h3 className="font-display text-xl text-charcoal">Approved staff roles</h3>
          <p className="text-xs text-gray-500">
            Canonical role vocabulary from the application configuration. Legacy roles are shown only on accounts that have not been migrated.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STAFF_ROLES.map((role) => (
            <article key={role} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-premium">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <ShieldCheck size={18} />
              </div>
              <h4 className="font-display text-base font-semibold text-charcoal">{STAFF_ROLE_LABELS[role]}</h4>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gold">{role}</p>
              <p className="mt-3 text-xs leading-relaxed text-gray-600">{ROLE_FOCUS[role]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-premium">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="font-display text-lg text-charcoal">Staff accounts</h3>
            <p className="text-xs text-gray-500">Internal team members and their assigned roles.</p>
          </div>
          <Link to="/staff" className="inline-flex items-center gap-1 text-sm font-semibold text-gold hover:underline">
            Open Staff <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <p className="p-10 text-center text-sm text-gray-500">Loading staff accounts…</p>
        ) : staff.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={28} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm font-semibold text-charcoal">
              {error ? 'Staff accounts are unavailable.' : 'No staff accounts found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-ivory text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const active = isActiveMember(member);
                  return (
                    <tr key={member.id} className="border-t border-gray-100 hover:bg-ivory/60">
                      <td className="px-5 py-3 font-semibold text-charcoal">{member.full_name}</td>
                      <td className="break-all px-5 py-3 text-gray-600">{member.email}</td>
                      <td className="px-5 py-3 text-gray-700">{roleLabel(member.staff_role || member.role)}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Link to={`/staff/${member.id}`} className="inline-flex items-center gap-1 font-semibold text-gold hover:underline">
                          View <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-premium md:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
            <KeyRound size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg text-charcoal">Permission reference</h3>
            <p className="text-xs text-gray-500">
              Read-only list of permission strings checked by the frontend for route and action access.
              The server-side permission catalogue is authoritative and is not exposed here.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.group} className="rounded-2xl border border-gray-200 bg-ivory p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal">{group.group}</h4>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.permission} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <code className="rounded-lg bg-white px-2 py-1 font-mono text-xs font-semibold text-gold">{item.permission}</code>
                    <span className="text-xs text-gray-600">{item.usedFor}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gold/20 bg-gold/5 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <Lock size={20} className="mt-0.5 shrink-0 text-gold" />
          <div>
            <h3 className="font-display text-lg text-charcoal">POPIA notice</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Tenant identity numbers, ID documents and financial data are restricted personal information.
              Access is role-based and audited; view or export only what is required for your duties, and never
              share credentials or personal information with unauthorised parties. This page does not display
              tenant identity numbers or financial records.
            </p>
            <Link to="/control-center" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold hover:underline">
              Review the audit log <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
