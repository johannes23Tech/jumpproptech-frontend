import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Plus, Building2 } from 'lucide-react';

type Property = {
  id: number;
  name: string;
  address: string;
  property_type: string;
};

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('Backroom');

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

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.createProperty({ name, address, property_type: type });
      setIsModalOpen(false);
      setName('');
      setAddress('');
      fetchProperties();
    } catch (err) {
      alert('Error creating property');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold">My Properties</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90">
          <Plus size={18} /> Add Property
        </button>
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
            <div key={p.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display text-lg font-bold">{p.name}</h3>
                <span className="text-[10px] uppercase font-bold bg-gold/10 text-gold px-2 py-1 rounded-full">{p.property_type}</span>
              </div>
              <p className="text-sm text-gray-500">{p.address}</p>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Add New Property</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:border-gold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:border-gold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:border-gold outline-none bg-white">
                  <option value="Backroom">Backroom</option>
                  <option value="Precast Structure">Precast Structure</option>
                  <option value="Apartment Block">Apartment Block</option>
                  <option value="House">House</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-black font-bold rounded-lg hover:opacity-90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}