import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import TiltCard from '../components/TiltCard';
import BarChart from '../components/BarChart';
import Skeleton from '../components/Skeleton';
import { ShieldCheck, FileSearch, TrendingUp, AlertCircle, Building2, Wrench, ArrowRight, Eye } from 'lucide-react';

const formatZar = (v: number) => `R ${Number(v || 0).toLocaleString('en-ZA')}`;

function Meter({ value, tone = 'gold' }: { value: number; tone?: 'gold' | 'success' | 'warning' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const cls = tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-gold';
  return (
    <div className="mt-3">
      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full ${cls} transition-all`} style={{ width: `${pct}%` }} /></div>
      <p className="mt-1 text-[11px] font-semibold text-gray-500">{pct}%</p>
    </div>
  );
}

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

  const derived = useMemo(() => {
    const totalUnits = Number(stats?.total_units || 0);
    const occupied = Number(stats?.occupied || 0);
    const collected = Number(stats?.collected || 0);
    const pending = Number(stats?.pending || 0);
    const occupancyRate = totalUnits ? (occupied / totalUnits) * 100 : 0;
    const totalMoney = collected + pending;
    const collectionRate = totalMoney ? (collected / totalMoney) * 100 : 0;
    return { totalUnits, occupied, collected, pending, occupancyRate, collectionRate };
  }, [stats]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal via-black to-charcoal p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold opacity-10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs text-gold tracking-widest uppercase mb-2 font-semibold"><Eye size={14} /> Auditor (Read-only)</p>
            <h1 className="font-display text-3xl md:text-4xl text-ivory mb-2">Audit & Oversight Dashboard</h1>
            <p className="text-gray-400 text-sm max-w-2xl">Welcome, {user?.full_name?.split(' ')[0]}. Review portfolio, financial and operational indicators within your authorized, read-only access.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-gold/20 bg-gold/10 px-4 py-3 text-gold">
            <ShieldCheck size={18} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Access mode</p>
              <p className="text-sm text-ivory font-semibold">Read-only oversight</p>
            </div>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? <><Skeleton /><Skeleton /><Skeleton /><Skeleton /></> : <>
          <TiltCard>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-gray-500"><Building2 size={16} /><p className="text-xs font-bold uppercase tracking-wider">Properties</p></div><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Portfolio</span></div>
            <p className="font-display text-3xl font-bold text-black">{stats?.total_properties ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Properties in scope</p>
          </TiltCard>
          <TiltCard>
            <div className="flex items-center justify-between mb-2"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Units / Occupancy</p><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/10 text-gold">{Math.round(derived.occupancyRate) || 0}%</span></div>
            <p className="font-display text-2xl font-bold text-black">{derived.occupied} <span className="text-base text-gray-400 font-sans">/ {derived.totalUnits}</span></p>
            <p className="text-xs text-gray-500 mt-1">Occupied / Total units</p>
            <Meter value={derived.occupancyRate} tone="gold" />
          </TiltCard>
          <TiltCard>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-success"><TrendingUp size={16} /><p className="text-xs font-bold uppercase tracking-wider">Collected</p></div><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">Received</span></div>
            <p className="font-display text-2xl font-bold text-black">{loading ? '…' : formatZar(derived.collected)}</p>
            <Meter value={derived.collectionRate} tone="success" />
          </TiltCard>
          <TiltCard>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-warning"><AlertCircle size={16} /><p className="text-xs font-bold uppercase tracking-wider">Outstanding</p></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${derived.pending > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{derived.pending > 0 ? 'Review' : 'Clear'}</span></div>
            <p className="font-display text-2xl font-bold text-black">{loading ? '…' : formatZar(derived.pending)}</p>
            <p className="text-xs text-gray-500 mt-2">Balances requiring oversight</p>
          </TiltCard>
        </>}
      </div>

      {loading ? <Skeleton type="chart" /> : stats?.chart_data ? <BarChart data={stats.chart_data} /> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/rent" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium hover:border-gold/30 transition-all">
          <div className="flex items-start justify-between"><div className="flex items-center gap-3 mb-2"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors"><FileSearch size={18} /></span><div><h3 className="font-bold">Rent & Payments</h3><p className="text-xs text-gray-500">Review records, statuses and receipts (as permitted).</p></div></div><ArrowRight size={16} className="text-gray-300 group-hover:text-gold" /></div>
        </Link>
        <Link to="/maintenance" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium hover:border-gold/30 transition-all">
          <div className="flex items-start justify-between"><div className="flex items-center gap-3 mb-2"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors"><Wrench size={18} /></span><div><h3 className="font-bold">Maintenance & Expenses</h3><p className="text-xs text-gray-500">Inspect work orders and expense records.</p></div></div><ArrowRight size={16} className="text-gray-300 group-hover:text-gold" /></div>
        </Link>
        <div className="rounded-2xl border border-gold/20 bg-gradient-to-b from-gold/10 to-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-black"><ShieldCheck size={18} /></span><h3 className="font-bold">Audit notes</h3></div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2"><span className="text-gold">•</span><span>This view is read-only; use authorized modules for evidence and verification.</span></li>
            <li className="flex gap-2"><span className="text-gold">•</span><span>Financial figures shown in ZAR (en-ZA) based on available data.</span></li>
            <li className="flex gap-2"><span className="text-gold">•</span><span>Sensitive system/security controls are managed in the Super Administrator Control Center.</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
