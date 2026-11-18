import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck, Upload } from 'lucide-react';
import { api } from '../utils/api';
import { validatePassword } from '../utils/security';

type UnitContext = {
  property_name: string;
  building_name?: string | null;
  unit_number: string;
  monthly_rent: number;
  expires_at: string;
};

type Document = { type: string; url: string };

const formatRand = (value: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(value);

export default function Onboarding() {
  const { token = '' } = useParams();

  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<UnitContext | null>(null);
  const [linkError, setLinkError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [occupants, setOccupants] = useState('1');
  const [notes, setNotes] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [agree, setAgree] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await api.lookupOnboardingToken(token);
        if (active) {
          setUnit(data as UnitContext);
        }
      } catch (err) {
        if (active) {
          setLinkError(err instanceof Error ? err.message : 'This onboarding link is not valid.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [token]);

  const handleDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const url = await api.uploadImage(file);
      setDocuments((current) => [...current, { type: 'id_document', url }].slice(0, 5));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'The document could not be uploaded.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setFormError('The passwords do not match.');
      return;
    }
    if (!agree) {
      setFormError('Please confirm that the information you provided is correct.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.submitTenantApplication({
        token,
        full_name: fullName,
        email,
        phone,
        password,
        id_number: idNumber,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        occupants: Number(occupants),
        notes,
        documents,
      });
      setReference(result?.reference || 'Submitted');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Your application could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <img src="/icons/icon-512.png" alt="" className="h-10 w-10 rounded-xl object-contain" />
          <div>
            <p className="font-display text-lg font-bold leading-none">JUMP</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gold">PropTech</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        {loading ? (
          <p className="text-center text-gray-500">Checking your invitation link...</p>
        ) : linkError || !unit ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-4 text-danger" size={40} />
            <h1 className="font-display text-2xl font-bold">This link is not available</h1>
            <p className="mt-3 text-sm text-gray-600">{linkError || 'This onboarding link is invalid or has expired.'}</p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-xl bg-gold px-6 py-3 text-sm font-bold text-black hover:opacity-90"
            >
              Go to sign in
            </Link>
          </div>
        ) : reference ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-4 text-success" size={44} />
            <h1 className="font-display text-2xl font-bold">Application submitted</h1>
            <p className="mt-3 text-sm text-gray-600">
              Your reference is <span className="font-bold text-black">{reference}</span>. Management will review your
              application and contact you. If it is approved, you can sign in with the email and password you chose.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-xl border border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Tenant application</p>
              <h1 className="mt-2 font-display text-3xl font-bold">
                Apply for {unit.property_name}
                {unit.building_name ? ` · ${unit.building_name}` : ''} · Unit {unit.unit_number}
              </h1>
              <p className="mt-3 text-sm text-gray-600">
                Monthly rent <span className="font-bold text-black">{formatRand(unit.monthly_rent)}</span>. Water is
                included. Tenants buy their own prepaid electricity.
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck size={15} /> This link is for a first-time application only. It is not a login password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Your details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    Full name
                    <input
                      required
                      maxLength={100}
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Email
                    <input
                      type="email"
                      required
                      maxLength={150}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Phone
                    <input
                      type="tel"
                      required
                      maxLength={20}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    ID number
                    <input
                      maxLength={50}
                      value={idNumber}
                      onChange={(event) => setIdNumber(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Number of occupants
                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={occupants}
                      onChange={(event) => setOccupants(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Emergency contact</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    Contact name
                    <input
                      maxLength={100}
                      value={emergencyName}
                      onChange={(event) => setEmergencyName(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Contact phone
                    <input
                      type="tel"
                      maxLength={20}
                      value={emergencyPhone}
                      onChange={(event) => setEmergencyPhone(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Account password</h2>
                <p className="text-xs text-gray-500">
                  Use 8–12 characters with uppercase, lowercase, a number and a symbol. You will use this to sign in
                  after approval.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    Password
                    <div className="relative mt-2">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white p-3 pr-12 font-normal outline-none focus:border-gold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-black"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>
                  <label className="block text-sm font-semibold">
                    Confirm password
                    <div className="relative mt-2">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white p-3 pr-12 font-normal outline-none focus:border-gold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-black"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Documents (optional)</h2>
                <p className="text-xs text-gray-500">You can upload a photo of your ID or proof of address.</p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  <Upload size={16} /> {uploading ? 'Uploading...' : 'Add document photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                    className="sr-only"
                    disabled={uploading}
                    onChange={handleDocument}
                  />
                </label>
                {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
                {documents.length > 0 && (
                  <ul className="space-y-1 text-xs text-gray-600">
                    {documents.map((document) => (
                      <li key={document.url} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                        <span className="truncate">Uploaded document</span>
                        <button
                          type="button"
                          onClick={() => setDocuments((current) => current.filter((item) => item.url !== document.url))}
                          className="font-bold text-danger"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <label className="block text-sm font-semibold">
                Anything else we should know? (optional)
                <textarea
                  maxLength={2000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-2 h-24 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                />
              </label>

              <label className="flex items-start gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(event) => setAgree(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                />
                I confirm the information above is correct and understand that management must approve this
                application before a tenancy starts.
              </label>

              {formError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" /> {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full rounded-xl bg-gold py-3.5 font-bold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Submitting application...' : 'Submit application'}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
