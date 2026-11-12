import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, KeyRound, Copy, Check, AlertTriangle, Download } from 'lucide-react';

export default function Security() {
  const { user, refreshToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const [setup, setSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null);
  const [setupPassword, setSetupPassword] = useState('');
  const [enableCode, setEnableCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const [password, setPassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await api.mfaStatus();
      setEnabled(Boolean(data.enabled));
      setRemaining(Number(data.recovery_codes_remaining) || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your security settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadStatus(); }, []);

  const startSetup = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const data = await api.mfaSetup(setupPassword);
      setSetup({ secret: data.secret, otpauth_uri: data.otpauth_uri });
      setSetupPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start setup.');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api.mfaEnable(enableCode.trim());
      if (data?.token) refreshToken(data.token);
      setEnabled(true);
      setRemaining(Array.isArray(data.recovery_codes) ? data.recovery_codes.length : 0);
      setRecoveryCodes(Array.isArray(data.recovery_codes) ? data.recovery_codes : []);
      setSetup(null);
      setEnableCode('');
      setSuccess('Two-factor authentication is enabled.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code could not be verified.');
    } finally {
      setBusy(false);
    }
  };

  const disableMfa = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const data = await api.mfaDisable(password, disableCode.trim());
      if (data?.token) refreshToken(data.token);
      setEnabled(false);
      setRemaining(0);
      setRecoveryCodes([]);
      setPassword('');
      setDisableCode('');
      setSuccess('Two-factor authentication is disabled. Other sessions were signed out.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Two-factor authentication could not be disabled.');
    } finally {
      setBusy(false);
    }
  };

  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copy failed. Select the codes and save them manually.');
    }
  };

  const downloadRecoveryCodes = () => {
    const blob = new Blob(
      [`Jump PropTech recovery codes\nAccount: ${user?.email ?? ''}\n\n${recoveryCodes.join('\n')}\n`],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jumpproptech-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-gray-500">Loading security settings...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl text-black">Two-factor authentication</h2>
            <p className="text-sm text-gray-500 mt-1">
              Add a second step to sign-in using an authenticator app (Google Authenticator,
              Microsoft Authenticator, 1Password, Authy). Even if your password leaks,
              nobody can sign in without your device.
            </p>

            <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${enabled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {enabled ? <Check size={14} /> : <AlertTriangle size={14} />}
              {enabled ? 'Enabled' : 'Not enabled'}
            </div>

            {enabled && (
              <p className="text-xs text-gray-500 mt-2">
                {remaining} single-use recovery code{remaining === 1 ? '' : 's'} remaining.
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 text-red-700 p-3 rounded text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 bg-green-50 border-l-4 border-green-400 text-green-700 p-3 rounded text-sm">
            {success}
          </div>
        )}

        {!enabled && !setup && (
          <form onSubmit={startSetup} className="mt-5 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Confirm your password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold"
                placeholder="Current password"
              />
            </div>
            <button
              type="submit"
              disabled={busy || setupPassword === ''}
              className="bg-black text-ivory font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Starting...' : 'Set up two-factor authentication'}
            </button>
          </form>
        )}

        {setup && (
          <div className="mt-5 border border-gray-200 rounded-xl p-4 bg-gray-50">
            <h3 className="font-semibold text-black">1. Add this account to your app</h3>
            <p className="text-xs text-gray-500 mt-1">
              In your authenticator app choose “Add account” → “Enter a setup key”, then paste
              this secret. Keep it private.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm tracking-widest break-all">
                {setup.secret}
              </code>
              <a
                href={setup.otpauth_uri}
                className="text-sm font-semibold text-gold hover:underline"
              >
                Open in authenticator app
              </a>
            </div>

            <form onSubmit={confirmEnable} className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  2. Enter the 6-digit code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={enableCode}
                  onChange={(e) => setEnableCode(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 w-40 text-center tracking-[0.3em] focus:outline-none focus:border-gold"
                  placeholder="123456"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="bg-gold text-black font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {busy ? 'Verifying...' : 'Verify and enable'}
              </button>
              <button
                type="button"
                onClick={() => { setSetup(null); setEnableCode(''); }}
                className="text-sm text-gray-500 hover:text-black px-2 py-2.5"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {enabled && (
          <div className="mt-5 border-t border-gray-200 pt-5">
            <h3 className="font-semibold text-black">Disable two-factor authentication</h3>
            <p className="text-xs text-gray-500 mt-1">
              You need your password and a current code (or a recovery code).
            </p>
            <form onSubmit={disableMfa} className="mt-3 grid sm:grid-cols-2 gap-3">
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Current password"
                className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold"
              />
              <input
                type="text"
                autoComplete="one-time-code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="6-digit code or recovery code"
                className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={busy}
                className="sm:col-span-2 justify-self-start bg-danger/10 text-danger font-semibold px-5 py-2.5 rounded-lg hover:bg-danger/20 disabled:opacity-50"
              >
                {busy ? 'Disabling...' : 'Disable two-factor authentication'}
              </button>
            </form>
          </div>
        )}
      </div>

      {recoveryCodes.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-300 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <KeyRound size={20} className="text-amber-600" />
            <h2 className="font-display text-lg text-black">Save your recovery codes</h2>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Each code works once. Store them somewhere safe — this is the only time they are
            shown. Use one if you lose access to your authenticator app.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 bg-gray-50 border border-gray-200 rounded-xl p-4">
            {recoveryCodes.map((code) => (
              <code key={code} className="text-sm tracking-wider text-black">{code}</code>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={copyRecoveryCodes} className="flex items-center gap-2 bg-black text-ivory text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy codes'}
            </button>
            <button onClick={downloadRecoveryCodes} className="flex items-center gap-2 bg-gray-100 text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200">
              <Download size={16} /> Download .txt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
