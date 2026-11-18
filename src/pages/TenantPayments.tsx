import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  FileUp,
  Filter,
  Mail,
  RotateCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import ReceiptTemplate from '../components/ReceiptTemplate';

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
  month_for: string;
  due_date: string | null;
  amount: string | number;
  status: RentStatus;
  effective_status?: RentStatus;
  payment_method: string | null;
  paid_date: string | null;
  receipt_number: string | null;
  payments?: RentPayment[];
  tenant_name?: string;
  tenant_email?: string;
  unit_number?: string;
  property_name?: string;
};

type ReceiptRecord = {
  id: number;
  receipt_number: string;
  amount: string | number;
  method: 'cash' | 'eft';
  status: 'issued' | 'voided';
  issued_at: string;
  voided_at: string | null;
  void_reason: string | null;
  month_for: string;
};

type Arrears = {
  total_due: number;
  invoice_count: number;
  buckets: Record<string, number>;
};

const STATUS_STYLES: Record<string, string> = {
  Paid: 'bg-success/10 text-success',
  Pending: 'bg-warning/10 text-warning',
  Overdue: 'bg-danger/10 text-danger',
  Submitted: 'bg-blue-50 text-blue-700',
  PendingVerification: 'bg-blue-50 text-blue-700',
  Rejected: 'bg-danger/10 text-danger',
  Reversed: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Due',
  Overdue: 'Overdue',
  Submitted: 'Proof submitted',
  PendingVerification: 'Awaiting verification',
  Paid: 'Paid',
  Rejected: 'Proof rejected',
  Reversed: 'Payment reversed',
};

