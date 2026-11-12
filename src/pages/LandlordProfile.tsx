import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { validatePassword } from '../utils/security';
import { CheckCircle, Lock } from 'lucide-react';

export default function LandlordProfile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current password.');
      return;
    }

    try {
      // We need to add this to the API
      await api.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="font-display text-2xl font-bold">My Account</h2>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gold text-black flex items-center justify-center font-bold text-xl">
          {user?.full_name?.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="font-bold text-lg">{user?.full_name}</p>
          <p className="text-gray-500">{user?.email}</p>
          <span className="inline-block mt-1 bg-charcoal text-gold text-xs px-2 py-1 rounded uppercase font-bold tracking-widest">{user?.role}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={18} className="text-gold" />
          <h3 className="font-display text-lg font-bold">Change Password</h3>
        </div>

        {success && <div className="bg-success/10 text-success p-3 rounded-lg flex items-center gap-2"><CheckCircle size={18} /> Password updated!</div>}
        {error && <div className="bg-danger/10 text-danger p-3 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
            <input type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border p-3 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
            <input type="password" autoComplete="new-password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border p-3 rounded-lg" />
            <p className="text-gray-500 text-xs mt-1">Use 8–12 characters with uppercase and lowercase letters, a number, and a symbol.</p>
          </div>
          <button type="submit" className="w-full bg-gold text-black font-bold py-3 rounded-lg mt-2 hover:opacity-90 transition-opacity">Update Password</button>
        </form>
      </div>
    </div>
  );
}