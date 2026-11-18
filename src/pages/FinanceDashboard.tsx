import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import TiltCard from '../components/TiltCard';
import { Wallet, AlertCircle, TrendingUp, Receipt, ClipboardList, PiggyBank } from 'lucide-react';

type RentRecord = {
  id: number;
  amount: number | string;
  status?: string;
  payment_status?: string;
  due_date?: string;
  month?: string;
  tenant_name?: string;
  unit_number?: string;
  property_name?: string;
};

const formatRand = (v: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(v || 0);

function statusOf(r: RentRecord) {
  return String(r.payment_status || r.status || '').toLowerCase();
}

export default function FinanceDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.getRentRecords();
        if (active) setRecords(Array.isArray(data) ? data : []);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load finance data.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const summary = useMemo(() => {
    let collected = 0, outstanding = 0, overdue = 0, pendingVerify = 0;
    for (const r of records) {
      const amt = Number(r.amount) || 0;
      const s = statusOf(r);
      if (s.includes('paid') || s.includes('verified')) collected += amt;
      if (s.includes('pending') || s.includes('submitted') || s.includes('await')) pendingVerify += amt;
      if (s.includes('overdue') || s.includes('arrear')) { overdue += amt; outstanding += amt; }
      if (!s.includes('paid') && !s.includes('verified') && !s.includes('reversed') && !s.includes('cancel')) outstanding += s.includes('overdue') || s.includes('arrear') ? 0 : 0;
    }
    // simpler outstanding: anything not paid/verified/reversed
    let notSettled = 0;
    for (const r of records) {
      const s = statusOf(r);
      if (!s.includes('paid') && !s.includes('verified') && !s.includes('reversed') && !s.includes('cancel')) notSettled += Number(r.amount) || 0;
    }
    outstanding = notSettled;
    return { collected, outstanding, overdue, pendingVerify, total: records.length };
  }, [records]);

  const attention = useMemo(() => {
    return records
      .filter((r) => {
        const s = statusOf(r);
        return s.includes('overdue') || s.includes('submitted') || s.includes('pending') || s.includes('await') || s.includes('reject');
      })
      .slice(0, 8);
  }, [records]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal to-black p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold opacity-10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <p className="text-xs text-gold tracking-widest uppercase mb-2 font-semibold">Finance / Accountant</p>
        <h1 className="font-display text-3xl text-ivory mb-2">Finance Dashboard</h1>
        <p className="text-gray-400 text-sm">Welcome, {user?.full_name?.split(' ')[0]}. Track collections, arrears, verifications, and expenses.</p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-success"><TrendingUp size={18} /><p className="text-xs font-bold uppercase tracking-wider">Collected / Verified</p></div>
          <p className="font-display text-2xl font-bold text-black">{loading ? '…' : formatRand(summary.collected)}</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-warning"><Wallet size={18} /><p className="text-xs font-bold uppercase tracking-wider">Outstanding</p></div>
          <p className="font-display text-2xl font-bold text-black">{loading ? '…' : formatRand(summary.outstanding)}</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-danger"><AlertCircle size={18} /><p className="text-xs font-bold uppercase tracking-wider">Overdue</p></div>
          <p className="font-display text-2xl font-bold text-black">{loading ? '…' : formatRand(summary.overdue)}</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-gold"><Receipt size={18} /><p className="text-xs font-bold uppercase tracking-wider">Pending / Submitted</p></div>
          <p className="font-display text-2xl font-bold text-black">{loading ? '…' : formatRand(summary.pendingVerify)}</p>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/rent" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><Wallet size={20} className="text-gold" /><h3 className="font-bold">Rent & Payments</h3></div>
          <p className="text-sm text-gray-500">Record cash, verify EFT proofs, reconcile and review arrears.</p>
        </Link>
        <Link to="/budgets" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><PiggyBank size={20} className="text-gold" /><h3 className="font-bold">Budgets & Expenses</h3></div>
          <p className="text-sm text-gray-500">Track expenses, approvals, suppliers and budgets.</p>
        </Link>
        <Link to="/tenancy" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><ClipboardList size={20} className="text-gold" /><h3 className="font-bold">Leases & Deposits</h3></div>
          <p className="text-sm text-gray-500">Review lease terms, deposits and financial obligations.</p>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold">Payments needing attention</h3>
          <Link to="/rent" className="text-sm font-semibold text-gold hover:underline">View all</Link>
        </div>
        {loading ? <p className="text-gray-500 text-sm">Loading…</p> : attention.length === 0 ? (
          <p className="text-gray-500 text-sm">No overdue or pending-verification payments right now.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {attention.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-black truncate">{r.tenant_name || `Record #${r.id}`} {r.unit_number ? `· ${r.unit_number}` : ''}</p>
                  <p className="text-xs text-gray-500 truncate">{r.property_name || ''} {r.month || r.due_date ? `· ${r.month || r.due_date}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-black">{formatRand(Number(r.amount) || 0)}</p>
                  <p className="text-[10px] uppercase font-bold text-warning">{String(r.payment_status || r.status || 'Pending')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
