import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { validatePassword } from '../utils/security';
import { 
  Plus, MessageSquare, FileText, X, User, ShieldAlert, 
  Car, Phone, Mail, Users, Calendar, DollarSign 
} from 'lucide-react';
import Modal from '../components/Modal';
import PremiumButton from '../components/PremiumButton';
import { PageBanner, SubmitButton } from '../components/FormFeedback';

export default function Tenants() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<any[]>([]);
  const [vacantUnits, setVacantUnits] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
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

  const handleUnitSelect = (id: string, unitsList = vacantUnits) => {
    setUnitId(id);
    const selected = unitsList.find(u => u.id.toString() === id);
    if (selected) {
      setRent(selected.monthly_rent);
      setDeposit((selected.monthly_rent * 0.20).toFixed(0)); 
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const passwordError = validatePassword(password);
    if (passwordError) {
      setSubmitError(passwordError);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.createTenant({
        unit_id: Number(unitId), name, phone, email, password,
        lease_start: leaseStart, lease_end: leaseEnd,
        deposit: deposit ? Number(deposit) : 0, monthly_rent: rent
      });
      setIsModalOpen(false);
      setName(''); setPhone(''); setEmail(''); setPassword(''); setLeaseStart(''); setLeaseEnd('');
      setSuccessMessage('Tenant added successfully.');
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The tenant could not be saved. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadLease = async (tenantId: number, tenantName: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://jumpproptech-api.onrender.com/api/generate_lease.php?tenant_id=${tenantId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to generate lease");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lease_${tenantName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Error downloading lease agreement.");
    }
  };

  return (
    <div className="animate-fade-in">
      {successMessage && <PageBanner message={successMessage} onDismiss={() => setSuccessMessage('')} />}
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold">Tenants</h2>
        <PremiumButton onClick={() => { setSubmitError(''); setSuccessMessage(''); setIsModalOpen(true); }} disabled={vacantUnits.length === 0} icon={<Plus size={18} />}>
          Add Tenant
        </PremiumButton>
      </div>

      {vacantUnits.length === 0 && (
        <div className="bg-warning/10 text-warning p-4 rounded-lg mb-6 border border-warning/20">
          You need a Vacant Unit to add a Tenant.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((t) => (
          <div key={t.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-premium transition-shadow duration-300 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-display text-lg font-bold">{t.name}</h3>
                  <p className="text-xs text-gray-500">Unit {t.unit_number}</p>
                </div>
                <button 
                  onClick={() => setSelectedTenant(t)}
                  className="bg-ivory-dark text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  View Details
                </button>
              </div>
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p>Phone: {t.phone}</p>
                <p>Email: {t.email}</p>
                <p>Lease: {t.lease_start} to {t.lease_end}</p>
                <p className="font-bold text-black mt-2">Rent: R {t.monthly_rent}</p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button onClick={() => handleDownloadLease(t.id, t.name)} className="flex-1 bg-white border border-gray-300 text-black py-2 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors text-xs">
                <FileText size={14} /> Lease PDF
              </button>
              <button onClick={() => navigate(`/messages/${t.id}`)} className="flex-1 bg-charcoal text-ivory py-2 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-black transition-colors text-xs">
                <MessageSquare size={14} /> Message
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* TENANT DETAILS DRAWER (Remains unchanged) */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="absolute inset-0" onClick={() => setSelectedTenant(null)} />
          
          <div className="bg-ivory w-full max-w-md h-full shadow-2xl relative animate-slide-left overflow-y-auto">
            <div className="sticky top-0 bg-charcoal text-ivory p-6 flex justify-between items-center z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gold text-black flex items-center justify-center font-bold text-xl">
                  {selectedTenant.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">{selectedTenant.name}</h3>
                  <p className="text-xs text-gray-300">Unit {selectedTenant.unit_number}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h4>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500"><User size={16} /> Full Name</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.name}</span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 text-gray-500"><ShieldAlert size={16} /> ID / Passport</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.id_number || 'Not provided'}</span>
                  </div>
                  {selectedTenant.id_document && (
                    <div className="p-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Uploaded ID Document:</p>
                      <a href={selectedTenant.id_document} target="_blank" rel="noopener noreferrer">
                        <img src={selectedTenant.id_document} alt="ID" className="max-h-32 rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Details</h4>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500"><Phone size={16} /> Cellphone</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.phone}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500"><Mail size={16} /> Email</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.email}</span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 text-gray-500"><Mail size={16} /> Alt. Email</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.alt_email || 'None'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Next of Kin</h4>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500"><Users size={16} /> Name</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.emergency_contact_name || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500"><User size={16} /> Relationship</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.emergency_relationship || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500"><Phone size={16} /> Phone</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.emergency_contact_phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 text-gray-500"><Mail size={16} /> Email</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.emergency_contact_email || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Vehicle</h4>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500"><Car size={16} /> Type</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.vehicle_type || 'None'}</span>
                  </div>
                  {selectedTenant.vehicle_type !== 'No vehicle' && selectedTenant.vehicle_details && (
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1">Make, Model & Plate:</p>
                      <p className="text-sm font-bold text-black">{selectedTenant.vehicle_details}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Lease Details</h4>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500"><Calendar size={16} /> Start</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.lease_start}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500"><Calendar size={16} /> End</div>
                    <span className="text-sm font-bold text-black">{selectedTenant.lease_end}</span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 text-gray-500"><DollarSign size={16} /> Rent</div>
                    <span className="text-sm font-bold text-black">R {selectedTenant.monthly_rent}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add Tenant Modal (NEW PREMIUM DESIGN) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Onboard Tenant"
        subtitle="Assign a tenant to a vacant unit"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Assign Unit</label>
            <select required value={unitId} onChange={(e) => handleUnitSelect(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
              {vacantUnits.map(u => <option key={u.id} value={u.id}>{u.unit_number} (R {u.monthly_rent})</option>)}
            </select>
          </div>
          
          <div className="bg-gold/5 p-4 rounded-xl border border-gold/20 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Auto Rent</p>
              <p className="font-bold text-lg text-black">R {rent}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Deposit (20%)</p>
              <input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="w-24 border-b border-gray-300 bg-transparent font-bold text-lg text-black focus:outline-none focus:border-gold text-right" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Phone</label>
              <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email (Login)</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Temporary Password</label>
            <input type="text" required autoComplete="new-password" placeholder="e.g. JumpHome1!" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
            <p className="text-[10px] text-gray-500 mt-1">Use 8–12 characters with uppercase and lowercase letters, a number, and a symbol. Provide this to the tenant so they can log in.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Lease Start</label>
              <input type="date" required value={leaseStart} onChange={(e) => setLeaseStart(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Lease End</label>
              <input type="date" required value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
            <SubmitButton loading={submitting} loadingText="Saving tenant..." error={submitError}>
              Save Tenant
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}