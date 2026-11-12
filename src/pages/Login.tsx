import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { validatePassword } from '../utils/security';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import AnimatedAuthBackground from '../components/AnimatedAuthBackground';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const { login, loginMfa, loginWithData } = useAuth();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (isRegistering) {
      if (!firstName.trim()) newErrors.firstName = "First name is required.";
      if (!surname.trim()) newErrors.surname = "Surname is required.";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) newErrors.email = "Please enter a valid email address.";
      const passwordError = validatePassword(password);
      if (passwordError) newErrors.password = passwordError;
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
        const res = await api.register({ full_name: [firstName.trim(), surname.trim()].join(' '), email, password, role: 'tenant' });
        
        // Auto-login and set flag for the overlay
        localStorage.setItem('just_registered', 'true');
        loginWithData(res.user, res.token);
        
      } else {
        const res = await login(email, password);
        if (res?.mfa_required) {
          setMfaToken(res.mfa_token);
          setMfaCode('');
          setMfaRequired(true);
        }
      }
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Could not complete sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (!mfaCode.trim()) {
      setGlobalError('Enter the code from your authenticator app.');
      return;
    }

    setLoading(true);
    try {
      await loginMfa(mfaToken, mfaCode.trim());
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Could not verify your sign-in code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Second factor step: password already accepted, no session yet.
  if (mfaRequired) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_90%,rgba(197,160,89,0.15),transparent_45%)]"></div>
        <div className="w-full max-w-md bg-charcoal rounded-3xl p-8 border border-gray-800 shadow-2xl relative z-10 my-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center text-black">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl text-ivory font-display font-semibold">Two-factor authentication</h1>
              <p className="text-[10px] tracking-widest text-gold uppercase">Jump PropTech Security</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-6">
            Enter the 6-digit code from your authenticator app. You can also use one of your
            recovery codes.
          </p>

          {globalError && (
            <div className="bg-danger/20 border-l-4 border-danger text-red-200 p-3 rounded text-sm mb-6 flex items-center gap-2">
              <AlertCircle size={16} /> {globalError}
            </div>
          )}

          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="123456"
              maxLength={14}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-ivory text-center text-2xl tracking-[0.3em] focus:outline-none focus:border-gold"
            />

            <button type="submit" disabled={loading} className="w-full bg-gold text-black font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex justify-center items-center">
              {loading ? 'Verifying...' : 'Verify and sign in'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setMfaRequired(false); setMfaToken(''); setMfaCode(''); setGlobalError(''); }}
            className="mt-6 flex items-center gap-2 text-sm text-gray-400 hover:text-gold transition-colors mx-auto"
          >
            <ArrowLeft size={16} /> Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="legacy-auth-shell">
      <AnimatedAuthBackground />
      <section className="legacy-auth-card auth-entry-card w-full max-w-md rounded-3xl p-8 relative z-10 my-8">
        
        <div className="flex items-center gap-3 mb-8">
          <img src="/icons/icon-512.png" alt="Jump PropTech logo" className="w-12 h-12 rounded-xl bg-white object-contain p-1" />
          <div>
            <h1 className="text-xl text-ivory font-display font-semibold">Jump PropTech</h1>
            <p className="text-[10px] tracking-widest text-gold uppercase">By Jump Living</p>
          </div>
        </div>

        <p className="legacy-auth-kicker">{isRegistering ? 'TENANT ACCOUNT REGISTRATION' : 'SECURE SIGN IN'}</p>
        <h2 className="font-display text-3xl text-ivory mb-2">
          {isRegistering ? 'Create your account.' : 'Welcome back!'}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {isRegistering ? 'Create a tenant account to discover properties, save favourites, and contact property professionals.' : 'Sign in to continue to your Jump account.'}
        </p>

        {isRegistering && (
          <div className="legacy-account-switch">
            Already registered?{' '}
            <button type="button" onClick={() => { setIsRegistering(false); setErrors({}); setGlobalError(''); }} className="text-gold font-semibold hover:underline">
              Sign in
            </button>
          </div>
        )}
        
        {globalError && (
          <div className="bg-danger/20 border-l-4 border-danger text-red-200 p-3 rounded text-sm mb-6 flex items-center gap-2">
            <AlertCircle size={16} /> {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="legacy-auth-form space-y-4">
          {isRegistering && (
            <div className="legacy-name-grid">
              <label className="legacy-auth-field">First name
                <input type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={errors.firstName ? 'has-error' : ''} />
                {errors.firstName && <small className="legacy-error">{errors.firstName}</small>}
              </label>
              <label className="legacy-auth-field">Surname
                <input type="text" autoComplete="family-name" value={surname} onChange={(e) => setSurname(e.target.value)} className={errors.surname ? 'has-error' : ''} />
                {errors.surname && <small className="legacy-error">{errors.surname}</small>}
              </label>
            </div>
          )}
          
          <label className="legacy-auth-field">Email
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={errors.email ? 'has-error' : ''} />
            {errors.email && <small className="legacy-error">{errors.email}</small>}
          </label>

          <label className="legacy-auth-field">Password
            <div className="legacy-password-wrap">
              <input type={showPassword ? "text" : "password"} autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} className={errors.password ? 'has-error' : ''} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <small className="legacy-error">{errors.password}</small>}
            {isRegistering && (
              <small className="legacy-password-hint">
                Use 8–12 characters with uppercase and lowercase letters, a number, and a symbol.
              </small>
            )}
          </label>

          {isRegistering && (
            <label className="legacy-auth-field">Confirm password
              <div className="legacy-password-wrap">
                <input type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={errors.confirmPassword ? 'has-error' : ''} />
                <button type="button" aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <small className="legacy-error">{errors.confirmPassword}</small>}
            </label>
          )}
          
          {!isRegistering && (
            <div className="flex justify-end pt-1">
              <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-gold transition-colors">Forgot Password?</Link>
            </div>
          )}

          {isRegistering && (
            <div className="legacy-terms">
              <label>
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                <span>
                  I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline font-semibold">Terms of Service</Link>, <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline font-semibold">Privacy Policy</Link>, Fair House Rules, and authorize automatic rent disclosures as required by POPIA.
                </span>
              </label>
              {errors.agreeTerms && <small className="legacy-error">{errors.agreeTerms}</small>}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-gold text-black font-bold py-3 rounded-lg mt-6 hover:opacity-90 disabled:opacity-50 transition-opacity flex justify-center items-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
                Processing...
              </span>
            ) : (
              isRegistering ? 'Create account' : 'Sign In'
            )}
          </button>
        </form>

        {!isRegistering && <div className="legacy-social"><span>Or continue with</span><div><button type="button" disabled>Google</button><button type="button" disabled>Apple</button></div><small>Social sign-in is not configured yet.</small></div>}

        {!isRegistering && (
          <div className="legacy-create-prompt">
            Welcome, new client?{' '}
            <button type="button" onClick={() => { setIsRegistering(true); setErrors({}); setGlobalError(''); }} className="text-gold font-semibold hover:underline">
              Create an account
            </button>
          </div>
        )}
      </section>
    </div>
  );
}