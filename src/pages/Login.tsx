import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithData } = useAuth();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (isRegistering) {
      if (!fullName.trim()) newErrors.fullName = "Full name is required.";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) newErrors.email = "Please enter a valid email address.";
      if (password.length < 6) newErrors.password = "Password must be at least 6 characters.";
      if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
      if (!agreeTerms) newErrors.agreeTerms = "You must agree to the legal terms to proceed.";
    } else {
      if (!email) newErrors.email = "Email is required.";
      if (!password) newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isRegistering) {
        const res = await api.register({ full_name: fullName, email, password, role: 'tenant' });
        
        // Auto-login and set flag for the overlay
        localStorage.setItem('just_registered', 'true');
        loginWithData(res.user, res.token);
        
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_90%,rgba(197,160,89,0.15),transparent_45%)]"></div>
      
      <div className="w-full max-w-md bg-charcoal rounded-3xl p-8 border border-gray-800 shadow-2xl relative z-10 my-8">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center font-bold text-black text-xl">JL</div>
          <div>
            <h1 className="text-xl text-ivory font-display font-semibold">Jump PropTech</h1>
            <p className="text-[10px] tracking-widest text-gold uppercase">By Jump Living</p>
          </div>
        </div>

        <h2 className="font-display text-3xl text-ivory mb-2">
          {isRegistering ? 'Create Tenant Account.' : 'Welcome back.'}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {isRegistering ? 'Landlord accounts are created by Jump Living admins only.' : 'Sign in to manage your dashboard.'}
        </p>
        
        {globalError && (
          <div className="bg-danger/20 border-l-4 border-danger text-red-200 p-3 rounded text-sm mb-6 flex items-center gap-2">
            <AlertCircle size={16} /> {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-ivory focus:outline-none transition-colors ${errors.fullName ? 'border-danger' : 'border-gray-700 focus:border-gold'}`} />
              {errors.fullName && <p className="text-danger text-xs mt-1">{errors.fullName}</p>}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-ivory focus:outline-none transition-colors ${errors.email ? 'border-danger' : 'border-gray-700 focus:border-gold'}`} />
            {errors.email && <p className="text-danger text-xs mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-ivory focus:outline-none transition-colors pr-12 ${errors.password ? 'border-danger' : 'border-gray-700 focus:border-gold'}`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-danger text-xs mt-1">{errors.password}</p>}
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-ivory focus:outline-none transition-colors pr-12 ${errors.confirmPassword ? 'border-danger' : 'border-gray-700 focus:border-gold'}`} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold transition-colors">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-danger text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
          )}
          
          {!isRegistering && (
            <div className="flex justify-end pt-1">
              <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-gold transition-colors">Forgot Password?</Link>
            </div>
          )}

          {isRegistering && (
            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1 w-4 h-4 text-gold bg-gray-900 border-gray-700 rounded focus:ring-gold focus:ring-2 shrink-0 cursor-pointer" />
                <span className="text-[11px] text-gray-400 leading-relaxed">
                  I agree to the <Link to="/terms" target="_blank" className="text-gold hover:underline font-semibold">Terms of Service</Link>, <Link to="/privacy" target="_blank" className="text-gold hover:underline font-semibold">Privacy Policy</Link>, Fair House Rules, and authorize automatic rent disclosures as required by POPIA.
                </span>
              </label>
              {errors.agreeTerms && <p className="text-danger text-xs mt-2 ml-7">{errors.agreeTerms}</p>}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-gold text-black font-bold py-3 rounded-lg mt-6 hover:opacity-90 disabled:opacity-50 transition-opacity flex justify-center items-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
                Processing...
              </span>
            ) : (
              isRegistering ? 'Create Tenant Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsRegistering(!isRegistering); setErrors({}); setGlobalError(''); }} className="text-gold font-semibold hover:underline">
            {isRegistering ? 'Sign In' : 'Register as Tenant'}
          </button>
        </div>
      </div>
    </div>
  );
}