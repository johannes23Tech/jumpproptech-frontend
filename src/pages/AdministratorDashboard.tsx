import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Building2, Key, Users, TrendingUp, ClipboardList, Wrench, Wallet, ShieldCheck } from 'lucide-react';

export default function AdministratorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    // Reuse existing dashboard stats for an operational/admin overview.
    api.getDashboardStats()
      .then((data) => { if (active) setStats(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Dashboard could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading admin dashboard...</div>;
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;

  const s = stats || {};
  const cards = [
    { label: 'Properties', value: s.total_properties ?? 0, icon: Building2, to: '/properties' },
    { label: 'Units', value: s.total_units ?? 0, icon: Key, to: '/units' },
    { label: 'Tenants', value: s.total_tenants ?? s.active_tenants ?? 0, icon: Users, to: '/tenants' },
    { label: 'Rent (overview)', value: s.total_rent_collected != null ? `R ${s.total_rent_collected}` : '—', icon: Wallet, to: '/rent' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-charcoal to-black p-6 shadow-2xl">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">Administration</p>
            <h1 className="font-display text-3xl font-bold text-ivory">Administrator Dashboard</h1>
            <p className="text-sm text-gray-300 mt-1">Operational oversight and portfolio administration.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/staff" className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-black hover:opacity-90">Manage Staff</Link>
            <Link to="/security" className="rounded-lg border border-gold/40 px-4 py-2 text-sm font-bold text-gold-light hover:bg-gold/10">Security</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} to={c.to} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
              <div className="mb-2 flex items-center gap-2 text-gray-500"><Icon size={18} /> {c.label}</div>
              <p className="font-display text-2xl font-bold text-black">{c.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/applications" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><ClipboardList size={20} className="text-gold" /><h3 className="font-bold">Applications</h3></div>
          <p className="text-sm text-gray-500">Review and approve unit-scoped onboarding applications.</p>
        </Link>
        <Link to="/maintenance" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><Wrench size={20} className="text-gold" /><h3 className="font-bold">Maintenance & Expenses</h3></div>
          <p className="text-sm text-gray-500">Oversee work orders, expenses, suppliers and budgets.</p>
        </Link>
        <Link to="/staff" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><ShieldCheck size={20} className="text-gold" /><h3 className="font-bold">Staff & Access</h3></div>
          <p className="text-sm text-gray-500">Manage internal staff accounts and approved roles.</p>
        </Link>
      </div>

      <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-gray-700">
        <div className="flex items-center gap-2 font-semibold text-black mb-1"><TrendingUp size={16} className="text-gold" /> Operational scope</div>
        <p>As Administrator you can manage portfolio operations (properties, units, tenants, tenancies, rent, maintenance/expenses) and staff administration. Platform-level security monitoring and sensitive system controls are reserved for the Super Administrator Control Center.</p>
      </div>
    </div>
  );
}
