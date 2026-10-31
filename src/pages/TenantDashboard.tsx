import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Wrench, CheckCircle, Clock, Home } from 'lucide-react';

export default function TenantDashboard() {
  const [data, setData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Maintenance Form
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');

  const fetchData = async () => {
    try {
      const res = await api.getTenantData();
      setData(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogIssue = async (e: FormEvent) => {
    e.preventDefault();
    await api.logMaintenance({ description, priority });
    setIsModalOpen(false);
    setDescription('');
    fetchData();
  };

  if (!data) return <div className="p-8 text-center text-gray-500">Loading your portal...</div>;

  return (
    <div className="space-y-6">
      
      {/* Top Welcome / Lease Card */}
      <div className="bg-gradient-to-br from-charcoal to-black p-6 rounded-2xl border border-gray-800 relative overflow-hidden text-ivory shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold opacity-10 rounded-full -mr-10 -mt-10"></div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">My Home</p>
        <p className="font-display text-3xl font-semibold text-gold-light mb-2">{data.tenant.property_name}</p>
        <p className="text-sm text-gray-300">Unit: <span className="font-bold text-white">{data.tenant.unit_number}</span> | Lease Ends: <span className="font-bold text-white">{data.tenant.lease_end}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Rent Statement */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-xl font-bold">Rent Statement</h3>
            <span className="text-sm font-bold bg-gold/10 text-gold px-3 py-1 rounded-full">R {data.tenant.monthly_rent}/mo</span>
          </div>
          <div className="space-y-3">
            {data.rent.map((r: any) => (
              <div key={r.id} className="flex justify-between items-center p-3 bg-ivory-dark rounded-lg">
                <div>
                  <p className="font-bold">{r.month_for}</p>
                  <p className="text-xs text-gray-500">{r.status === 'Paid' ? `Paid via ${r.payment_method}` : 'Awaiting Payment'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">R {r.amount}</p>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${r.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-xl font-bold">Maintenance</h3>
            <button onClick={() => setIsModalOpen(true)} className="bg-gold text-black px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1 hover:opacity-90">
              <Wrench size={14} /> Log Issue
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
            {data.maintenance.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No issues reported.</p>
            ) : (
              data.maintenance.map((m: any) => (
                <div key={m.id} className="p-3 border border-gray-100 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm">{m.description}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${m.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{m.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">Priority: {m.priority}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Log Issue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ivory w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Log Maintenance Issue</h3>
            <form onSubmit={handleLogIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-3 rounded-lg h-24" placeholder="Describe the problem..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border p-3 rounded-lg bg-white">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High (Urgent)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-black font-bold rounded-lg">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}