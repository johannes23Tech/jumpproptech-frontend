import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Plus, Key, Home, CheckCircle, XCircle } from 'lucide-react';

type Unit = {
  id: number;
  property_id: number;
  property_name: string;
  unit_number: string;
  size_dimensions: string;
  is_furnished: number;
  included_items: string;
  monthly_rent: number;
  status: string;
};

type Property = {
  id: number;
  name: string;
};

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [propertyId, setPropertyId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [size, setSize] = useState('3x3m');
  const [isFurnished, setIsFurnished] = useState(false);
  const [includedItems, setIncludedItems] = useState('');
  const [rent, setRent] = useState('');
  const [status, setStatus] = useState('Vacant');

  const fetchData = async () => {
    try {
      const [unitsData, propertiesData] = await Promise.all([
        api.getUnits(),
        api.getProperties()
      ]);
      setUnits(unitsData);
      setProperties(propertiesData);
      
      // Auto-select first property if available
      if (propertiesData.length > 0) setPropertyId(propertiesData[0].id.toString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.createUnit({
        property_id: Number(propertyId),
        unit_number: unitNumber,
        size_dimensions: size,
        is_furnished: isFurnished,
        included_items: includedItems,
        monthly_rent: Number(rent),
        status: status
      });
      setIsModalOpen(false);
      // Reset form
      setUnitNumber('');
      setIncludedItems('');
      setRent('');
      fetchData(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold">Units & Rooms</h2>
        <button 
          onClick={() => setIsModalOpen(true)} 
          disabled={properties.length === 0}
          className="bg-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={18} /> Add Unit
        </button>
      </div>

      {properties.length === 0 && (
        <div className="bg-warning/10 text-warning p-4 rounded-lg mb-6">
          You need to add a Property before you can add Units.
        </div>
      )}

      {units.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center shadow-sm">
          <Key size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No units added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((u) => (
            <div key={u.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-display text-lg font-bold">{u.unit_number}</h3>
                  <p className="text-xs text-gray-500">{u.property_name}</p>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${u.status === 'Occupied' ? 'bg-success/10 text-success' : 'bg-gold/10 text-gold'}`}>
                  {u.status}
                </span>
              </div>
              
              <div className="space-y-1 mt-4">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-semibold text-black">Size:</span> {u.size_dimensions}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-semibold text-black">Rent:</span> R {u.monthly_rent}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-semibold text-black">Furnished:</span> {u.is_furnished ? 'Yes' : 'No'}
                </p>
                {u.included_items && (
                  <p className="text-sm text-gray-600 mt-2 bg-ivory-dark p-2 rounded">
                    <span className="font-semibold text-black">Included:</span> {u.included_items}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Unit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="font-display text-xl font-bold mb-4">Add New Unit</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property</label>
                <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required className="w-full border border-gray-300 rounded-lg p-3 focus:border-gold outline-none bg-white">
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit / Room Number</label>
                <input type="text" required placeholder="e.g. Room 1 or A101" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:border-gold outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Size</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:border-gold outline-none bg-white">
                    <option value="3x3m">3x3m (1 Room)</option>
                    <option value="3x6m">3x6m (2 Rooms)</option>
                    <option value="Custom">Custom Size</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rent (ZAR)</label>
                  <input type="number" required placeholder="1500" value={rent} onChange={(e) => setRent(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:border-gold outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:border-gold outline-none bg-white">
                  <option value="Vacant">Vacant</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="furnished" checked={isFurnished} onChange={(e) => setIsFurnished(e.target.checked)} className="w-4 h-4 text-gold focus:ring-gold rounded" />
                <label htmlFor="furnished" className="text-sm font-semibold text-gray-700">Fully Furnished</label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Included Items (Optional)</label>
                <textarea placeholder="e.g. Bed, Cupboard, Prepaid Meter Box #1234" value={includedItems} onChange={(e) => setIncludedItems(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:border-gold outline-none resize-none h-20"></textarea>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-black font-bold rounded-lg hover:opacity-90">Save Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}