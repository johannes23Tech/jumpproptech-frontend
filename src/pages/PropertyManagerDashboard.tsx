import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import BarChart from '../components/BarChart';
import TiltCard from '../components/TiltCard';
import { Building2, TrendingUp, AlertCircle, Key, Users, ClipboardList, Home, ArrowRight, Wrench, Wallet, Sparkles } from 'lucide-react';

const formatZar = (v: number) => `R ${Number(v || 0).toLocaleString('en-ZA')}`;

function Progress({ value, tone = 'gold' }: { value: number; tone?: 'gold' | 'success' | 'warning' | 'danger' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const toneClass = tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : tone === 'danger' ? 'bg-danger' : 'bg-gold';
  return (
    <div className="mt-3">
      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${toneClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11px] font-semibold text-gray-500">{pct}%</p>
    </div>
  );
}

export default function PropertyManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.getDashboardStats();
        if (active && data) setStats(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load dashboard data.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const metrics = useMemo(() => {
    const totalUnits = Number(stats?.total_units || 0);
    const occupied = Number(stats?.occupied || 0);
    const occupancyRate = totalUnits > 0 ? (occupied / totalUnits) * 100 : 0;
    const collected = Number(stats?.collected || 0);
    const pending = Number(stats?.pending || 0);
    const totalMoney = collected + pending;
    const collectionRate = totalMoney > 0 ? (collected / totalMoney) * 100 : 0;
    const vacant = Math.max(0, totalUnits - occupied);
    return { totalUnits, occupied, occupancyRate, collected, pending, collectionRate, vacant };
  }, [stats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-3xl skeleton" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton /><Skeleton /><Skeleton /><Skeleton />
        </div>
        <Skeleton type="chart" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}
        <EmptyState
          icon={<Home size={40} />}
          title="Portfolio dashboard unavailable"
          description="We couldn't load your property management overview right now. Check your connection or permissions and try again."
          action={<button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-black hover:opacity-90">Retry</button>}
        />
      </div>
    );
  }

  const quickActions = [
    { to: '/properties', label: 'Properties', desc: 'Buildings & portfolio details', icon: Building2, badge: stats.total_properties ?? 0 },
    { to: '/units', label: 'Units', desc: 'Rooms, pricing & QR setup', icon: Key, badge: stats.total_units ?? 0 },
    { to: '/tenants', label: 'Tenants', desc: 'Accounts & occupancy', icon: Users, badge: stats.occupied ?? 0 },
    { to: '/applications', label: 'Applications', desc: 'Review onboarding requests', icon: ClipboardList },
    { to: '/rent', label: 'Rent', desc: 'Collections & arrears', icon: Wallet },
    { to: '/maintenance', label: 'Maintenance', desc: 'Work orders & follow-ups', icon: Wrench },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal via-black to-charcoal p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold opacity-10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs text-gold tracking-widest uppercase mb-2 font-semibold"><Sparkles size={14} /> Property / Project Manager</p>
            <h1 className="font-display text-3xl md:text-4xl text-ivory mb-2">Portfolio Overview</h1>
            <p className="text-gray-400 text-sm max-w-2xl">Welcome, {user?.full_name?.split(' ')[0]}. Track occupancy, collections, and operational priorities across your assigned portfolio.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Occupancy</p>
              <p className="font-display text-2xl text-ivory font-bold">{metrics.totalUnits ? `${Math.round(metrics.occupancyRate)}%` : '—'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Collection</p>
              <p className="font-display text-2xl text-ivory font-bold">{(metrics.collected + metrics.pending) ? `${Math.round(metrics.collectionRate)}%` : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TiltCard>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-500"><Building2 size={18} /><p className="text-xs font-bold uppercase tracking-wider">Properties</p></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Portfolio</span>
          </div>
          <p className="font-display text-3xl font-bold text-black">{stats.total_properties ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Active properties in view</p>
        </TiltCard>

        <TiltCard>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gold"><Key size={18} /><p className="text-xs font-bold uppercase tracking-wider">Occupancy</p></div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${metrics.vacant > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{metrics.vacant} vacant</span>
          </div>
          <p className="font-display text-3xl font-bold text-black">{metrics.occupied} <span className="text-lg text-gray-400 font-sans">/ {metrics.totalUnits}</span></p>
          <Progress value={metrics.occupancyRate} tone={metrics.occupancyRate >= 85 ? 'success' : metrics.occupancyRate >= 60 ? 'gold' : 'warning'} />
        </TiltCard>

        <TiltCard>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-success"><TrendingUp size={18} /><p className="text-xs font-bold uppercase tracking-wider">Collected</p></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">This month</span>
          </div>
          <p className="font-display text-2xl md:text-3xl font-bold text-black">{formatZar(metrics.collected)}</p>
          <Progress value={metrics.collectionRate} tone="success" />
        </TiltCard>

        <TiltCard>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-warning"><AlertCircle size={18} /><p className="text-xs font-bold uppercase tracking-wider">Outstanding</p></div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${metrics.pending > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{metrics.pending > 0 ? 'Action needed' : 'Clear'}</span>
          </div>
          <p className="font-display text-2xl md:text-3xl font-bold text-black">{formatZar(metrics.pending)}</p>
          <p className="text-xs text-gray-500 mt-2">Follow up on unpaid or pending amounts.</p>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {stats.chart_data ? <BarChart data={stats.chart_data} /> : (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium h-full min-h-[220px] flex items-center justify-center text-sm text-gray-500">No chart data available for this period.</div>
          )}
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold">Operational focus</h3>
            <span className="text-[10px] uppercase tracking-wider font-bold text-gold bg-gold/10 px-2 py-1 rounded-full">Live overview</span>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full ${metrics.pending > 0 ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}><Wallet size={14} /></span>
              <div>
                <p className="font-semibold text-black">Rent follow-up</p>
                <p className="text-gray-500">{metrics.pending > 0 ? `${formatZar(metrics.pending)} outstanding — review arrears and reminders.` : 'Collections are up to date based on current data.'}</p>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full ${metrics.vacant > 0 ? 'bg-gold/15 text-gold' : 'bg-success/15 text-success'}`}><Home size={14} /></span>
              <div>
                <p className="font-semibold text-black">Occupancy</p>
                <p className="text-gray-500">{metrics.vacant > 0 ? `${metrics.vacant} unit(s) vacant — check listings, onboarding and readiness.` : 'All tracked units are occupied.'}</p>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-gray-700"><ClipboardList size={14} /></span>
              <div>
                <p className="font-semibold text-black">Daily operations</p>
                <p className="text-gray-500">Review applications, maintenance progress, and unit readiness from quick actions below.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl font-bold">Quick actions</h3>
          <p className="text-xs text-gray-500">Jump to key management areas</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium hover:border-gold/30 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors"><a.icon size={18} /></span>
                  <div>
                    <h4 className="font-bold text-black">{a.label}</h4>
                    <p className="text-xs text-gray-500">{a.desc}</p>
                  </div>
                </div>
                {a.badge !== undefined && <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-700">{a.badge}</span>}
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-gold opacity-80 group-hover:opacity-100">Open <ArrowRight size={14} className="ml-1" /></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
