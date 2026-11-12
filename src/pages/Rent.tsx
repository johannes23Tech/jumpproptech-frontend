import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { AlertCircle, Banknote, CheckCircle, Clock, CreditCard } from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

// Define the shape of our data
type RentRecord = {
  id: number;
  tenant_name: string;
  unit_number: string;
  month_for: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  payment_method: string | null;
  paid_date: string | null;
};

export default function Rent() {
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<RentRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('EFT');
  const [otherMethod, setOtherMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchRent = async (): Promise<boolean> => {
    try {
      const data = await api.getRentRecords();
      setRecords(data);
      setLoadError('');
      return true;
    } catch (err) {
      console.error('Failed to load rent records', err);
      setLoadError(err instanceof Error ? err.message : 'Failed to load rent records.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { 
    fetchRent(); 
  }, []);

  const handleRecordPayment = async () => {
    if (!selectedRecord || submitting) return;
    const method = paymentMethod === 'Other' ? otherMethod.trim() : paymentMethod;
    if (!method) return;

    setSubmitting(true);
    try {
      await api.payRent({ id: selectedRecord.id, method });
      const refreshed = await fetchRent();
      setSelectedRecord(null);
      setOtherMethod('');
      setToast({
        message: refreshed
          ? 'Payment recorded successfully.'
          : 'Payment was recorded, but the rent list could not be refreshed.',
        type: refreshed ? 'success' : 'error'
      });
    } catch (err) {
      console.error('Failed to record rent payment', err);
      setToast({
        message: err instanceof Error ? err.message : 'Could not record payment. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to format the month nicely (e.g., "2024-10-01" -> "Oct 2024")
  const formatMonth = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading rent records...</div>;

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold">Rent Records</h2>
        <div className="text-sm text-gray-500 font-semibold">
          {records.filter(r => r.status !== 'Paid').length} pending payments
        </div>
      </div>

      {loadError ? (
        <div role="alert" className="bg-danger/10 border border-danger/20 rounded-xl p-5 text-danger flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>{loadError}</span>
          <button type="button" onClick={() => { setLoading(true); void fetchRent(); }} className="font-bold underline">
            Try again
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center shadow-sm">
          <p className="text-gray-500">No rent records found. Add a tenant to generate a rent record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((r) => (
            <div key={r.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-display text-lg font-bold">{r.tenant_name}</h3>
                    <p className="text-xs text-gray-500">Unit {r.unit_number}</p>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                    r.status === 'Paid' ? 'bg-success/10 text-success' : 
                    r.status === 'Overdue' ? 'bg-danger/10 text-danger' : 
                    'bg-warning/10 text-warning'
                  }`}>
                    {r.status === 'Paid' ? <CheckCircle size={12} /> : 
                     r.status === 'Overdue' ? <AlertCircle size={12} /> : 
                     <Clock size={12} />}
                    {r.status}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                    {formatMonth(r.month_for)}
                  </p>
                  <p className="font-display text-2xl font-bold text-black">
                    R {r.amount}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                {r.status !== 'Paid' ? (
                  <button 
                    onClick={() => { setSelectedRecord(r); setPaymentMethod('EFT'); setOtherMethod(''); }}
                    className="w-full bg-gold text-black py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  >
                    <CheckCircle size={16} /> Record Payment
                  </button>
                ) : (
                  <div className="text-xs text-success flex items-center justify-between">
                    <span>Paid via {r.payment_method}</span>
                    <span className="font-semibold">{r.paid_date}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => { if (!submitting) setSelectedRecord(null); }}
        title="Record rent payment"
        subtitle="Update payment status"
      >
        {selectedRecord && (
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-bold text-gray-500">{selectedRecord.tenant_name} · Unit {selectedRecord.unit_number}</p>
              <p className="mt-1 font-display text-2xl font-bold">R {Number(selectedRecord.amount).toLocaleString('en-ZA')}</p>
              <p className="mt-1 text-sm text-gray-500">{formatMonth(selectedRecord.month_for)}</p>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-bold">How was the rent paid?</legend>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'EFT', icon: CreditCard },
                  { name: 'Cash', icon: Banknote },
                  { name: 'SnapScan', icon: CreditCard },
                  { name: 'Other', icon: CreditCard }
                ].map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={paymentMethod === name}
                    onClick={() => setPaymentMethod(name)}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-colors ${
                      paymentMethod === name
                        ? 'border-gold bg-gold/10 text-black'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Icon size={17} /> {name}
                  </button>
                ))}
              </div>
            </fieldset>

            {paymentMethod === 'Other' && (
              <label className="block text-sm font-semibold">
                Payment method
                <input
                  autoFocus
                  value={otherMethod}
                  onChange={(event) => setOtherMethod(event.target.value)}
                  maxLength={60}
                  placeholder="Enter payment method"
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                />
              </label>
            )}

            <p className="text-xs text-gray-500">
              Only record this after confirming the payment has been received. This action updates the tenant’s rent statement.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                disabled={submitting}
                className="flex-1 rounded-xl border border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRecordPayment()}
                disabled={submitting || (paymentMethod === 'Other' && !otherMethod.trim())}
                className="flex-1 rounded-xl bg-gold py-3 font-bold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Recording payment…' : 'Confirm payment received'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}