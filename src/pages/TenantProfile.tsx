import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Lock, Upload, CheckCircle, Users, Phone, Mail, User } from 'lucide-react';
import Toast from '../components/Toast'; // <-- FIXED IMPORT PATH

export default function TenantProfile() {
  const [tenantData, setTenantData] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    phone: '', id_number: '', occupants: 1, second_occupant_name: '', 
    vehicle_type: 'No vehicle', vehicle_details: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_relationship: '',
    emergency_contact_email: '', alt_email: '', id_document: ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [profileData, dashboardData] = await Promise.all([
          api.getTenantProfile(),
          api.getTenantData()
        ]);

        if (profileData) {
          setProfile({
            phone: profileData.phone || '',
            id_number: profileData.id_number || '',
            occupants: profileData.occupants || 1,
            second_occupant_name: profileData.second_occupant_name || '',
            vehicle_type: profileData.vehicle_type || 'No vehicle',
            vehicle_details: profileData.vehicle_details || '',
            emergency_contact_name: profileData.emergency_contact_name || '',
            emergency_contact_phone: profileData.emergency_contact_phone || '',
            emergency_relationship: profileData.emergency_relationship || '',
            emergency_contact_email: profileData.emergency_contact_email || '',
            alt_email: profileData.alt_email || '',
            id_document: profileData.id_document || ''
          });
        }
        if (dashboardData && dashboardData.tenant) {
          setTenantData(dashboardData.tenant);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const imageUrl = await api.uploadImage(file);
        setProfile({ ...profile, id_document: imageUrl });
        setToast({ msg: 'Image uploaded successfully', type: 'success' });
      } catch (err) {
        setToast({ msg: 'Failed to upload image', type: 'error' });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.updateTenantProfile(profile);
      setIsEditing(false);
      setToast({ msg: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ msg: 'Failed to update profile', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
        <div className="h-64 bg-gray-200 rounded-2xl"></div>
        <div className="h-48 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!tenantData) return <div className="p-8 text-center text-danger">Failed to load profile data.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12 w-full overflow-hidden">
      
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-black">My Profile</h2>
          <p className="text-sm text-gray-500">Manage your personal information.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-gold text-black px-6 py-2.5 rounded-xl font-bold text-sm shadow-gold hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            Edit Profile
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* LOCKED LEASE DETAILS */}
        <div className="bg-charcoal p-5 md:p-6 rounded-2xl border border-gray-800 shadow-premium">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-gold" />
            <h3 className="font-display text-lg font-bold text-ivory">Lease Details (Locked)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
              <p className="text-sm font-semibold text-ivory truncate">{tenantData.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Unit & Property</p>
              <p className="text-sm font-semibold text-ivory truncate">{tenantData.unit_number} - {tenantData.property_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Agreed Rent</p>
              <p className="text-sm font-semibold text-gold-light">R {tenantData.monthly_rent}</p>
            </div>
          </div>
        </div>

        {/* EDITABLE CONTACT DETAILS */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm w-full">
          <h3 className="font-display text-lg font-bold mb-4 text-black border-b border-gray-100 pb-2">Contact Details</h3>
          <div className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cellphone Number</label>
              {isEditing ? (
                <input type="text" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full border border-gray-300 p-3 rounded-lg focus:border-gold outline-none text-sm" />
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-black bg-ivory p-3 rounded-lg border border-gray-100">
                  <Phone size={16} className="text-gray-400" /> {profile.phone || 'Not provided'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Login Email (Locked)</label>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-not-allowed truncate">
                <Mail size={16} className="text-gray-400 shrink-0" /> {tenantData.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Alternative Email</label>
              {isEditing ? (
                <input type="email" value={profile.alt_email} onChange={(e) => setProfile({ ...profile, alt_email: e.target.value })} className="w-full border border-gray-300 p-3 rounded-lg focus:border-gold outline-none text-sm" />
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-black bg-ivory p-3 rounded-lg border border-gray-100">
                  <Mail size={16} className="text-gray-400" /> {profile.alt_email || 'Not provided'}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* NEXT OF KIN */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm w-full">
          <h3 className="font-display text-lg font-bold mb-4 text-black border-b border-gray-100 pb-2">Emergency Contact (Next of Kin)</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
              {isEditing ? (
                <input type="text" value={profile.emergency_contact_name} onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })} className="w-full border border-gray-300 p-3 rounded-lg focus:border-gold outline-none text-sm" />
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-black bg-ivory p-3 rounded-lg border border-gray-100 truncate">
                  <Users size={16} className="text-gray-400 shrink-0" /> {profile.emergency_contact_name || 'Not provided'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Relationship</label>
                {isEditing ? (
                  <input type="text" value={profile.emergency_relationship} onChange={(e) => setProfile({ ...profile, emergency_relationship: e.target.value })} className="w-full border border-gray-300 p-3 rounded-lg focus:border-gold outline-none text-sm" />
                ) : (
                  <div className="flex items-center gap-2 text-sm font-semibold text-black bg-ivory p-3 rounded-lg border border-gray-100">
                    <User size={16} className="text-gray-400" /> {profile.emergency_relationship || 'Not provided'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                {isEditing ? (
                  <input type="text" value={profile.emergency_contact_phone} onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })} className="w-full border border-gray-300 p-3 rounded-lg focus:border-gold outline-none text-sm" />
                ) : (
                  <div className="flex items-center gap-2 text-sm font-semibold text-black bg-ivory p-3 rounded-lg border border-gray-100">
                    <Phone size={16} className="text-gray-400" /> {profile.emergency_contact_phone || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* IDENTITY VERIFICATION */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm w-full">
          <h3 className="font-display text-lg font-bold mb-4 text-black border-b border-gray-100 pb-2">Identity Verification</h3>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="cursor-pointer bg-ivory-dark border border-gray-300 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors w-full sm:w-auto text-sm">
              <Upload size={18} /> {uploading ? 'Uploading...' : 'Upload ID / Passport'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
            {profile.id_document && (
              <span className="text-success text-sm font-bold flex items-center gap-1">
                <CheckCircle size={16} /> Document Uploaded
              </span>
            )}
          </div>
          
          {profile.id_document && (
            <div className="mt-4 w-full max-w-xs">
              <a href={profile.id_document} target="_blank" rel="noopener noreferrer">
                <img src={profile.id_document} alt="ID" className="w-full max-h-48 object-contain rounded-lg border border-gray-300 hover:opacity-80 transition-opacity bg-gray-50" />
              </a>
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              className="flex-1 py-3.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={uploading}
              className="flex-1 bg-gold text-black font-bold py-3.5 rounded-xl shadow-gold hover:opacity-90 transition-opacity order-1 sm:order-2 disabled:opacity-50"
            >
              Save Profile Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}