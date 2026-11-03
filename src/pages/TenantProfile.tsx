import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { 
  User, Lock, Phone, Mail, Users, ShieldAlert, 
  ChevronRight, Edit3, X, Check, FileText, Key
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TenantProfile() {
  const [tenantData, setTenantData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState({
    phone: '', alt_email: '', 
    emergency_contact_name: '', emergency_contact_phone: '', 
    emergency_contact_email: '', emergency_relationship: '',
    login_email: ''
  });

  useEffect(() => {
    api.getTenantProfile().then(data => {
      if (data) {
        setProfile({
          phone: data.phone || '',
          alt_email: data.alt_email || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          emergency_contact_email: data.emergency_contact_email || '',
          emergency_relationship: data.emergency_relationship || '',
          login_email: data.login_email || ''
        });
      }
      api.getTenantData().then(res => setTenantData(res.tenant));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.updateTenantProfile(profile);
      setIsEditing(false); // Close the boxes on save
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  if (loading || !tenantData) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl font-bold text-black">Profile</h1>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-gold text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-gold hover:opacity-90"
          >
            <Edit3 size={16} /> Edit Profile
          </button>
        )}
      </div>

      {/* User Card (No Image) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-premium p-6 flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-charcoal text-gold flex items-center justify-center font-display font-bold text-2xl">
          {tenantData.name?.charAt(0)}
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-black">{tenantData.name}</h2>
          <p className="text-sm text-gray-500">{profile.login_email}</p>
          <span className="inline-block mt-1 text-[10px] uppercase font-bold bg-gold/10 text-gold px-2 py-0.5 rounded-full tracking-wider">Tenant</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* SECTION: Locked Info */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Lease Information (Locked)</h3>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3 text-gray-500">
                <Lock size={18} /> <span className="text-sm font-medium">Full Name</span>
              </div>
              <span className="text-sm font-bold text-black">{tenantData.name}</span>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3 text-gray-500">
                <ShieldAlert size={18} /> <span className="text-sm font-medium">ID / Passport</span>
              </div>
              <span className="text-sm font-bold text-black">{tenantData.id_number || 'Not provided'}</span>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 text-gray-500">
                <Key size={18} /> <span className="text-sm font-medium">Room</span>
              </div>
              <span className="text-sm font-bold text-black">{tenantData.unit_number} - {tenantData.property_name}</span>
            </div>
          </div>
        </div>

        {/* SECTION: Contact Info */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Contact Details</h3>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Cellphone */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-gray-500">
                  <Phone size={18} /> <span className="text-sm font-medium">Cellphone</span>
                </div>
                {!isEditing && <span className="text-sm text-black">{profile.phone || 'Not set'}</span>}
              </div>
              {isEditing && (
                <input 
                  type="text" 
                  value={profile.phone} 
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                  className="w-full mt-3 border border-gray-300 rounded-lg p-2 focus:border-gold outline-none text-sm" 
                  placeholder="e.g. 082 555 0101"
                />
              )}
            </div>

            {/* Email */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-gray-500">
                  <Mail size={18} /> <span className="text-sm font-medium">Email Address</span>
                </div>
                {!isEditing && <span className="text-sm text-black">{profile.login_email}</span>}
              </div>
              {isEditing && (
                <input 
                  type="email" 
                  value={profile.login_email} 
                  disabled
                  className="w-full mt-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg p-2 outline-none text-sm cursor-not-allowed" 
                />
              )}
            </div>

            {/* Alt Email */}
            <div className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-gray-500">
                  <Mail size={18} /> <span className="text-sm font-medium">Alternative Email</span>
                </div>
                {!isEditing && <span className="text-sm text-black">{profile.alt_email || 'Not set'}</span>}
              </div>
              {isEditing && (
                <input 
                  type="email" 
                  value={profile.alt_email} 
                  onChange={(e) => setProfile({ ...profile, alt_email: e.target.value })} 
                  className="w-full mt-3 border border-gray-300 rounded-lg p-2 focus:border-gold outline-none text-sm" 
                  placeholder="Optional"
                />
              )}
            </div>
          </div>
        </div>

        {/* SECTION: Next of Kin */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Next of Kin</h3>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-gray-500">
                  <Users size={18} /> <span className="text-sm font-medium">Full Name & Surname</span>
                </div>
                {!isEditing && <span className="text-sm text-black">{profile.emergency_contact_name || 'Not set'}</span>}
              </div>
              {isEditing && (
                <input 
                  type="text" 
                  value={profile.emergency_contact_name} 
                  onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })} 
                  className="w-full mt-3 border border-gray-300 rounded-lg p-2 focus:border-gold outline-none text-sm" 
                />
              )}
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-gray-500">
                  <User size={18} /> <span className="text-sm font-medium">Relationship</span>
                </div>
                {!isEditing && <span className="text-sm text-black">{profile.emergency_relationship || 'Not set'}</span>}
              </div>
              {isEditing && (
                <input 
                  type="text" 
                  value={profile.emergency_relationship} 
                  onChange={(e) => setProfile({ ...profile, emergency_relationship: e.target.value })} 
                  className="w-full mt-3 border border-gray-300 rounded-lg p-2 focus:border-gold outline-none text-sm" 
                  placeholder="e.g. Mother"
                />
              )}
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-gray-500">
                  <Phone size={18} /> <span className="text-sm font-medium">Cellphone</span>
                </div>
                {!isEditing && <span className="text-sm text-black">{profile.emergency_contact_phone || 'Not set'}</span>}
              </div>
              {isEditing && (
                <input 
                  type="text" 
                  value={profile.emergency_contact_phone} 
                  onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })} 
                  className="w-full mt-3 border border-gray-300 rounded-lg p-2 focus:border-gold outline-none text-sm" 
                />
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-gray-500">
                  <Mail size={18} /> <span className="text-sm font-medium">Email</span>
                </div>
                {!isEditing && <span className="text-sm text-black">{profile.emergency_contact_email || 'Not set'}</span>}
              </div>
              {isEditing && (
                <input 
                  type="email" 
                  value={profile.emergency_contact_email} 
                  onChange={(e) => setProfile({ ...profile, emergency_contact_email: e.target.value })} 
                  className="w-full mt-3 border border-gray-300 rounded-lg p-2 focus:border-gold outline-none text-sm" 
                />
              )}
            </div>
          </div>
        </div>

        {/* SECTION: Security & Support */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Security & Support</h3>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <Link to="/forgot-password" className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 text-gray-500">
                <Lock size={18} /> <span className="text-sm font-medium">Change Password</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
            
            <Link to="/documents" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 text-gray-500">
                <FileText size={18} /> <span className="text-sm font-medium">Lease Documents</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          </div>
        </div>

        {/* Action Buttons (Only show when editing) */}
        {isEditing && (
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <X size={18} /> Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-gold text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-gold hover:opacity-90 transition-opacity"
            >
              <Check size={18} /> Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}