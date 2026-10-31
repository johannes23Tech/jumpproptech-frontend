import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

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
  
  // 1. Fetch all rent records
  const fetchRent = async () => {
    try {
      const data = await api.getRentRecords();
      setRecords(data);
    } catch (err) {
      console.error("Failed to load rent records", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { 
    fetchRent(); 
  }, []);

  // 2. Mark a record as Paid
  const handlePay = async (id: number) => {
    // Ask the user for the payment method (Cash, EFT, etc.)
    const method = prompt("Enter payment method (e.g., EFT, Cash, SnapScan):", "EFT");
    
    if (method) {
      try {
        await api.payRent({ id, method });
        fetchRent(); // Refresh the list automatically
      } catch (err) {
        alert("Failed to record payment.");
      }
    }
  };

  // Helper to format the month nicely (e.g., "2024-10-01" -> "Oct 2024")
  const formatMonth = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
  };

  if (loading) return <div className="text-gray-500">Loading rent records...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold">Rent Records</h2>
        <div className="text-sm text-gray-500 font-semibold">
          {records.filter(r => r.status !== 'Paid').length} pending payments
        </div>
      </div>

      {records.length === 0 ? (
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
                    onClick={() => handlePay(r.id)} 
                    className="w-full bg-gold text-black py-2 rounded-lg font-bold flex justify-center items-center gap-2 hover:opacity-90 transition-opacity"
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
    </div>
  );
}