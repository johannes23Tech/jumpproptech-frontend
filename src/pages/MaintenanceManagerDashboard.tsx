import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import TiltCard from '../components/TiltCard';
import { Wrench, AlertTriangle, Clock, CheckCircle2, ClipboardList, Wallet } from 'lucide-react';

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
    return { total, open, resolved, urgent };
  }, [tickets]);

  const recent = useMemo(() => tickets.slice(0, 8), [tickets]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal to-black p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold opacity-10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <p className="text-xs text-gold tracking-widest uppercase mb-2 font-semibold">Maintenance Manager</p>
        <h1 className="font-display text-3xl text-ivory mb-2">Maintenance Dashboard</h1>
        <p className="text-gray-400 text-sm">Welcome, {user?.full_name?.split(' ')[0]}. Monitor work orders, priorities, assignments, and resolution progress.</p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-gray-500"><ClipboardList size={18} /><p className="text-xs font-bold uppercase tracking-wider">Total</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : stats.total}</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-warning"><Clock size={18} /><p className="text-xs font-bold uppercase tracking-wider">Open / Active</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : stats.open}</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-danger"><AlertTriangle size={18} /><p className="text-xs font-bold uppercase tracking-wider">Urgent / High</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : stats.urgent}</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-success"><CheckCircle2 size={18} /><p className="text-xs font-bold uppercase tracking-wider">Resolved</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : stats.resolved}</p>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/maintenance" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><Wrench size={20} className="text-gold" /><h3 className="font-bold">Work Orders & Assignments</h3></div>
          <p className="text-sm text-gray-500">Triage, assign technicians, track progress and resolve cases.</p>
        </Link>
        <Link to="/budgets" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><Wallet size={20} className="text-gold" /><h3 className="font-bold">Maintenance Expenses</h3></div>
          <p className="text-sm text-gray-500">Review maintenance-related expenses, suppliers and budgets.</p>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold">Recent work orders</h3>
          <Link to="/maintenance" className="text-sm font-semibold text-gold hover:underline">Manage</Link>
        </div>
        {loading ? <p className="text-gray-500 text-sm">Loading…</p> : recent.length === 0 ? (
          <p className="text-gray-500 text-sm">No maintenance tickets yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-black truncate">{t.category || 'Maintenance'} · #{t.id}</p>
                  <p className="text-xs text-gray-500 truncate">{[t.property_name, t.unit_number, t.tenant_name].filter(Boolean).join(' · ') || t.description || '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-[10px] uppercase font-bold ${isResolved(t.status) ? 'text-success' : /urgent|high/i.test(`${t.priority || ''} ${t.severity || ''}`) ? 'text-danger' : 'text-warning'}`}>{t.status || 'Open'}</p>
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
