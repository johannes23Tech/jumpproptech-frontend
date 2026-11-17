import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Building2, Key, ShieldCheck, TrendingUp, UserCog, Users } from 'lucide-react';
import { roleLabel } from '../config/roles';

type StaffSummary = {
  id: number;
  full_name: string;
  email: string;
  staff_role?: string | null;
  role?: string;
  is_active?: number | boolean;
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSuperAdminStats()
      .then((data) => setStats(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'System statistics could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading system overview...</div>;
  if (!stats) return <div className="p-8 text-center text-danger">{error || 'Access denied.'}</div>;

  const recent: StaffSummary[] = Array.isArray(stats.recent_signups) ? stats.recent_signups : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-charcoal to-black p-6 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gold p-3">
              <ShieldCheck size={32} className="text-black" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-ivory">System Overview</h1>
              <p className="text-sm text-gold-light">Internal portfolio and account summary.</p>
            </div>
          </div>
          <Link
            to="/staff"
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-black hover:opacity-90"
          >
            <UserCog size={16} /> Manage Staff
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500"><Users size={18} /> Staff</div>
          <p className="font-display text-3xl font-bold text-black">{stats.total_staff ?? stats.total_landlords ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500"><Building2 size={18} /> Properties</div>
          <p className="font-display text-3xl font-bold text-black">{stats.total_properties ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500"><Key size={18} /> Units</div>
          <p className="font-display text-3xl font-bold text-black">{stats.total_units ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gold/30 bg-gold/10 p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gold-dark"><TrendingUp size={18} /> Rent Processed</div>
          <p className="font-display text-2xl font-bold text-gold-dark">R {stats.total_rent_processed ?? 0}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">Recent staff accounts</h3>
          <Link to="/staff" className="text-xs font-bold text-gold-dark hover:underline">View all staff</Link>
        </div>
        <div className="space-y-3">
          {recent.map((member) => {
            const active = member.is_active === undefined ? true : Boolean(Number(member.is_active));
            return (
              <div key={member.id} className="flex flex-col justify-between gap-2 rounded-lg border border-gray-100 bg-ivory p-4 md:flex-row md:items-center">
                <div>
                  <p className="font-bold text-black">{member.full_name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-bold uppercase text-gray-600">
                    {roleLabel(member.staff_role || member.role)}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            );
          })}
          {recent.length === 0 && <p className="text-gray-500">No staff accounts yet.</p>}
        </div>
      </div>
    </div>
  );
}
