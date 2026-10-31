import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Building2 } from 'lucide-react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('landlord');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        await api.register({ full_name: fullName, email, password, role });
        setIsRegistering(false);
        alert('Account created successfully! Please log in.');
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_90%,rgba(197,160,89,0.15),transparent_45%)]"></div>
      
      <div className="w-full max-w-md bg-charcoal rounded-3xl p-8 border border-gray-800 shadow-2xl relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center font-bold text-black text-xl">JL</div>
          <div>
            <h1 className="text-xl text-ivory font-display font-semibold">Jump PropTech</h1>
            <p className="text-[10px] tracking-widest text-gold uppercase">By Jump Living</p>
          </div>
        </div>

        <h2 className="font-display text-3xl text-ivory mb-2">
          {isRegistering ? 'Create account.' : 'Welcome back.'}
        </h2>
        
        {error && <div className="bg-danger/20 border-l-4 border-danger text-red-200 p-3 rounded text-sm mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['landlord', 'tenant'].map((r) => (
                  <button key={r} type="button" onClick={() => setRole(r)} className={`border rounded-lg p-2 text-sm capitalize ${role === r ? 'border-gold bg-gold/10 text-gold' : 'border-gray-700 text-gray-400'}`}>{r}</button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-ivory focus:border-gold outline-none" />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-ivory focus:border-gold outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-ivory focus:border-gold outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gold text-black font-bold py-3 rounded-lg mt-4 hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-gold font-semibold hover:underline">
            {isRegistering ? 'Sign In' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}