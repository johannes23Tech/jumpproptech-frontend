import { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/roles';
import { AlertCircle, Banknote, CheckCircle, Clock, CreditCard, ExternalLink, Mail, RotateCcw, ShieldCheck } from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

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
  Paid: 'bg-success/10 text-success',
  Pending: 'bg-warning/10 text-warning',
  Overdue: 'bg-danger/10 text-danger',
  Submitted: 'bg-blue-50 text-blue-700',
  PendingVerification: 'bg-blue-50 text-blue-700',
  Rejected: 'bg-danger/10 text-danger',
  Reversed: 'bg-gray-100 text-gray-600',
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
    return records.filter((record) => {
      switch (filter) {
        case 'unpaid':
          return isUnpaid(record);
        case 'verification':
          return record.effective_status === 'Submitted' || record.effective_status === 'PendingVerification';
        case 'paid':
          return record.effective_status === 'Paid';
        case 'arrears':
          return record.effective_status === 'Overdue';
        default:
          return true;
      }
    });
  }, [records, filter]);

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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading rent records...</div>;

  const proof = selected?.payments?.find((payment) => payment.status === 'submitted') ?? selected?.payments?.[0] ?? null;
  const unpaidCount = records.filter(isUnpaid).length;
  const verificationCount = records.filter(
    (record) => record.effective_status === 'Submitted' || record.effective_status === 'PendingVerification',
  ).length;

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Rent</h2>
          <p className="text-sm text-gray-500">
            {unpaidCount} unpaid · {verificationCount} awaiting EFT verification
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); void fetchRent(); }}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            aria-pressed={filter === option.id}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === option.id
                ? 'bg-black text-gold'
                : 'border border-gray-200 bg-white text-gray-500 hover:border-gray-400'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loadError ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger/20 bg-danger/10 p-5 text-danger sm:flex-row sm:items-center sm:justify-between">
          <span>{loadError}</span>
          <button type="button" onClick={() => { setLoading(true); void fetchRent(); }} className="font-bold underline">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No rent records in this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((record) => {
            const status = record.effective_status;
            const pendingProof = record.payments?.find((payment) => payment.status === 'submitted') ?? null;
            return (
              <div key={record.id} className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-bold">{record.tenant_name}</h3>
                      <p className="text-xs text-gray-500">
                        {record.property_name} · Unit {record.unit_number}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {status === 'Paid' ? <CheckCircle size={12} /> : status === 'Overdue' ? <AlertCircle size={12} /> : <Clock size={12} />}
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {formatMonth(record.month_for)}
                    </p>
                    <p className="font-display text-2xl font-bold text-black">{money(record.amount)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Due {record.due_date ?? record.month_for}
                      {record.paid_date ? ` · Paid ${record.paid_date}` : ''}
                    </p>
                    {record.receipt_number && (
                      <p className="mt-1 text-xs font-semibold text-gray-600">Receipt {record.receipt_number}</p>
                    )}
                  </div>

                  {pendingProof && (
                    <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                      <p className="font-semibold">EFT proof submitted {new Date(pendingProof.submitted_at).toLocaleDateString('en-ZA')}</p>
                      {pendingProof.reference && <p>Reference: {pendingProof.reference}</p>}
                      {pendingProof.proof_url && (
                        <a
                          href={pendingProof.proof_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-1 inline-flex items-center gap-1 font-bold underline"
                        >
                          View proof <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}

                  {record.payments?.[0]?.status === 'rejected' && record.payments[0].rejection_reason && (
                    <p className="mt-3 rounded-lg bg-danger/5 p-3 text-xs text-danger">
                      Rejected: {record.payments[0].rejection_reason}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  {status !== 'Paid' && canRecordCash && (
                    <button
                      type="button"
                      onClick={() => openModal(record, 'cash')}
                      className="flex items-center gap-2 rounded-lg bg-gold px-3 py-2 text-xs font-bold text-black hover:opacity-90"
                    >
                      <Banknote size={14} /> Record cash
                    </button>
                  )}
                  {pendingProof && canVerifyEft && (
                    <>
                      <button
                        type="button"
                        onClick={() => openModal(record, 'verify')}
                        className="flex items-center gap-2 rounded-lg bg-gold px-3 py-2 text-xs font-bold text-black hover:opacity-90"
                      >
                        <ShieldCheck size={14} /> Verify EFT
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal(record, 'reject')}
                        className="rounded-lg border border-danger/30 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/5"
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
                        className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Mail size={14} /> {emailingId === record.id ? 'Emailing...' : 'Email receipt'}
                      </button>
                      {canReverse && (
                        <button
                          type="button"
                          onClick={() => openModal(record, 'reverse')}
                          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <RotateCcw size={14} /> Reverse
                        </button>
                      )}
                    </>
                  )}
                  {status !== 'Paid' && !canRecordCash && !pendingProof && (
                    <p className="text-xs text-gray-500">
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
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-bold text-gray-500">
                {selected.tenant_name} · Unit {selected.unit_number}
              </p>
              <p className="mt-1 font-display text-2xl font-bold">{money(selected.amount)}</p>
              <p className="mt-1 text-sm text-gray-500">
                {formatMonth(selected.month_for)} · due {selected.due_date ?? selected.month_for}
              </p>
            </div>

            {mode === 'cash' && (
              <>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <Banknote size={16} /> Confirm you have counted and received the full cash amount. A sequential receipt will be issued.
                </p>
                <p className="text-xs text-gray-500">No partial rent payments are accepted.</p>
              </>
            )}

            {mode === 'verify' && (
              <>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard size={16} /> Confirm the EFT cleared in the company bank account before verifying. Uploading proof alone is not proof of payment.
                </p>
                {proof?.proof_url && (
                  <a href={proof.proof_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm font-bold text-gold underline">
                    View submitted proof <ExternalLink size={14} />
                  </a>
                )}
                <p className="text-xs text-gray-500">Verifying issues a sequential receipt.</p>
              </>
            )}

            {(mode === 'reject' || mode === 'reverse') && (
              <label className="block text-sm font-semibold">
                {mode === 'reject' ? 'Rejection reason' : 'Reversal reason'}
                <textarea
                  required
                  minLength={3}
                  maxLength={500}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-2 h-24 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                />
              </label>
            )}

            {mode === 'reverse' && (
              <p className="rounded-lg bg-danger/5 p-3 text-xs text-danger">
                Reversing keeps the record and voids the receipt; the receipt number is never reused or renumbered.
              </p>
            )}

            {modalError && <p role="alert" className="text-sm text-danger">{modalError}</p>}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 rounded-xl border border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting || ((mode === 'reject' || mode === 'reverse') && reason.trim().length < 3)}
                className="flex-1 rounded-xl bg-gold py-3 font-bold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
