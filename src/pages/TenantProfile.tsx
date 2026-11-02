import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Lock, Upload, CheckCircle, Car, Users } from 'lucide-react';

export default function TenantProfile() {
  const [tenantData, setTenantData] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    phone: '', id_number: '', occupants: 1, second_occupant_name: '', 
    vehicle_type: 'No vehicle', vehicle_details: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_relationship: '',
    id_document: ''
  });
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.getTenantProfile().then(data => {
      if (data) setProfile({ ...profile, ...data });
      api.getTenantData().then(res => setTenantData(res.tenant));
    }).catch(console.error);
  }, []);

  // UPDATED: Upload to Cloudinary instead of Base64
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const imageUrl = await api.uploadImage(file);
        setProfile({ ...profile, id_document: imageUrl });
      } catch (err) {
        alert("Failed to upload image. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.updateTenantProfile(profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  if (!tenantData) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="font-display text-2xl font-bold">My Profile & Information</h2>

      {success && <div className="bg-success/10 text-success p-4 rounded-lg flex items-center gap-2"><CheckCircle size={20} /> Profile updated!</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* LOCKED DETAILS */}
        <div className="bg-charcoal p-6 rounded-2xl border border-gray-800 text-ivory">
          <div className="flex items-center gap-2 mb-4"><Lock size={18} className="text-gold" /><h3 className="font-display text-lg font-bold">Lease Details (Locked)</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label><input type="text" value={tenantData.name || ''} disabled className="w-full bg-gray-900 border border-gray-700 text-gray-400 p-3 rounded-lg cursor-not-allowed" /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit</label><input type="text" value={tenantData.unit_number || ''} disabled className="w-full bg-gray-900 border border-gray-700 text-gray-400 p-3 rounded-lg cursor-not-allowed" /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Agreed Rent</label><input type="text" value={`R ${tenantData.monthly_rent || 0}`} disabled className="w-full bg-gray-900 border border-gray-700 text-gray-400 p-3 rounded-lg cursor-not-allowed" /></div>
          </div>
        </div>

        {/* PERSONAL DETAILS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-display text-lg font-bold mb-2">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">SA ID / Passport Number</label><input type="text" value={profile.id_number || ''} onChange={(e) => setProfile({ ...profile, id_number: e.target.value })} className="w-full border p-3 rounded-lg focus:border-gold outline-none" /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile / WhatsApp</label><input type="text" required value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full border p-3 rounded-lg focus:border-gold outline-none" /></div>
          </div>
        </div>

        {/* OCCUPANTS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2"><Users size={18} className="text-gold" /><h3 className="font-display text-lg font-bold">Room Occupants</h3></div>
          <p className="text-sm text-gray-500 mb-4">Total number of people living in the room (Max 2 for 3x3m):</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="radio" name="occupants" checked={profile.occupants == 1} onChange={() => setProfile({ ...profile, occupants: 1 })} className="w-4 h-4 text-gold" /><span>1 Person</span></label>
            <label className="flex items-center gap-2"><input type="radio" name="occupants" checked={profile.occupants == 2} onChange={() => setProfile({ ...profile, occupants: 2 })} className="w-4 h-4 text-gold" /><span>2 People</span></label>
          </div>
          {profile.occupants == 2 && (
            <div className="mt-4"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name & Relationship of 2nd Occupant</label><input type="text" value={profile.second_occupant_name || ''} onChange={(e) => setProfile({ ...profile, second_occupant_name: e.target.value })} placeholder="e.g. Jane Doe (Sister)" className="w-full border p-3 rounded-lg focus:border-gold outline-none" /></div>
          )}
        </div>

        {/* VEHICLE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2"><Car size={18} className="text-gold" /><h3 className="font-display text-lg font-bold">Vehicle Information</h3></div>
          <p className="text-sm text-gray-500 mb-4">Will you have a vehicle parked on the property?</p>
          <div className="flex flex-wrap gap-4 mb-4">
            {['No vehicle', 'Yes, Car/Bakkie', 'Yes, Motorbike'].map(type => (
              <label key={type} className="flex items-center gap-2"><input type="radio" name="vehicle" checked={profile.vehicle_type === type} onChange={() => setProfile({ ...profile, vehicle_type: type })} className="w-4 h-4 text-gold" /><span>{type}</span></label>
            ))}
          </div>
          {profile.vehicle_type !== 'No vehicle' && (
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Make, Model & License Plate</label><input type="text" value={profile.vehicle_details || ''} onChange={(e) => setProfile({ ...profile, vehicle_details: e.target.value })} placeholder="e.g. White Toyota Corolla, REG123GP" className="w-full border p-3 rounded-lg focus:border-gold outline-none" /></div>
          )}
        </div>

        {/* EMERGENCY CONTACT */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-display text-lg font-bold mb-2">Emergency Contact (Next of Kin)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label><input type="text" value={profile.emergency_contact_name || ''} onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })} className="w-full border p-3 rounded-lg focus:border-gold outline-none" /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Relationship</label><input type="text" value={profile.emergency_relationship || ''} onChange={(e) => setProfile({ ...profile, emergency_relationship: e.target.value })} placeholder="e.g. Mother" className="w-full border p-3 rounded-lg focus:border-gold outline-none" /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label><input type="text" value={profile.emergency_contact_phone || ''} onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })} className="w-full border p-3 rounded-lg focus:border-gold outline-none" /></div>
          </div>
        </div>

        {/* IDENTITY VERIFICATION */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-display text-lg font-bold mb-2">Identity Verification</h3>
          <p className="text-xs text-gray-500 mb-4">Upload a clear photo of your SA ID Book, Smart Card, or Passport.</p>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-ivory-dark border border-gray-300 px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors">
              <Upload size={18} /> {uploading ? 'Uploading...' : 'Upload Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
            {profile.id_document && <span className="text-success text-sm font-bold flex items-center gap-1"><CheckCircle size={16} /> Document Uploaded</span>}
          </div>
          {profile.id_document && <img src={profile.id_document} alt="ID" className="mt-4 max-h-40 rounded-lg border border-gray-300 object-contain" />}
        </div>

        <button type="submit" className="w-full bg-gold text-black font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity">Save Profile Changes</button>
      </form>
    </div>
  );
}