import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import TiltCard from '../components/TiltCard';
import Skeleton from '../components/Skeleton';
import { Wallet, AlertCircle, TrendingUp, Receipt, ClipboardList, PiggyBank, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

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

function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="mt-3">
      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11px] font-semibold text-gray-500">{pct}% collected</p>
    </div>
  );
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
    let collected = 0;
    let outstanding = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    for (const r of records) {
      const amount = Number(r.amount) || 0;
      const s = statusOf(r);
      if (s.includes('paid') || s.includes('collected')) collected += amount;
      else {
        outstanding += amount;
        pendingCount += 1;
        if (s.includes('overdue') || s.includes('late')) overdueCount += 1;
      }
    }
    const total = collected + outstanding;
    const rate = total > 0 ? (collected / total) * 100 : 0;
    return { collected, outstanding, overdueCount, pendingCount, total: records.length, rate };
  }, [records]);

  const attention = useMemo(() => {
    return records
      .filter((r) => {
        const s = statusOf(r);
        return !(s.includes('paid') || s.includes('collected'));
      })
      .slice(0, 8);
  }, [records]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal via-black to-charcoal p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold opacity-10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs text-gold tracking-widest uppercase mb-2 font-semibold"><Wallet size={14} /> Finance / Accountant</p>
            <h1 className="font-display text-3xl md:text-4xl text-ivory mb-2">Finance Dashboard</h1>
            <p className="text-gray-400 text-sm max-w-2xl">Welcome, {user?.full_name?.split(' ')[0]}. Track collections, arrears, verifications and financial follow-ups in ZAR (en-ZA).</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4 min-w-[240px]">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Collection rate</p>
            <p className="font-display text-3xl text-ivory font-bold">{summary.total ? `${Math.round(summary.rate)}%` : '—'}</p>
            <p className="text-xs text-gray-400 mt-1">{formatRand(summary.collected)} collected of {formatRand(summary.collected + summary.outstanding)}</p>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? <><Skeleton /><Skeleton /><Skeleton /><Skeleton /></> : <>
          <TiltCard>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-success"><TrendingUp size={18} /><p className="text-xs font-bold uppercase tracking-wider">Collected</p></div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">Received</span>
            </div>
            <p className="font-display text-2xl md:text-3xl font-bold text-black">{formatRand(summary.collected)}</p>
            <Progress value={summary.rate} />
          </TiltCard>

          <TiltCard>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-warning"><AlertCircle size={18} /><p className="text-xs font-bold uppercase tracking-wider">Outstanding</p></div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${summary.pendingCount > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{summary.pendingCount} items</span>
            </div>
            <p className="font-display text-2xl md:text-3xl font-bold text-black">{formatRand(summary.outstanding)}</p>
            <p className="text-xs text-gray-500 mt-2">Unpaid, pending verification or overdue balances.</p>
          </TiltCard>

          <TiltCard>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-danger"><Clock size={18} /><p className="text-xs font-bold uppercase tracking-wider">Overdue flags</p></div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${summary.overdueCount > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>{summary.overdueCount > 0 ? 'Urgent' : 'None'}</span>
            </div>
            <p className="font-display text-3xl font-bold text-black">{summary.overdueCount}</p>
            <p className="text-xs text-gray-500 mt-1">Records marked overdue/late in current data.</p>
          </TiltCard>

          <TiltCard>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-600"><Receipt size={18} /><p className="text-xs font-bold uppercase tracking-wider">Rent records</p></div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Tracked</span>
            </div>
            <p className="font-display text-3xl font-bold text-black">{summary.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total rent/payment records in view.</p>
          </TiltCard>
        </>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/rent" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium hover:border-gold/30 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-2"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors"><ClipboardList size={18} /></span><div><h3 className="font-bold">Rent & Payments</h3><p className="text-xs text-gray-500">Verify EFT, record cash, manage arrears</p></div></div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gold" />
          </div>
        </Link>
        <Link to="/budgets" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium hover:border-gold/30 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-2"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors"><PiggyBank size={18} /></span><div><h3 className="font-bold">Budgets & Expenses</h3><p className="text-xs text-gray-500">Track allocations and spend</p></div></div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gold" />
          </div>
        </Link>
        <Link to="/tenancy" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium hover:border-gold/30 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-2"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors"><ShieldCheck size={18} /></span><div><h3 className="font-bold">Tenancy & Deposits</h3><p className="text-xs text-gray-500">Leases, deposits and obligations</p></div></div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gold" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl font-bold">Items needing attention</h3>
              <p className="text-xs text-gray-500">Unpaid or pending rent records (top {attention.length || 0})</p>
            </div>
            <Link to="/rent" className="text-sm font-semibold text-gold hover:underline">Open rent</Link>
          </div>
          {loading ? <div className="space-y-2"><Skeleton type="row" /><Skeleton type="row" /></div> : attention.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500 flex flex-col items-center gap-2"><TrendingUp size={20} className="text-success" />No outstanding rent items in the current data.</div>
          ) : (
            <ul className="space-y-2">
              {attention.map((r) => {
                const s = statusOf(r);
                const isLate = s.includes('overdue') || s.includes('late');
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 hover:border-gold/30 hover:bg-gold/5 transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-black truncate">{r.tenant_name || 'Tenant'} {r.unit_number ? `· Unit ${r.unit_number}` : ''}</p>
                      <p className="text-xs text-gray-500 truncate">{[r.property_name, r.month, r.due_date ? `Due ${r.due_date}` : ''].filter(Boolean).join(' · ') || 'Rent obligation'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-black">{formatRand(Number(r.amount) || 0)}</p>
                      <span className={`inline-flex text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isLate ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>{String(r.payment_status || r.status || 'Pending').replace(/_/g, ' ')}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
          <h3 className="font-display text-xl font-bold mb-4">Finance checklist</h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="mt-0.5 text-gold"><ShieldCheck size={16} /></span><div><p className="font-semibold text-black">Verify EFT against proof</p><p className="text-xs text-gray-500">Confirm funds cleared before marking paid/issuing receipts.</p></div></li>
            <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="mt-0.5 text-gold"><Receipt size={16} /></span><div><p className="font-semibold text-black">Receipts & reversals</p><p className="text-xs text-gray-500">Receipts are sequential; reversals are reasoned and append-only.</p></div></li>
            <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="mt-0.5 text-gold"><AlertCircle size={16} /></span><div><p className="font-semibold text-black">Arrears follow-up</p><p className="text-xs text-gray-500">Prioritize overdue items and keep communication auditable.</p></div></li>
            <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="mt-0.5 text-gold"><Wallet size={16} /></span><div><p className="font-semibold text-black">Full payments only</p><p className="text-xs text-gray-500">Record full rent amounts (cash by authorized staff only).</p></div></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
