import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Download, Mail, X, Filter, RotateCw } from 'lucide-react';
import ReceiptTemplate from '../components/ReceiptTemplate';

export default function TenantPayments() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [filterMonths, setFilterMonths] = useState(6); 

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

  const rentRecords = Array.isArray(data?.rent) ? data.rent : [];
  const filteredRent = rentRecords.filter((r: any) => {
    if (filterMonths === 0) return true;
    const recordDate = new Date(r.month_for);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - filterMonths);
    return recordDate >= cutoffDate;
  });

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
            filteredRent.map((r: any) => (
              <div key={r.id} className="flex flex-col md:flex-row justify-between md:items-center p-4 bg-ivory rounded-xl border border-gray-100 gap-4 hover:shadow-sm transition-shadow">
                <div>
                  <p className="font-bold text-lg">{r.month_for}</p>
                  <p className="text-xs text-gray-500">Rent Amount: R {r.amount}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded-full ${r.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {r.status}
                    </span>
                    {r.status === 'Paid' && <p className="text-xs text-gray-500 mt-1">Via {r.payment_method}</p>}
                  </div>
                  {r.status === 'Paid' && (
                    <button 
                      onClick={() => { setSelectedRecord(r); setEmailStatus('idle'); }}
                      className="bg-black text-gold px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity text-xs"
                    >
                      View Receipt
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
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
                  <ReceiptTemplate record={selectedRecord} landlordName={user?.full_name || 'Landlord'} />
               </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}