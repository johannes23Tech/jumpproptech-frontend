import { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/roles';
import { AlertCircle, Banknote, CheckCircle, Clock, CreditCard, ExternalLink, Mail, RotateCcw, Search, ShieldCheck, Wallet, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import TiltCard from '../components/TiltCard';
import Skeleton from '../components/Skeleton';

type RentStatus =
  | 'Pending'
  | 'Overdue'
  | 'Submitted'
  | 'PendingVerification'
  | 'Paid'
  | 'Rejected'
  | 'Reversed';

type RentPayment = {
  id: number;
  method: 'cash' | 'eft';
  status: 'submitted' | 'verified' | 'rejected' | 'reversed';
  proof_url: string | null;
  reference: string | null;
  submitted_at: string;
  rejection_reason: string | null;
};

type RentRecord = {
  id: number;
  tenant_id: number;
  tenant_name: string;
  tenant_email: string;
  unit_number: string;
  property_name: string;
  month_for: string;
  due_date: string | null;
  amount: number;
  status: RentStatus;
  effective_status: RentStatus;
  payment_method: string | null;
  paid_date: string | null;
  receipt_number: string | null;
  pending_proofs: number;
  payments: RentPayment[];
};

type Filter = 'all' | 'unpaid' | 'verification' | 'paid' | 'arrears';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'verification', label: 'Awaiting verification' },
  { id: 'paid', label: 'Paid' },
  { id: 'arrears', label: 'Arrears' },
];

