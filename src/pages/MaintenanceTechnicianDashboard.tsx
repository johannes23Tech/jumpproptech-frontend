import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import TiltCard from '../components/TiltCard';
import Skeleton from '../components/Skeleton';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Hammer, ArrowRight, Filter } from 'lucide-react';

type Ticket = {
  id: number;
  status?: string;
  priority?: string;
  severity?: string;
  category?: string;
  description?: string;
  property_name?: string;
  unit_number?: string;
  created_at?: string;
};

const isOpen = (s?: string) => /open|pending|progress|assigned/i.test(s || '');
const isResolved = (s?: string) => /resolved|closed|complete/i.test(s || '');

export default function MaintenanceTechnicianDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'active' | 'urgent' | 'resolved'>('active');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.getMaintenanceData();
        const t = Array.isArray(data) ? data : (Array.isArray(data?.tickets) ? data.tickets : []);
        if (active) setTickets(t);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load your work queue.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const queue = useMemo(() => tickets.filter((t) => isOpen(t.status) && !isResolved(t.status)), [tickets]);
  const urgent = useMemo(() => queue.filter((t) => /urgent|high|emergency/i.test(`${t.priority || ''} ${t.severity || ''}`)), [queue]);
  const resolved = useMemo(() => tickets.filter((t) => isResolved(t.status)), [tickets]);

  const visible = view === 'urgent' ? urgent : view === 'resolved' ? resolved : queue;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal via-black to-charcoal p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold opacity-10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs text-gold tracking-widest uppercase mb-2 font-semibold"><Hammer size={14} /> Maintenance Technician</p>
            <h1 className="font-display text-3xl md:text-4xl text-ivory mb-2">My Work Queue</h1>
            <p className="text-gray-400 text-sm max-w-2xl">Welcome, {user?.full_name?.split(' ')[0]}. Focus on active jobs, prioritize urgent issues, and track completed work.</p>
          </div>
          <Link to="/maintenance" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold text-black font-bold px-5 py-3 hover:opacity-90 transition-opacity shadow-gold">
            <Wrench size={16} /> Open Workspace
          </Link>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? <><Skeleton /><Skeleton /><Skeleton /></> : <>
          <button type="button" onClick={() => setView('active')} className={`text-left rounded-2xl transition-all ${view === 'active' ? 'ring-2 ring-gold/40' : ''}`}>
            <TiltCard className={view === 'active' ? 'border-gold/30 bg-gold/5' : ''}>
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-warning"><Clock size={18} /><p className="text-xs font-bold uppercase tracking-wider">Active Tasks</p></div><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning">Queue</span></div>
              <p className="font-display text-3xl font-bold text-black">{queue.length}</p>
              <p className="text-xs text-gray-500 mt-1">Open / in progress work orders</p>
            </TiltCard>
          </button>
          <button type="button" onClick={() => setView('urgent')} className={`text-left rounded-2xl transition-all ${view === 'urgent' ? 'ring-2 ring-gold/40' : ''}`}>
            <TiltCard className={view === 'urgent' ? 'border-danger/30 bg-danger/5' : ''}>
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-danger"><AlertTriangle size={18} /><p className="text-xs font-bold uppercase tracking-wider">Urgent / High</p></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgent.length ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>{urgent.length ? 'Priority' : 'None'}</span></div>
              <p className="font-display text-3xl font-bold text-black">{urgent.length}</p>
              <p className="text-xs text-gray-500 mt-1">Prioritize these first</p>
            </TiltCard>
          </button>
          <button type="button" onClick={() => setView('resolved')} className={`text-left rounded-2xl transition-all ${view === 'resolved' ? 'ring-2 ring-gold/40' : ''}`}>
            <TiltCard className={view === 'resolved' ? 'border-success/30 bg-success/5' : ''}>
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-success"><CheckCircle2 size={18} /><p className="text-xs font-bold uppercase tracking-wider">Resolved</p></div><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">Done</span></div>
              <p className="font-display text-3xl font-bold text-black">{resolved.length}</p>
              <p className="text-xs text-gray-500 mt-1">Completed work orders</p>
            </TiltCard>
          </button>
        </>}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-xl font-bold capitalize">{view} work orders</h3>
            <p className="text-xs text-gray-500">Tap a card above to switch views, or open workspace to update status and notes.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"><Filter size={14} /> Showing {visible.length} item(s)</div>
        </div>

        {loading ? <div className="space-y-2"><Skeleton type="row" /><Skeleton type="row" /><Skeleton type="row" /></div> : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2"><CheckCircle2 size={20} className={view === 'resolved' ? 'text-gray-400' : 'text-success'} />{view === 'active' ? 'No active maintenance tasks right now.' : view === 'urgent' ? 'No urgent/high tasks at the moment.' : 'No resolved tasks recorded yet.'}</div>
        ) : (
          <ul className="space-y-2">
            {visible.slice(0, 12).map((t) => {
              const urgentState = /urgent|high|emergency/i.test(`${t.priority || ''} ${t.severity || ''}`) && !isResolved(t.status);
              const resolvedState = isResolved(t.status);
              return (
                <li key={t.id} className="group rounded-xl border border-gray-100 p-4 hover:border-gold/30 hover:bg-gold/5 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-black truncate"><Wrench size={14} className="inline mr-1 text-gray-400" />{t.category || 'Maintenance'} <span className="text-gray-400 font-normal">· #{t.id}</span></p>
                        {urgentState && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-danger/10 text-danger">Urgent</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{[t.property_name, t.unit_number].filter(Boolean).join(' · ') || t.description || 'No location details'}</p>
                      {t.description && (t.property_name || t.unit_number) && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{t.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${resolvedState ? 'bg-success/10 text-success' : urgentState ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>{t.status || 'Open'}</span>
                      {(t.priority || t.severity) && <p className="text-[10px] text-gray-400 mt-1">{t.priority || t.severity}</p>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">Update task status, add notes/costs, and mark work complete in the maintenance workspace.</p>
          <Link to="/maintenance" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold text-black font-bold px-4 py-2.5 hover:opacity-90 transition-opacity text-sm">Go to Maintenance <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
}
