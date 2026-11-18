import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import TiltCard from '../components/TiltCard';
import Skeleton from '../components/Skeleton';
import { Wrench, AlertTriangle, Clock, CheckCircle2, ClipboardList, Wallet, ArrowRight, Search, Filter } from 'lucide-react';

type Ticket = {
  id: number;
  status?: string;
  priority?: string;
  severity?: string;
  category?: string;
  description?: string;
  property_name?: string;
  unit_number?: string;
  tenant_name?: string;
  created_at?: string;
};

const isOpen = (s?: string) => /open|pending|progress|assigned/i.test(s || '');
const isResolved = (s?: string) => /resolved|closed|complete/i.test(s || '');

export default function MaintenanceManagerDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'urgent' | 'resolved'>('all');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.getMaintenanceData();
        const t = Array.isArray(data) ? data : (Array.isArray(data?.tickets) ? data.tickets : []);
        if (active) setTickets(t);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load maintenance data.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => isOpen(t.status) && !isResolved(t.status)).length;
    const resolved = tickets.filter((t) => isResolved(t.status)).length;
    const urgent = tickets.filter((t) => /urgent|high|emergency/i.test(`${t.priority || ''} ${t.severity || ''}`) && isOpen(t.status)).length;
    const resolutionRate = total ? (resolved / total) * 100 : 0;
    return { total, open, resolved, urgent, resolutionRate };
  }, [tickets]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      const openState = isOpen(t.status) && !isResolved(t.status);
      const resolvedState = isResolved(t.status);
      const urgentState = /urgent|high|emergency/i.test(`${t.priority || ''} ${t.severity || ''}`) && openState;
      if (filter === 'open' && !openState) return false;
      if (filter === 'urgent' && !urgentState) return false;
      if (filter === 'resolved' && !resolvedState) return false;
      if (!q) return true;
      const hay = [t.id, t.category, t.description, t.status, t.priority, t.severity, t.property_name, t.unit_number, t.tenant_name].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    }).slice(0, 10);
  }, [tickets, query, filter]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal via-black to-charcoal p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold opacity-10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs text-gold tracking-widest uppercase mb-2 font-semibold"><Wrench size={14} /> Maintenance Manager</p>
            <h1 className="font-display text-3xl md:text-4xl text-ivory mb-2">Maintenance Operations</h1>
            <p className="text-gray-400 text-sm max-w-2xl">Welcome, {user?.full_name?.split(' ')[0]}. Triage requests, track priorities, coordinate technicians, and monitor resolution progress.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4 min-w-[240px]">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Resolution rate</p>
            <p className="font-display text-3xl text-ivory font-bold">{stats.total ? `${Math.round(stats.resolutionRate)}%` : '—'}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.resolved} resolved of {stats.total} tickets</p>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? <><Skeleton /><Skeleton /><Skeleton /><Skeleton /></> : <>
          <TiltCard>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-gray-500"><ClipboardList size={18} /><p className="text-xs font-bold uppercase tracking-wider">Total</p></div><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">All</span></div>
            <p className="font-display text-3xl font-bold text-black">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Work orders in view</p>
          </TiltCard>
          <TiltCard>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-warning"><Clock size={18} /><p className="text-xs font-bold uppercase tracking-wider">Open / Active</p></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stats.open ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{stats.open ? 'In progress' : 'Clear'}</span></div>
            <p className="font-display text-3xl font-bold text-black">{stats.open}</p>
            <div className="mt-3 h-2.5 w-full rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-warning transition-all" style={{ width: `${stats.total ? (stats.open / stats.total) * 100 : 0}%` }} /></div>
          </TiltCard>
          <TiltCard>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-danger"><AlertTriangle size={18} /><p className="text-xs font-bold uppercase tracking-wider">Urgent / High</p></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stats.urgent ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>{stats.urgent ? 'Priority' : 'None'}</span></div>
            <p className="font-display text-3xl font-bold text-black">{stats.urgent}</p>
            <p className="text-xs text-gray-500 mt-1">Open tickets requiring fast attention</p>
          </TiltCard>
          <TiltCard>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-success"><CheckCircle2 size={18} /><p className="text-xs font-bold uppercase tracking-wider">Resolved</p></div><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">Done</span></div>
            <p className="font-display text-3xl font-bold text-black">{stats.resolved}</p>
            <div className="mt-3 h-2.5 w-full rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-success transition-all" style={{ width: `${stats.resolutionRate}%` }} /></div>
          </TiltCard>
        </>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/maintenance" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium hover:border-gold/30 transition-all">
          <div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors"><Wrench size={18} /></span><div><h3 className="font-bold">Work Orders & Assignments</h3><p className="text-xs text-gray-500">Triage, assign technicians, update status and resolve cases.</p></div></div><ArrowRight size={16} className="text-gray-300 group-hover:text-gold" /></div>
        </Link>
        <Link to="/budgets" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium hover:border-gold/30 transition-all">
          <div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors"><Wallet size={18} /></span><div><h3 className="font-bold">Maintenance Expenses</h3><p className="text-xs text-gray-500">Review supplier costs, maintenance spend and budgets.</p></div></div><ArrowRight size={16} className="text-gray-300 group-hover:text-gold" /></div>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="font-display text-xl font-bold">Work order queue</h3>
            <p className="text-xs text-gray-500">Search and filter recent maintenance activity</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets..." className="w-full sm:w-56 rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-gold focus:bg-white" />
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
              <Filter size={14} className="ml-2 text-gray-400" />
              {(['all','open','urgent','resolved'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${filter === f ? 'bg-black text-gold shadow-sm' : 'text-gray-600 hover:bg-white'}`}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        {loading ? <div className="space-y-2"><Skeleton type="row" /><Skeleton type="row" /><Skeleton type="row" /></div> : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">No work orders match the current filters.</div>
        ) : (
          <ul className="space-y-2">
            {visible.map((t) => {
              const resolvedState = isResolved(t.status);
              const urgentState = /urgent|high|emergency/i.test(`${t.priority || ''} ${t.severity || ''}`) && !resolvedState;
              return (
                <li key={t.id} className="group flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-4 hover:border-gold/30 hover:bg-gold/5 transition-all">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-black truncate">{t.category || 'Maintenance'} <span className="text-gray-400 font-normal">· #{t.id}</span></p>
                      {urgentState && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-danger/10 text-danger">Urgent</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{[t.property_name, t.unit_number, t.tenant_name].filter(Boolean).join(' · ') || t.description || 'No location details'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-flex text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${resolvedState ? 'bg-success/10 text-success' : urgentState ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>{t.status || 'Open'}</span>
                    {(t.priority || t.severity) && <p className="text-[10px] text-gray-400 mt-1">{t.priority || t.severity}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <Link to="/maintenance" className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:underline">Manage all work orders <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
}