const STATUS_STYLES: Record<string, string> = {
  Paid: 'bg-success/10 text-success border-success/20',
  Pending: 'bg-warning/10 text-warning border-warning/20',
  Overdue: 'bg-danger/10 text-danger border-danger/20',
  Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  PendingVerification: 'bg-blue-50 text-blue-700 border-blue-200',
  Rejected: 'bg-danger/10 text-danger border-danger/20',
  Reversed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const isUnpaid = (record: RentRecord): boolean =>
  ['Pending', 'Overdue', 'Rejected', 'Reversed', 'Submitted', 'PendingVerification'].includes(record.effective_status);

const money = (value: number | string): string =>
  `R ${Number(value).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMonth = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
};

export default function Rent() {
  const { user } = useAuth();
  const canRecordCash = hasPermission(user, 'payments.record_cash');
  const canVerifyEft = hasPermission(user, 'payments.verify_eft');
  const canReverse = hasPermission(user, 'payments.reverse');

  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RentRecord | null>(null);
  const [mode, setMode] = useState<'cash' | 'verify' | 'reject' | 'reverse' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [emailingId, setEmailingId] = useState<number | null>(null);

  const fetchRent = async (): Promise<boolean> => {
    try {
      const data = await api.getRentRecords();
      setRecords(Array.isArray(data) ? data : []);
      setLoadError('');
      return true;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load rent records.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRent();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((record) => {
      let byFilter = true;
      switch (filter) {
        case 'unpaid':
          byFilter = isUnpaid(record);
          break;
        case 'verification':
          byFilter = record.effective_status === 'Submitted' || record.effective_status === 'PendingVerification';
          break;
        case 'paid':
          byFilter = record.effective_status === 'Paid';
          break;
        case 'arrears':
          byFilter = record.effective_status === 'Overdue';
          break;
        default:
          byFilter = true;
      }
      if (!byFilter) return false;
      if (!q) return true;
      const hay = [record.tenant_name, record.tenant_email, record.property_name, record.unit_number, record.month_for, record.receipt_number, record.effective_status]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [records, filter, search]);

  const emailReceipt = async (record: RentRecord) => {
    if (!record.receipt_number || !record.tenant_email || emailingId !== null) return;
    setEmailingId(record.id);
    try {
      await api.sendReceiptEmail({ email: record.tenant_email, receipt_number: record.receipt_number });
      setToast({ message: `Receipt ${record.receipt_number} emailed to ${record.tenant_email}.`, type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Could not email the receipt.', type: 'error' });
    } finally {
      setEmailingId(null);
    }
  };

  const openModal = (record: RentRecord, nextMode: 'cash' | 'verify' | 'reject' | 'reverse') => {
    setSelected(record);
    setMode(nextMode);
    setReason('');
    setModalError('');
  };

  const closeModal = () => {
    if (submitting) return;
    setSelected(null);
    setMode(null);
    setReason('');
    setModalError('');
  };

  const submit = async () => {
    if (!selected || !mode) return;
    setSubmitting(true);
    setModalError('');
    try {
      let message = 'Payment updated.';
      if (mode === 'cash') {
        const result = await api.recordCashPayment(selected.id);
        message = `Cash payment recorded. Receipt ${result.receipt_number}.`;
      } else if (mode === 'verify') {
        const result = await api.verifyEftPayment(selected.id);
        message = `EFT verified. Receipt ${result.receipt_number}.`;
      } else if (mode === 'reject') {
        await api.rejectEftPayment(selected.id, reason);
        message = 'Proof of payment rejected.';
      } else if (mode === 'reverse') {
        await api.reverseRentPayment(selected.id, reason);
        message = 'Payment reversed and receipt voided.';
      }
      const refreshed = await fetchRent();
      setToast({
        message: refreshed ? message : `${message} The list could not be refreshed.`,
        type: refreshed ? 'success' : 'error',
      });
      setSelected(null);
      setMode(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'The payment could not be updated.');
    } finally {
      setSubmitting(false);
    }
  };

  const proof = selected?.payments?.find((payment) => payment.status === 'submitted') ?? selected?.payments?.[0] ?? null;
  const unpaidCount = records.filter(isUnpaid).length;
  const verificationCount = records.filter(
    (record) => record.effective_status === 'Submitted' || record.effective_status === 'PendingVerification',
  ).length;
  const paidCount = records.filter((r) => r.effective_status === 'Paid').length;
  const arrearsCount = records.filter((r) => r.effective_status === 'Overdue').length;
  const totalOutstanding = useMemo(() => records.filter(isUnpaid).reduce((sum, r) => sum + Number(r.amount || 0), 0), [records]);

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-gradient-to-r from-charcoal via-black to-charcoal p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold opacity-10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs text-gold tracking-widest uppercase mb-2 font-semibold"><Wallet size={14} /> Rent & Payments</p>
            <h1 className="font-display text-3xl md:text-4xl text-ivory mb-2">Collections & Verification</h1>
            <p className="text-gray-400 text-sm max-w-2xl">Record cash, verify EFT proofs, manage arrears and issue receipts. Full payments only · ZAR (en-ZA).</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3 min-w-[160px]">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Outstanding</p>
              <p className="font-display text-2xl text-ivory font-bold">{money(totalOutstanding)}</p>
            </div>
            <button
              type="button"
              onClick={() => { setLoading(true); void fetchRent(); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 text-ivory px-4 py-3 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? <><Skeleton /><Skeleton /><Skeleton /><Skeleton /></> : <>
          <TiltCard><div className="flex items-center gap-2 text-warning mb-1"><Clock size={16} /><p className="text-xs font-bold uppercase tracking-wider">Unpaid</p></div><p className="font-display text-3xl font-bold text-black">{unpaidCount}</p><p className="text-xs text-gray-500 mt-1">Pending / overdue items</p></TiltCard>
          <TiltCard><div className="flex items-center gap-2 text-blue-600 mb-1"><ShieldCheck size={16} /><p className="text-xs font-bold uppercase tracking-wider">Awaiting verification</p></div><p className="font-display text-3xl font-bold text-black">{verificationCount}</p><p className="text-xs text-gray-500 mt-1">EFT proofs to review</p></TiltCard>
          <TiltCard><div className="flex items-center gap-2 text-danger mb-1"><AlertCircle size={16} /><p className="text-xs font-bold uppercase tracking-wider">Arrears</p></div><p className="font-display text-3xl font-bold text-black">{arrearsCount}</p><p className="text-xs text-gray-500 mt-1">Overdue obligations</p></TiltCard>
          <TiltCard><div className="flex items-center gap-2 text-success mb-1"><CheckCircle size={16} /><p className="text-xs font-bold uppercase tracking-wider">Paid</p></div><p className="font-display text-3xl font-bold text-black">{paidCount}</p><p className="text-xs text-gray-500 mt-1">Receipted payments</p></TiltCard>
        </>}
      </div>

      <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-premium space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenant, property, unit, month or receipt..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-gold focus:bg-white transition-colors"
              aria-label="Search rent records"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                aria-pressed={filter === option.id}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                  filter === option.id
                    ? 'bg-black text-gold border-black shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500">Showing {filtered.length} of {records.length} record(s). {unpaidCount} unpaid · {verificationCount} awaiting EFT verification.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><Skeleton /><Skeleton /><Skeleton /></div>
      ) : loadError ? (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-danger/20 bg-danger/10 p-5 text-danger sm:flex-row sm:items-center sm:justify-between">
          <span>{loadError}</span>
          <button type="button" onClick={() => { setLoading(true); void fetchRent(); }} className="font-bold underline">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400"><Wallet size={24} /></div>
          <h3 className="font-display text-xl font-bold text-black mb-1">No rent records found</h3>
          <p className="text-sm text-gray-500">No records match your current filters or search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((record) => {
            const status = record.effective_status;
            const pendingProof = record.payments?.find((payment) => payment.status === 'submitted') ?? null;
            return (
              <div key={record.id} className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-premium hover:border-gold/20">
                <div>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-bold text-black truncate">{record.tenant_name}</h3>
                      <p className="text-xs text-gray-500 truncate">
                        {record.property_name} · Unit {record.unit_number}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase shrink-0 ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {status === 'Paid' ? <CheckCircle size={12} /> : status === 'Overdue' ? <AlertCircle size={12} /> : <Clock size={12} />}
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {formatMonth(record.month_for)}
                        </p>
                        <p className="font-display text-2xl font-bold text-black">{money(record.amount)}</p>
                      </div>
                      {record.receipt_number && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-white border border-gray-200 rounded-lg px-2 py-1">Receipt {record.receipt_number}</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Due {record.due_date ?? record.month_for}
                      {record.paid_date ? ` · Paid ${record.paid_date}` : ''}
                    </p>
                  </div>

                  {pendingProof && (
                    <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
                      <p className="font-semibold">EFT proof submitted {new Date(pendingProof.submitted_at).toLocaleDateString('en-ZA')}</p>
                      {pendingProof.reference && <p className="mt-0.5">Reference: {pendingProof.reference}</p>}
                      {pendingProof.proof_url && (
                        <a
                          href={pendingProof.proof_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-2 inline-flex items-center gap-1 font-bold underline hover:no-underline"
                        >
                          View proof <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}

                  {record.payments?.[0]?.status === 'rejected' && record.payments[0].rejection_reason && (
                    <div className="mt-3 rounded-xl bg-danger/5 border border-danger/20 p-3 text-xs text-danger">
                      <p className="font-semibold mb-0.5">Rejected proof</p>
                      <p>{record.payments[0].rejection_reason}</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  {status !== 'Paid' && canRecordCash && (
                    <button
                      type="button"
                      onClick={() => openModal(record, 'cash')}
                      className="inline-flex items-center gap-2 rounded-xl bg-gold px-3.5 py-2 text-xs font-bold text-black hover:opacity-90 transition-opacity"
                    >
                      <Banknote size={14} /> Record cash
                    </button>
                  )}
                  {pendingProof && canVerifyEft && (
                    <>
                      <button
                        type="button"
                        onClick={() => openModal(record, 'verify')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gold px-3.5 py-2 text-xs font-bold text-black hover:opacity-90 transition-opacity"
                      >
                        <ShieldCheck size={14} /> Verify EFT
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal(record, 'reject')}
                        className="rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-2 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {status === 'Paid' && (
                    <>
                      <button
                        type="button"
                        onClick={() => void emailReceipt(record)}
                        disabled={emailingId === record.id || !record.tenant_email}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        <Mail size={14} /> {emailingId === record.id ? 'Emailing...' : 'Email receipt'}
                      </button>
                      {canReverse && (
                        <button
                          type="button"
                          onClick={() => openModal(record, 'reverse')}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <RotateCcw size={14} /> Reverse
                        </button>
                      )}
                    </>
                  )}
                  {status !== 'Paid' && !canRecordCash && !pendingProof && (
                    <p className="text-xs text-gray-500 py-1">
                      {status === 'Submitted' || status === 'PendingVerification'
                        ? 'Awaiting finance verification.'
                        : 'You do not have permission to record payments.'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={mode !== null}
        onClose={closeModal}
        title={
          mode === 'cash'
            ? 'Record cash payment'
            : mode === 'verify'
              ? 'Verify EFT payment'
              : mode === 'reject'
                ? 'Reject proof of payment'
                : 'Reverse payment'
        }
        subtitle={selected ? `${selected.tenant_name} · ${formatMonth(selected.month_for)}` : undefined}
      >
        {selected && mode && (
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4">
              <p className="text-sm font-bold text-gray-600">
                {selected.tenant_name} · Unit {selected.unit_number}
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-black">{money(selected.amount)}</p>
              <p className="mt-1 text-sm text-gray-500">
                {formatMonth(selected.month_for)} · due {selected.due_date ?? selected.month_for}
              </p>
            </div>

            {mode === 'cash' && (
              <div className="rounded-xl border border-gold/20 bg-gold/10 p-4 space-y-2">
                <p className="flex items-start gap-2 text-sm text-gray-700">
                  <Banknote size={16} className="text-gold mt-0.5 shrink-0" /> Confirm you have counted and received the <strong>full</strong> cash amount. A sequential receipt will be issued.
                </p>
                <p className="text-xs text-gray-600">No partial rent payments are accepted. Cash must be recorded by authorized staff only.</p>
              </div>
            )}

            {mode === 'verify' && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                <p className="flex items-start gap-2 text-sm text-blue-900">
                  <CreditCard size={16} className="mt-0.5 shrink-0" /> Confirm the EFT cleared in the company bank account before verifying. Uploading proof alone is not proof of payment.
                </p>
                {proof?.proof_url && (
                  <a href={proof.proof_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 underline hover:no-underline">
                    View submitted proof <ExternalLink size={14} />
                  </a>
                )}
                {proof?.reference && <p className="text-xs text-blue-800">Reference: <strong>{proof.reference}</strong></p>}
                <p className="text-xs text-blue-800">Verifying issues a sequential receipt (RCP-YYYY-NNNNNN).</p>
              </div>
            )}

            {(mode === 'reject' || mode === 'reverse') && (
              <label className="block text-sm font-semibold text-gray-700">
                {mode === 'reject' ? 'Rejection reason' : 'Reversal reason'}
                <textarea
                  required
                  minLength={3}
                  maxLength={500}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={mode === 'reject' ? 'Explain why this proof cannot be accepted...' : 'Explain why this payment must be reversed...'}
                  className="mt-2 h-28 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
                <span className="mt-1 block text-xs text-gray-500 font-normal">{reason.trim().length}/500 characters (min 3)</span>
              </label>
            )}

            {mode === 'reverse' && (
              <div className="rounded-xl bg-danger/5 border border-danger/20 p-4 text-xs text-danger">
                <p className="font-semibold mb-1">Important: audit-safe reversal</p>
                <p>Reversing keeps the record and voids the receipt; the receipt number is never reused or renumbered. A reason is required.</p>
              </div>
            )}

            {modalError && <p role="alert" className="rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger">{modalError}</p>}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 rounded-xl border border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting || ((mode === 'reject' || mode === 'reverse') && reason.trim().length < 3)}
                className="flex-1 rounded-xl bg-gold py-3 font-bold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
              >
                {submitting
                  ? 'Saving...'
                  : mode === 'cash'
                    ? 'Confirm cash received'
                    : mode === 'verify'
                      ? 'Verify and issue receipt'
                      : mode === 'reject'
                        ? 'Reject proof'
                        : 'Reverse payment'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
