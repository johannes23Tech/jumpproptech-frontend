import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Plus, MessageSquare } from 'lucide-react';

export default function Tenants() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<any[]>([]);
  const [vacantUnits, setVacantUnits] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [unitId, setUnitId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [deposit, setDeposit] = useState('');
  const [rent, setRent] = useState(0);

  const fetchData = async () => {
    try {
      const [tData, uData] = await Promise.all([api.getTenants(), api.getUnits()]);
      setTenants(tData);
      const vacant = uData.filter((u: any) => u.status === 'Vacant');
      setVacantUnits(vacant);
      if (vacant.length > 0) handleUnitSelect(vacant[0].id.toString(), vacant);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Automatically set rent and deposit when a unit is selected
  const handleUnitSelect = (id: string, unitsList = vacantUnits) => {
    setUnitId(id);
    const selected = unitsList.find(u => u.id.toString() === id);
    if (selected) {
      setRent(selected.monthly_rent);
      setDeposit((selected.monthly_rent * 0.20).toFixed(0)); // Auto-calculate 20% deposit
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.createTenant({
        unit_id: Number(unitId), name, phone, email, password,
        lease_start: leaseStart, lease_end: leaseEnd,
        deposit: deposit ? Number(deposit) : 0, monthly_rent: rent
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold">Tenants</h2>
        <button onClick={() => setIsModalOpen(true)} disabled={vacantUnits.length === 0} className="bg-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
          <Plus size={18} /> Add Tenant
        </button>
      </div>

      {vacantUnits.length === 0 && <div className="bg-warning/10 text-warning p-4 rounded-lg mb-6">You need a Vacant Unit to add a Tenant.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((t) => (
          <div key={t.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-display text-lg font-bold">{t.name}</h3>
                  <p className="text-xs text-gray-500">Unit {t.unit_number}</p>
                </div>
                <span className="text-[10px] uppercase font-bold bg-success/10 text-success px-2 py-1 rounded-full">Active</span>
              </div>
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p>Phone: {t.phone}</p>
                <p>Email: {t.email}</p>
                <p>Lease: {t.lease_start} to {t.lease_end}</p>
                <p className="font-bold text-black mt-2">Rent: R {t.monthly_rent}</p>
              </div>
            </div>
            
            {/* Message Button */}
            <button 
              onClick={() => navigate(`/messages/${t.id}`)}
              className="mt-4 w-full bg-charcoal text-ivory py-2 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-black transition-colors"
            >
              <MessageSquare size={16} /> Message Tenant
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="font-display text-xl font-bold mb-4">Add Tenant</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign Unit</label>
                <select value={unitId} onChange={(e) => handleUnitSelect(e.target.value)} required className="w-full border p-3 rounded-lg bg-white">
                  {vacantUnits.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-gray-100 p-3 rounded-lg">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rent (Auto)</label>
                  <p className="font-bold text-lg">R {rent}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deposit (20%)</label>
                  <input type="number" placeholder="Optional" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="w-full border p-2 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-3 rounded-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                  <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border p-3 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Login)</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-3 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Create Password for Tenant</label>
                <input type="text" required placeholder="e.g. Thato123" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-3 rounded-lg bg-gold/10 border-gold" />
                <p className="text-[10px] text-gray-500 mt-1">Provide this to the tenant so they can log in.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lease Start</label>
                  <input type="date" required value={leaseStart} onChange={(e) => setLeaseStart(e.target.value)} className="w-full border p-3 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lease End</label>
                  <input type="date" required value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)} className="w-full border p-3 rounded-lg" />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-black font-bold rounded-lg">Save Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}