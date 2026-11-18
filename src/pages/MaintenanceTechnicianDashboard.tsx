import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import TiltCard from '../components/TiltCard';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Hammer } from 'lucide-react';

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

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal to-black p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold opacity-10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <p className="text-xs text-gold tracking-widest uppercase mb-2 font-semibold">Maintenance Technician</p>
        <h1 className="font-display text-3xl text-ivory mb-2">My Work Dashboard</h1>
        <p className="text-gray-400 text-sm">Welcome, {user?.full_name?.split(' ')[0]}. View and update your assigned maintenance tasks.</p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-warning"><Clock size={18} /><p className="text-xs font-bold uppercase tracking-wider">Active Tasks</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : queue.length}</p>
          <p className="text-xs text-gray-500 mt-1">Open / in progress work orders</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-danger"><AlertTriangle size={18} /><p className="text-xs font-bold uppercase tracking-wider">Urgent / High</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : urgent.length}</p>
          <p className="text-xs text-gray-500 mt-1">Prioritize these first</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-success"><CheckCircle2 size={18} /><p className="text-xs font-bold uppercase tracking-wider">Resolved</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : resolved.length}</p>
          <p className="text-xs text-gray-500 mt-1">Completed work orders</p>
        </TiltCard>
      </div>

      <Link to="/maintenance" className="block rounded-xl border border-gold/30 bg-gold/5 p-5 hover:bg-gold/10 transition-colors">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold text-black"><Hammer size={18} /></span>
          <div>
            <h3 className="font-bold text-black">Open Maintenance Workspace</h3>
            <p className="text-sm text-gray-600">View details, update status, add notes/costs and resolve assigned tasks.</p>
          </div>
        </div>
      </Link>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold">Active work queue</h3>
          <Link to="/maintenance" className="text-sm font-semibold text-gold hover:underline">View all</Link>
        </div>
        {loading ? <p className="text-gray-500 text-sm">Loading…</p> : queue.length === 0 ? (
          <div className="text-gray-500 text-sm flex items-center gap-2"><CheckCircle2 size={16} className="text-success" /> No active maintenance tasks right now.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {queue.slice(0, 10).map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-black truncate"><Wrench size={14} className="inline mr-1 text-gray-400" />{t.category || 'Maintenance'} · #{t.id}</p>
                  <p className="text-xs text-gray-500 truncate">{[t.property_name, t.unit_number].filter(Boolean).join(' · ') || t.description || '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-[10px] uppercase font-bold ${/urgent|high/i.test(`${t.priority || ''} ${t.severity || ''}`) ? 'text-danger' : 'text-warning'}`}>{t.status || 'Open'}</p>
                  {(t.priority || t.severity) && <p className="text-[10px] text-gray-400">{t.priority || t.severity}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
