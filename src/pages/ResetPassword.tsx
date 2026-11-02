import { useState, type FormEvent } from 'react';
import { api } from '../utils/api';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("No reset token found in the URL.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await api.resetPassword({ token, new_password: newPassword });
      setMessage(res.message);
      setTimeout(() => navigate('/login'), 3000); // Redirect to login after 3 seconds
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-charcoal rounded-3xl p-8 border border-gray-800 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center font-bold text-black text-xl">JL</div>
        </div>

        <h2 className="font-display text-2xl text-ivory mb-6">Create New Password</h2>

        {error && <div className="bg-danger/20 border-l-4 border-danger text-red-200 p-3 rounded text-sm mb-6">{error}</div>}
        {message && <div className="bg-success/20 border-l-4 border-success text-green-200 p-3 rounded text-sm mb-6">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">New Password</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-ivory focus:border-gold outline-none" />
          </div>
          
          <button type="submit" disabled={loading || !token} className="w-full bg-gold text-black font-bold py-3 rounded-lg mt-4 hover:opacity-90 disabled:opacity-50">
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}