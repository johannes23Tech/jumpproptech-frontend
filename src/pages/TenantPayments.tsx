import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Download, Mail, X, Filter } from 'lucide-react';
import ReceiptTemplate from '../components/ReceiptTemplate';

export default function TenantPayments() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [emailStatus, setEmailStatus] = useState('');
  
  // Filtering State (Default to 6 months)
  const [filterMonths, setFilterMonths] = useState(6); 

  useEffect(() => {
    api.getTenantData().then(res => setData(res)).catch(console.error);
  }, []);

  // Native Print Function - Triggers the browser's print dialog instantly
  const handleDownloadPDF = () => {
    window.print();
  };

  const handleEmail = async () => {
    setEmailStatus('Sending...');
    try {
      await api.sendReceiptEmail({ email: user?.email || '', receipt_number: selectedRecord.receipt_number });
      setEmailStatus('Sent successfully!');
      setTimeout(() => setEmailStatus(''), 3000);
    } catch (err) {
      setEmailStatus('Failed to send.');
    }
  };

  if (!data) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  // Filter the rent records based on the selected period
  const filteredRent = data.rent.filter((r: any) => {
    if (filterMonths === 0) return true; // 'All time'
    const recordDate = new Date(r.month_for);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - filterMonths);
    return recordDate >= cutoffDate;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="font-display text-xl font-bold">My Statement</h2>
          
          <div className="flex items-center gap-2 bg-ivory-dark p-1 rounded-lg overflow-x-auto w-full md:w-auto">
            <Filter size={16} className="text-gray-500 ml-2 shrink-0" />
            {[
              { label: '1 Month', value: 1 },
              { label: '3 Months', value: 3 },
              { label: '6 Months', value: 6 },
              { label: '12 Months', value: 12 },
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

        {/* Statement List */}
        <div className="space-y-3">
          {filteredRent.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No records found for this period.</p>
          ) : (
            filteredRent.map((r: any) => (
              <div key={r.id} className="flex flex-col md:flex-row justify-between md:items-center p-4 bg-ivory rounded-lg border border-gray-200 gap-4">
                <div>
                  <p className="font-bold text-lg">{r.month_for}</p>
                  <p className="text-xs text-gray-500">Rent Amount: R {r.amount}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded-full ${r.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {r.status}
                    </span>
                    {r.status === 'Paid' && <p className="text-xs text-gray-500 mt-1">Paid via {r.payment_method}</p>}
                  </div>
                  {r.status === 'Paid' && (
                    <button 
                      onClick={() => setSelectedRecord(r)}
                      className="bg-black text-gold px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
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

      {/* Receipt Modal */}
      {selectedRecord && (
        // Added print-overlay class here
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto print-overlay">
          
          {/* Added print-modal-content class here */}
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl relative my-8 print-modal-content">
            
            {/* Modal Controls (Hidden when printing) */}
            <div className="sticky top-0 bg-gray-100 p-4 border-b flex justify-between items-center rounded-t-xl z-10 print:hidden">
              <h3 className="font-bold text-lg">Receipt Preview</h3>
              <div className="flex gap-2">
                <button onClick={handleDownloadPDF} className="bg-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90">
                  <Download size={16} /> Download PDF
                </button>
                <button onClick={handleEmail} disabled={emailStatus === 'Sending...'} className="bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
                  <Mail size={16} /> {emailStatus || 'Email to Me'}
                </button>
                <button onClick={() => setSelectedRecord(null)} className="text-gray-500 hover:text-danger p-2">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-4 md:p-8 bg-gray-200 print:bg-transparent print:p-0">
               {/* Added print-area class here */}
               <div className="print-area">
                  <ReceiptTemplate record={selectedRecord} landlordName={user?.full_name || 'Landlord'} />
               </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}