import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Camera, Plus, Wrench, CheckCircle } from 'lucide-react';

export default function TenantMaintenance() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [category, setCategory] = useState('Plumbing');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Routine');
  const [photo, setPhoto] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchTickets = async () => {
    const res = await api.getMaintenanceData();
    setTickets(res.tickets);
  };

  useEffect(() => { fetchTickets(); }, []);

  // UPDATED: Upload to Cloudinary instead of Base64
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const imageUrl = await api.uploadImage(file);
        setPhoto(imageUrl);
      } catch (err) {
        alert("Failed to upload image. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLogIssue = async (e: FormEvent) => {
    e.preventDefault();
    if (!photo) return alert("A photo is required to submit a maintenance ticket.");
    
    await api.logMaintenance({ category, description, priority, photo });
    setIsModalOpen(false);
    setDescription('');
    setPhoto('');
    fetchTickets();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold">My Maintenance Tickets</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90">
          <Plus size={18} /> Log New Issue
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tickets.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl border border-gray-200 text-center">
            <Wrench size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No maintenance issues reported.</p>
          </div>
        ) : (
          tickets.map((m: any) => (
            <div key={m.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-lg">{m.category}</p>
                    <p className="text-sm text-gray-600">{m.description}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${m.status === 'Resolved' ? 'bg-success/10 text-success' : m.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-warning/10 text-warning'}`}>
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Priority: {m.priority} • Severity: {m.severity}</p>
                
                {m.photo && (
                  <a href={m.photo} target="_blank" rel="noopener noreferrer">
                    <img src={m.photo} alt="Issue" className="mt-3 w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer" />
                  </a>
                )}
              </div>
              
              {m.contractor_name && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                  <span className="text-gray-500">Assigned to:</span> <span className="font-bold">{m.contractor_name}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Log Maintenance Issue</h3>
            <form onSubmit={handleLogIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border p-3 rounded-lg bg-white">
                  <option>Plumbing</option><option>Electrical</option><option>Flooring</option><option>Doors</option><option>Roof</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-3 rounded-lg h-20" placeholder="Describe the issue..." />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Upload Photo (Mandatory)</label>
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 block">
                  <Camera className={`mx-auto mb-1 ${photo ? 'text-success' : 'text-gray-400'}`} />
                  <p className="text-xs text-gray-500">
                    {uploading ? 'Uploading...' : photo ? "Photo Attached ✓" : "Tap to take photo"}
                  </p>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Urgency</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border p-3 rounded-lg bg-white">
                  <option value="Routine">Routine (1-5 days)</option>
                  <option value="Emergency">Emergency (24 hours)</option>
                </select>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={!photo || uploading} className="flex-1 py-3 bg-gold text-black font-bold rounded-lg disabled:opacity-50">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}