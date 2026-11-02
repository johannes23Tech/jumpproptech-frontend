import { useState, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [debugLink, setDebugLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setDebugLink('');
    
    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message);
      if (res.debug_link) setDebugLink(res.debug_link);
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
          <div>
            <h1 className="text-xl text-ivory font-display font-semibold">Jump PropTech</h1>
          </div>
        </div>

        <h2 className="font-display text-2xl text-ivory mb-2">Reset Password</h2>
        <p className="text-sm text-gray-400 mb-6">Enter your email address and we'll send you a link to reset your password.</p>

        {error && <div className="bg-danger/20 border-l-4 border-danger text-red-200 p-3 rounded text-sm mb-6">{error}</div>}
        {message && <div className="bg-success/20 border-l-4 border-success text-green-200 p-3 rounded text-sm mb-6">{message}</div>}

        {debugLink && (
          <div className="bg-blue-900/30 border border-blue-500 text-blue-200 p-3 rounded text-sm mb-6 break-all">
            <strong>Testing Mode:</strong> <br/>
            <a href={debugLink} className="underline text-blue-300">Click here to reset your password</a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-ivory focus:border-gold outline-none" />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-gold text-black font-bold py-3 rounded-lg mt-4 hover:opacity-90 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Remember your password? <Link to="/login" className="text-gold font-semibold hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}