const money = (value: string | number): string =>
  `R ${Number(value).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMonth = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-ZA');
};

const effectiveStatus = (record: RentRecord): RentStatus => record.effective_status ?? record.status;

const canSubmitProof = (record: RentRecord): boolean => {
  const status = effectiveStatus(record);
  return status === 'Pending' || status === 'Overdue' || status === 'Rejected' || status === 'Reversed';
};

export default function TenantPayments() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<RentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [filterMonths, setFilterMonths] = useState(6);

  // EFT proof submission
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [proofRecord, setProofRecord] = useState<RentRecord | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofReference, setProofReference] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState('');
  const [proofSuccess, setProofSuccess] = useState('');

  const loadStatement = async () => {
    try {
      const response = await api.getTenantData();
      setData(response);
      setLoadError('');
    } catch (error) {
      console.error('Failed to load tenant statement:', error);
      setLoadError(error instanceof Error ? error.message : 'Could not load your statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatement();
  }, []);

  const rentRecords: RentRecord[] = Array.isArray(data?.rent) ? data.rent : [];
  const receipts: ReceiptRecord[] = Array.isArray(data?.receipts) ? data.receipts : [];
  const arrears: Arrears | null = data?.arrears ?? null;

  const filteredRent = useMemo(() => {
    return rentRecords.filter((r) => {
      if (filterMonths === 0) return true;
      const recordDate = new Date(r.month_for);
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - filterMonths);
      return recordDate >= cutoffDate;
    });
  }, [rentRecords, filterMonths]);

  const openProofModal = (record: RentRecord) => {
    setProofRecord(record);
    setProofFile(null);
    setProofReference('');
    setProofError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeProofModal = () => {
    if (submittingProof) return;
    setProofRecord(null);
    setProofFile(null);
    setProofReference('');
    setProofError('');
  };

  const submitProof = async () => {
    if (!proofRecord || !proofFile || submittingProof) return;
    setSubmittingProof(true);
    setProofError('');
    try {
      const proofUrl = await api.uploadDocument(proofFile);
      await api.submitEftProof({
        id: proofRecord.id,
        proof_url: proofUrl,
        reference: proofReference.trim() || undefined,
      });
      const refreshed = await api.getTenantData();
      setData(refreshed);
      setProofRecord(null);
      setProofFile(null);
      setProofReference('');
      setProofSuccess(
        'Proof of payment submitted. Your payment is not verified until the company confirms the funds in its bank account.',
      );
    } catch (error) {
      setProofError(error instanceof Error ? error.message : 'The proof of payment could not be submitted.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleEmail = async () => {
    if (!selectedRecord?.receipt_number || !user?.email || emailStatus === 'sending') return;
    setEmailStatus('sending');
    try {
      await api.sendReceiptEmail({ email: user?.email || '', receipt_number: selectedRecord.receipt_number });
      setEmailStatus('success');
    } catch (error) {
      console.error('Failed to email receipt:', error);
      setEmailStatus('error');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500" role="status">Loading your statement...</div>;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden animate-fade-in">
      {loadError ? (
        <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/10 p-5 text-danger">
          <p className="font-semibold">{loadError}</p>
          <button type="button" onClick={() => { setLoading(true); void loadStatement(); }} className="mt-3 inline-flex items-center gap-2 font-bold underline">
            <RotateCw size={16} /> Try again
          </button>
        </div>
      ) : (
      <>
        {proofSuccess && (
          <div role="status" className="flex items-start justify-between gap-3 rounded-2xl border border-success/20 bg-success/10 p-4 text-sm font-semibold text-success">
            <span>{proofSuccess}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setProofSuccess('')} className="text-success/70 hover:text-success">
              <X size={16} />
            </button>
          </div>
        )}

        {arrears && arrears.total_due > 0 && (
          <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/10 p-5">
            <div className="flex items-center gap-2 text-danger">
              <AlertCircle size={18} />
              <p className="font-display text-lg font-bold">{money(arrears.total_due)} outstanding</p>
            </div>
            <p className="mt-1 text-sm text-danger/80">
              {arrears.invoice_count} unpaid {arrears.invoice_count === 1 ? 'obligation' : 'obligations'}. Submit your EFT proof below once you have paid.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider text-danger/70">
              <span className="rounded-full bg-white/60 px-2 py-1">1–30 days: {money(arrears.buckets['1_30'] ?? 0)}</span>
              <span className="rounded-full bg-white/60 px-2 py-1">31–60 days: {money(arrears.buckets['31_60'] ?? 0)}</span>
              <span className="rounded-full bg-white/60 px-2 py-1">61–90 days: {money(arrears.buckets['61_90'] ?? 0)}</span>
              <span className="rounded-full bg-white/60 px-2 py-1">90+ days: {money(arrears.buckets['over_90'] ?? 0)}</span>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-premium">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="font-display text-xl font-bold">My Statement</h2>

            <div className="flex items-center gap-2 bg-ivory-dark p-1 rounded-lg overflow-x-auto w-full md:w-auto no-scrollbar">
              <Filter size={16} className="text-gray-500 ml-2 shrink-0" />
              {[
                { label: '1M', value: 1 },
                { label: '3M', value: 3 },
                { label: '6M', value: 6 },
                { label: '12M', value: 12 },
                { label: 'All', value: 0 }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilterMonths(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${filterMonths === opt.value ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredRent.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                <p className="font-semibold">{rentRecords.length === 0 ? 'No rent records yet.' : 'No records found for this period.'}</p>
                {rentRecords.length > 0 && (
                  <button type="button" onClick={() => setFilterMonths(0)} className="mt-2 text-sm font-bold text-black underline">
                    View all records
                  </button>
                )}
              </div>
            ) : (
              filteredRent.map((r) => {
                const status = effectiveStatus(r);
                const latestProof = r.payments?.[0] ?? null;
                const pendingProof = r.payments?.find((p) => p.status === 'submitted') ?? null;
                return (
                  <div key={r.id} className="p-4 bg-ivory rounded-xl border border-gray-100 gap-4 hover:shadow-sm transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-lg">{formatMonth(r.month_for)}</p>
                        <p className="text-xs text-gray-500">Rent amount: {money(r.amount)}</p>
                        <p className="text-xs text-gray-500">
                          Due {formatDate(r.due_date ?? r.month_for)}
                          {r.paid_date ? ` · Paid ${formatDate(r.paid_date)}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded-full ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {status === 'Paid' ? <CheckCircle size={12} /> : status === 'Overdue' || status === 'Rejected' ? <AlertCircle size={12} /> : <Clock size={12} />}
                            {STATUS_LABELS[status] ?? status}
                          </span>
                          {status === 'Paid' && r.payment_method && <p className="text-xs text-gray-500 mt-1">Via {r.payment_method}</p>}
                          {r.receipt_number && <p className="text-xs font-semibold text-gray-600 mt-1">Receipt {r.receipt_number}</p>}
                        </div>
                        {status === 'Paid' && (
                          <button
                            onClick={() => { setSelectedRecord(r); setEmailStatus('idle'); }}
                            className="bg-black text-gold px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity text-xs"
                          >
                            View Receipt
                          </button>
                        )}
                        {canSubmitProof(r) && (
                          <button
                            onClick={() => openProofModal(r)}
                            className="bg-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity text-xs"
                          >
                            <FileUp size={14} /> Submit EFT proof
                          </button>
                        )}
                        {(status === 'Submitted' || status === 'PendingVerification') && !pendingProof && (
                          <span className="text-xs text-gray-500">Awaiting verification</span>
                        )}
                      </div>
                    </div>

                    {pendingProof && (
                      <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                        <p className="font-semibold">Proof submitted {formatDate(pendingProof.submitted_at)}</p>
                        {pendingProof.reference && <p>Reference: {pendingProof.reference}</p>}
                        {pendingProof.proof_url && (
                          <a href={pendingProof.proof_url} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 font-bold underline">
                            View your proof <ExternalLink size={12} />
                          </a>
                        )}
                        <p className="mt-1 text-blue-700/70">
                          This is not a receipt. Payment is confirmed only after the company verifies the funds in its bank account.
                        </p>
                      </div>
                    )}

                    {latestProof?.status === 'rejected' && latestProof.rejection_reason && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-danger/5 p-3 text-xs text-danger">
                        <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">Proof rejected</p>
                          <p>{latestProof.rejection_reason}</p>
                          {latestProof.proof_url && (
                            <a href={latestProof.proof_url} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 font-bold underline">
                              View submitted proof <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {status === 'Reversed' && (
                      <p className="mt-3 rounded-lg bg-gray-100 p-3 text-xs text-gray-600">
                        A previous payment for this month was reversed. Please contact the office if you have questions.
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-premium">
          <h2 className="font-display text-xl font-bold mb-4">My Receipts</h2>
          {receipts.length === 0 ? (
            <p className="text-sm text-gray-500">Receipts appear here once a payment has been verified.</p>
          ) : (
            <div className="space-y-2">
              {receipts.map((receipt) => {
                const rentRecord = rentRecords.find((r) => r.receipt_number === receipt.receipt_number) ?? null;
                return (
                  <div key={receipt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-100 bg-ivory p-4">
                    <div>
                      <p className="font-bold">{receipt.receipt_number}</p>
                      <p className="text-xs text-gray-500">
                        {formatMonth(receipt.month_for)} · {money(receipt.amount)} · {receipt.method === 'cash' ? 'Cash' : 'EFT'}
                      </p>
                      <p className="text-xs text-gray-500">Issued {formatDate(receipt.issued_at)}</p>
                      {receipt.status === 'voided' && (
                        <p className="mt-1 text-xs font-semibold text-danger">
                          Voided {formatDate(receipt.voided_at)}{receipt.void_reason ? ` — ${receipt.void_reason}` : ''}
                        </p>
                      )}
                    </div>
                    {receipt.status === 'issued' && rentRecord && (
                      <button
                        onClick={() => { setSelectedRecord(rentRecord); setEmailStatus('idle'); }}
                        className="bg-black text-gold px-4 py-2 rounded-lg font-bold text-xs hover:opacity-90"
                      >
                        View receipt
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
      )}

      {/* EFT proof submission modal */}
      {proofRecord && (
        <div role="dialog" aria-modal="true" aria-labelledby="proof-title" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <h3 id="proof-title" className="font-bold">Submit EFT proof of payment</h3>
              <button aria-label="Close" onClick={closeProofModal} disabled={submittingProof} className="text-gray-500 hover:text-danger p-1 disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-ivory p-4">
                <p className="text-sm font-bold">{formatMonth(proofRecord.month_for)}</p>
                <p className="font-display text-2xl font-bold">{money(proofRecord.amount)}</p>
                <p className="text-xs text-gray-500">Due {formatDate(proofRecord.due_date ?? proofRecord.month_for)}</p>
              </div>

              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                Upload your bank transfer confirmation. Submitting proof does not mark the rent as paid — the company verifies the funds against its bank statement first.
              </div>

              <label className="block text-sm font-semibold">
                Proof of payment (image or PDF, max 10 MB)
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-sm font-normal text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:font-bold file:text-gold"
                />
              </label>

              <label className="block text-sm font-semibold">
                Bank reference (optional)
                <input
                  type="text"
                  maxLength={100}
                  value={proofReference}
                  onChange={(event) => setProofReference(event.target.value)}
                  placeholder="e.g. RENT NOV 2026"
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal outline-none focus:border-gold"
                />
              </label>

              {proofError && <p role="alert" className="text-sm text-danger">{proofError}</p>}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={closeProofModal}
                  disabled={submittingProof}
                  className="flex-1 rounded-xl border border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submitProof()}
                  disabled={!proofFile || submittingProof}
                  className="flex-1 rounded-xl bg-gold py-3 font-bold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingProof ? 'Uploading...' : 'Submit for verification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedRecord && (
        <div role="dialog" aria-modal="true" aria-labelledby="receipt-title" className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 md:p-4 overflow-y-auto print-overlay">

          {/* Removed overflow-hidden here so the print area isn't cut off */}
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl relative my-4 md:my-8 print-modal-content">

            <div className="sticky top-0 bg-gray-100 p-3 md:p-4 border-b flex justify-between items-center rounded-t-xl z-10 print:hidden">
              <h3 id="receipt-title" className="font-bold text-sm md:text-lg">Receipt Preview</h3>
              <div className="flex gap-2">
                <button onClick={handleDownloadPDF} className="bg-gold text-black px-3 py-2 rounded-lg font-bold flex items-center gap-1 text-xs hover:opacity-90">
                  <Download size={14} /> Save PDF
                </button>
                <button onClick={handleEmail} disabled={emailStatus === 'sending' || !selectedRecord.receipt_number} className="bg-black text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1 text-xs hover:opacity-90 disabled:opacity-50">
                  <Mail size={14} /> {emailStatus === 'sending' ? 'Sending...' : emailStatus === 'success' ? 'Sent' : emailStatus === 'error' ? 'Retry email' : 'Email'}
                </button>
                <button aria-label="Close receipt" onClick={() => { setSelectedRecord(null); setEmailStatus('idle'); }} className="text-gray-500 hover:text-danger p-1">
                  <X size={20} />
                </button>
              </div>
            </div>
            {emailStatus === 'success' && <p role="status" className="bg-success/10 px-4 py-2 text-sm font-semibold text-success print:hidden">Receipt emailed to {user?.email}.</p>}
            {emailStatus === 'error' && <p role="alert" className="bg-danger/10 px-4 py-2 text-sm font-semibold text-danger print:hidden">Could not email the receipt. Please try again.</p>}

            <div className="p-2 md:p-8 bg-gray-200 print:bg-transparent print:p-0 overflow-x-auto">
               <div className="print-area min-w-[600px] md:min-w-0">
                  <ReceiptTemplate record={selectedRecord} landlordName={user?.full_name || 'Jump PropTech'} />
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
