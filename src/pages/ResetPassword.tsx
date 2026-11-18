import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { validatePassword } from '../utils/security';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  // Read once. The token is single-use and must not stay in the URL, where it
  // can leak through history, screenshots or referrer headers.
  const [token] = useState(() => searchParams.get('token'));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [token]);

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("No reset token found in the URL.");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await api.resetPassword({ token, password: newPassword });
      setNewPassword('');
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-ivory focus:border-gold outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gold"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">Use 8–12 characters with uppercase and lowercase letters, a number, and a symbol.</p>
          </div>
          
          <button type="submit" disabled={loading || !token} className="w-full bg-gold text-black font-bold py-3 rounded-lg mt-4 hover:opacity-90 disabled:opacity-50">
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}