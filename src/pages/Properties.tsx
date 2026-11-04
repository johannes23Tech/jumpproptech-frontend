import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Plus, Building2, MapPin } from 'lucide-react';
import PremiumButton from '../components/PremiumButton';
import Modal from '../components/Modal';

export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [suburb, setSuburb] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [type, setType] = useState('Apartment Block');
  const [description, setDescription] = useState('');

  const saProvinces = [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", 
    "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
  ];

  const fetchProperties = async () => {
    try {
      const data = await api.getProperties();
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.createProperty({ 
        name, address, city, province, suburb, postal_code: postalCode, 
        property_type: type, description 
      });
      setIsModalOpen(false);
      setName(''); setAddress(''); setCity(''); setProvince(''); setSuburb(''); setPostalCode(''); setDescription('');
      fetchProperties();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold">My Properties</h2>
        <PremiumButton onClick={() => setIsModalOpen(true)} icon={<Plus size={18} />}>
          Add Property
        </PremiumButton>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : properties.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center shadow-sm">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No properties added yet.</p>
          <button onClick={() => setIsModalOpen(true)} className="text-gold font-bold hover:underline">Add your first property</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-premium transition-shadow duration-300">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display text-lg font-bold">{p.name}</h3>
                <span className="text-[10px] uppercase font-bold bg-gold/10 text-gold px-2 py-1 rounded-full">{p.property_type}</span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin size={14} /> {p.address}, {p.suburb}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Add Property"
        subtitle="Add to your workspace"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Property Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rosebank Heights" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Address</label>
            <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 42 Oxford Road" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">City</label>
              <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Rustenburg" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Province</label>
              <select required value={province} onChange={(e) => setProvince(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
                <option value="">Select a province</option>
                {saProvinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Property Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
                <option>Apartment Block</option>
                <option>Backrooms</option>
                <option>Rooms</option>
                <option>Residential House</option>
                <option>Townhouse</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Suburb</label>
              <input type="text" required value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="e.g. Rosebank" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Postal Code</label>
              <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="e.g. 2196" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Description (Optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add useful context..." className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none h-24 resize-none" />
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">
              Cancel
            </button>
            <PremiumButton type="submit" fullWidth className="flex-1">
              Save Property
            </PremiumButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}