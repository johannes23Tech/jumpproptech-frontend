import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import TiltCard from '../components/TiltCard';
import BarChart from '../components/BarChart';
import { ShieldCheck, FileSearch, TrendingUp, AlertCircle, Building2, Wrench } from 'lucide-react';

export default function AuditorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.getDashboardStats();
        if (active) setStats(data || null);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load audit overview data.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal to-black p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold opacity-10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <p className="text-xs text-gold tracking-widest uppercase mb-2 font-semibold">Auditor (Read-only)</p>
        <h1 className="font-display text-3xl text-ivory mb-2">Audit & Oversight Dashboard</h1>
        <p className="text-gray-400 text-sm">Welcome, {user?.full_name?.split(' ')[0]}. Review portfolio, financial and operational indicators within your authorized access.</p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-gray-500"><Building2 size={16} /><p className="text-xs font-bold uppercase tracking-wider">Properties</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : (stats?.total_properties ?? '—')}</p>
        </TiltCard>
        <TiltCard>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Units / Occupancy</p>
          <p className="font-display text-xl font-bold text-black">{loading ? '…' : `${stats?.occupied ?? 0} / ${stats?.total_units ?? 0}`}</p>
          <p className="text-xs text-gray-500 mt-1">Occupied / Total</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-success"><TrendingUp size={16} /><p className="text-xs font-bold uppercase tracking-wider">Collected</p></div>
          <p className="font-display text-2xl font-bold text-black">{loading ? '…' : `R ${stats?.collected ?? 0}`}</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-warning"><AlertCircle size={16} /><p className="text-xs font-bold uppercase tracking-wider">Outstanding</p></div>
          <p className="font-display text-2xl font-bold text-black">{loading ? '…' : `R ${stats?.pending ?? 0}`}</p>
        </TiltCard>
      </div>

      {stats?.chart_data && <BarChart data={stats.chart_data} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/rent" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><FileSearch size={20} className="text-gold" /><h3 className="font-bold">Rent & Payments</h3></div>
          <p className="text-sm text-gray-500">Review payment records, statuses and receipts (read-only as permitted).</p>
        </Link>
        <Link to="/maintenance" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><Wrench size={20} className="text-gold" /><h3 className="font-bold">Maintenance & Expenses</h3></div>
          <p className="text-sm text-gray-500">Inspect work orders and expense records for compliance/oversight.</p>
        </Link>
        <div className="rounded-xl border border-gold/20 bg-gold/5 p-5">
          <div className="flex items-center gap-3 mb-2"><ShieldCheck size={20} className="text-gold" /><h3 className="font-bold">Audit Notes</h3></div>
          <p className="text-sm text-gray-700">This dashboard is read-only. Use authorized views and exports for evidence; sensitive system/security controls are managed in the Super Administrator Control Center.</p>
        </div>
      </div>
    </div>
  );
}
