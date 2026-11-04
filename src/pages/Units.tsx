import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Plus, Key, User } from 'lucide-react';
import PremiumButton from '../components/PremiumButton';
import Modal from '../components/Modal';

export default function Units() {
  const [units, setUnits] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [propertyId, setPropertyId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState('3x3m (1 Room)');
  const [rent, setRent] = useState('');
  const [status, setStatus] = useState('Vacant');
  const [tenantId, setTenantId] = useState('');
  const [isFurnished, setIsFurnished] = useState(false);
  const [includedItems, setIncludedItems] = useState('');

  const fetchData = async () => {
    try {
      const [unitsData, propertiesData, tenantsData] = await Promise.all([
        api.getUnits(), api.getProperties(), api.getTenants()
      ]);
      setUnits(unitsData);
      setProperties(propertiesData);
      setTenants(tenantsData);
      if (propertiesData.length > 0) setPropertyId(propertiesData[0].id.toString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.createUnit({
        property_id: Number(propertyId), unit_number: unitNumber,
        size_dimensions: unitType, is_furnished: isFurnished,
        included_items: includedItems, monthly_rent: Number(rent),
        status: status, tenant_id: tenantId ? Number(tenantId) : null
      });
      setIsModalOpen(false);
      setUnitNumber(''); setRent(''); setIncludedItems(''); setTenantId('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold">Units & Rooms</h2>
        <PremiumButton onClick={() => setIsModalOpen(true)} icon={<Plus size={18} />} disabled={properties.length === 0}>
          Add Unit
        </PremiumButton>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> : properties.length === 0 ? (
        <div className="bg-warning/10 text-warning p-4 rounded-lg mb-6 border border-warning/20">You need to add a Property first.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((u) => (
            <div key={u.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-premium transition-shadow duration-300">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-display text-lg font-bold">{u.unit_number}</h3>
                  <p className="text-xs text-gray-500">{u.property_name}</p>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${u.status === 'Occupied' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{u.status}</span>
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p className="flex justify-between"><span>Rent:</span> <span className="font-bold text-black">R {u.monthly_rent}</span></p>
                <p className="flex justify-between"><span>Size:</span> <span>{u.size_dimensions}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Add Unit"
        subtitle="Add to your workspace"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Unit Number</label>
            <input type="text" required value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="e.g. Room 1 or A101" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Property</label>
            <select required value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Unit Type / Size</label>
            <select value={unitType} onChange={(e) => setUnitType(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
              <option>3x3m (1 Room)</option>
              <option>3x6m (2 Rooms)</option>
              <option>Apartment</option>
              <option>House</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Monthly Rent (ZAR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R</span>
              <input type="number" required value={rent} onChange={(e) => setRent(e.target.value)} placeholder="0.00" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 pl-9 text-sm focus:border-gold outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Occupancy Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
              <option>Vacant</option>
              <option>Occupied</option>
              <option>Maintenance</option>
            </select>
          </div>

          {status === 'Occupied' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <User size={14} /> Tenant (Optional)
              </label>
              <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
                <option value="">No tenant assigned</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="furnished" checked={isFurnished} onChange={(e) => setIsFurnished(e.target.checked)} className="w-4 h-4 text-gold bg-gray-100 border-gray-300 rounded focus:ring-gold" />
            <label htmlFor="furnished" className="text-sm font-semibold text-gray-700">Includes Furniture</label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Included Items (Optional)</label>
            <input type="text" value={includedItems} onChange={(e) => setIncludedItems(e.target.value)} placeholder="e.g. Bed, Prepaid Meter Box" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
            <PremiumButton type="submit" fullWidth className="flex-1">Save Unit</PremiumButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}