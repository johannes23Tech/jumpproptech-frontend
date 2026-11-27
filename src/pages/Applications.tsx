import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, FileText, RefreshCw, Search, XCircle, ClipboardList, Clock, BadgeCheck, Ban } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/roles';
import Modal from '../components/Modal';
import TiltCard from '../components/TiltCard';
import Skeleton from '../components/Skeleton';
import { PageBanner, SubmitButton } from '../components/FormFeedback';

type ApplicationDocument = {
  type: string;
  url: string;
};

type Application = {
  id: number;
  unit_id: number;
  full_name: string;
  email: string;
  phone: string;
  id_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  occupants: number;
  notes?: string | null;
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  tenant_id?: number | null;
  created_at: string;
  unit_number: string;
  unit_rent: string | number;
  unit_status: string;
  property_name: string;
  building_name?: string | null;
  documents: ApplicationDocument[];
};

const STATUS_STYLES: Record<Application['status'], string> = {
  submitted: 'bg-warning/10 text-warning border-warning/20',
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-danger/10 text-danger border-danger/20',
};

const FILTERS = ['all', 'submitted', 'reviewing', 'approved', 'rejected'] as const;
type Filter = (typeof FILTERS)[number];

const localDate = (offsetMonths = 0): string => {
  const date = new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  return date.toISOString().slice(0, 10);
};

export default function Applications() {
  const { user } = useAuth();
  const canReview = hasPermission(user, 'applications.review');

  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [selected, setSelected] = useState<Application | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [leaseStart, setLeaseStart] = useState(localDate(0));
  const [leaseEnd, setLeaseEnd] = useState(localDate(12));
  const [deposit, setDeposit] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApplications = async (nextFilter: Filter = filter) => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await api.getApplications(nextFilter === 'all' ? undefined : nextFilter);
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Applications could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplications(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const openAction = (application: Application, nextAction: 'approve' | 'reject') => {
    setSelected(application);
    setAction(nextAction);
    setSubmitError('');
    setRejectionReason('');
    const rent = Number(application.unit_rent) || 0;
    setMonthlyRent(String(rent));
    setDeposit(String(rent));
    setLeaseStart(localDate(0));
    setLeaseEnd(localDate(12));
  };

  const closeAction = () => {
    setSelected(null);
    setAction(null);
    setSubmitError('');
  };

  const markReviewing = async (application: Application) => {
    setLoadError('');
    try {
      await api.reviewApplication({ id: application.id, action: 'review' });
      setSuccessMessage(`Application ${application.id} marked as under review.`);
      await fetchApplications();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'The application could not be updated.');
    }
  };

  const submitAction = async () => {
    if (!selected || !action) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      if (action === 'approve') {
        await api.reviewApplication({
          id: selected.id,
          action: 'approve',
          lease_start: leaseStart,
          lease_end: leaseEnd,
          deposit: Number(deposit),
          monthly_rent: Number(monthlyRent),
        });
        setSuccessMessage('Application approved. The tenant account is active.');
      } else {
        await api.reviewApplication({
          id: selected.id,
          action: 'reject',
          rejection_reason: rejectionReason,
        });
        setSuccessMessage('Application rejected.');
      }
      closeAction();
      await fetchApplications();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The application could not be updated.');
    } finally {
      setSubmitting(false);
    }
  };

  const counts = useMemo(() => {
    const base = { all: applications.length, submitted: 0, reviewing: 0, approved: 0, rejected: 0 } as Record<Filter, number>;
    for (const a of applications) base[a.status] = (base[a.status] || 0) + 1;
    return base;
  }, [applications]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((a) => {
      const hay = [a.full_name, a.email, a.phone, a.property_name, a.building_name, a.unit_number, a.status, `APP-${String(a.id).padStart(6, '0')}`]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [applications, search]);

  return (
    <div className="animate-fade-in space-y-6">
      {successMessage && <PageBanner message={successMessage} onDismiss={() => setSuccessMessage('')} />}
      {loadError && (
        <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {loadError}
        </div>
      )}

      <div className="bg-gradient-to-r from-charcoal via-black to-charcoal p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold opacity-10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs text-gold tracking-widest uppercase mb-2 font-semibold"><ClipboardList size={14} /> Onboarding Applications</p>
            <h1 className="font-display text-3xl md:text-4xl text-ivory mb-2">Applications Review</h1>
            <p className="text-gray-400 text-sm max-w-2xl">Track and process QR onboarding applications. Review details, verify documents, and approve or reject with clear reasons.</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchApplications()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 text-ivory px-4 py-2.5 text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TiltCard><div className="flex items-center gap-2 text-warning mb-1"><Clock size={16} /><p className="text-xs font-bold uppercase tracking-wider">Submitted</p></div><p className="font-display text-3xl font-bold text-black">{loading ? '…' : counts.submitted}</p></TiltCard>
        <TiltCard><div className="flex items-center gap-2 text-blue-600 mb-1"><Eye size={16} /><p className="text-xs font-bold uppercase tracking-wider">Reviewing</p></div><p className="font-display text-3xl font-bold text-black">{loading ? '…' : counts.reviewing}</p></TiltCard>
        <TiltCard><div className="flex items-center gap-2 text-success mb-1"><BadgeCheck size={16} /><p className="text-xs font-bold uppercase tracking-wider">Approved</p></div><p className="font-display text-3xl font-bold text-black">{loading ? '…' : counts.approved}</p></TiltCard>
        <TiltCard><div className="flex items-center gap-2 text-danger mb-1"><Ban size={16} /><p className="text-xs font-bold uppercase tracking-wider">Rejected</p></div><p className="font-display text-3xl font-bold text-black">{loading ? '…' : counts.rejected}</p></TiltCard>
      </div>

      <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-premium space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicant, email, property, unit or application ID..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-gold focus:bg-white transition-colors"
              aria-label="Search applications"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                  filter === option ? 'bg-black text-gold border-black shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500">Showing {visible.length} application(s){filter !== 'all' ? ` in "${filter}"` : ''}.</p>
      </div>

      {loading ? (
        <div className="space-y-4"><Skeleton type="row" /><Skeleton type="row" /><Skeleton type="row" /></div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400"><ClipboardList size={24} /></div>
          <h3 className="font-display text-xl font-bold text-black mb-1">No applications found</h3>
          <p className="text-sm text-gray-500">There are no applications matching your current filters or search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((application) => (
            <article
              key={application.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm hover:shadow-premium hover:border-gold/20 transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-display text-xl font-bold text-black">{application.full_name}</h3>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[application.status]}`}>
                      {application.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    {application.property_name}
                    {application.building_name ? ` · ${application.building_name}` : ''} · Unit {application.unit_number}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">APP-{String(application.id).padStart(6, '0')} · Submitted {new Date(application.created_at).toLocaleDateString('en-ZA')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Monthly rent</p>
                  <p className="font-display text-xl font-bold text-black">R {Number(application.unit_rent || 0).toLocaleString('en-ZA')}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Email</p><p className="text-sm text-gray-800 break-all">{application.email}</p></div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Phone</p><p className="text-sm text-gray-800">{application.phone}</p></div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Occupants</p><p className="text-sm text-gray-800 font-semibold">{application.occupants}</p></div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">ID number</p><p className="text-sm text-gray-800">{application.id_number || 'Not provided'}</p></div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 sm:col-span-2 lg:col-span-2"><p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Emergency contact</p><p className="text-sm text-gray-800">{application.emergency_contact_name ? `${application.emergency_contact_name}${application.emergency_contact_phone ? ` (${application.emergency_contact_phone})` : ''}` : 'Not provided'}</p></div>
              </div>

              {application.notes && (
                <div className="mt-3 rounded-xl bg-ivory border border-gray-100 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Applicant notes</p>
                  <p className="text-sm text-gray-700">{application.notes}</p>
                </div>
              )}

              {application.rejection_reason && (
                <div className="mt-3 rounded-xl bg-danger/5 border border-danger/20 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-danger font-bold mb-1">Rejection reason</p>
                  <p className="text-sm text-danger">{application.rejection_reason}</p>
                </div>
              )}

              {application.documents.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {application.documents.map((document) => (
                      <a
                        key={document.url}
                        href={document.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gold/30 transition-colors"
                      >
                        <FileText size={14} className="text-gold" /> {document.type.replace(/_/g, ' ')}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {canReview && (application.status === 'submitted' || application.status === 'reviewing') && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  {application.status === 'submitted' && (
                    <button
                      type="button"
                      onClick={() => void markReviewing(application)}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Eye size={16} /> Start review
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openAction(application, 'approve')}
                    className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => openAction(application, 'reject')}
                    className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 transition-colors"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={action !== null}
        onClose={closeAction}
        title={action === 'approve' ? 'Approve application' : 'Reject application'}
        subtitle={selected ? `${selected.full_name} · Unit ${selected.unit_number}` : undefined}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitAction();
          }}
          className="space-y-5"
        >
          {action === 'approve' ? (
            <>
              <div className="rounded-xl border border-gold/20 bg-gold/10 p-4 text-sm text-gray-700">
                <p className="font-semibold text-black mb-1">What happens on approval</p>
                <p>Approving creates the tenant account, tenancy record and first rent obligation. Please confirm lease and amounts are correct (ZAR).</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-sm font-semibold">
                  Lease start
                  <input
                    type="date"
                    required
                    value={leaseStart}
                    onChange={(event) => setLeaseStart(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Lease end
                  <input
                    type="date"
                    required
                    value={leaseEnd}
                    onChange={(event) => setLeaseEnd(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-sm font-semibold">
                  Monthly rent (ZAR)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={monthlyRent}
                    onChange={(event) => setMonthlyRent(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Deposit (ZAR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={deposit}
                    onChange={(event) => setDeposit(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-gray-700">
                <p className="font-semibold text-danger mb-1">Provide a clear reason</p>
                <p>The applicant should understand why the application was rejected. This may be reviewed later for audit/support purposes.</p>
              </div>
              <label className="block text-sm font-semibold">
                Reason
                <textarea
                  required
                  minLength={3}
                  maxLength={500}
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="e.g. Missing required documents, affordability concerns, or unit no longer available..."
                  className="mt-2 h-32 w-full rounded-xl border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
                <span className="mt-1 block text-xs text-gray-500 font-normal">{rejectionReason.length}/500 characters</span>
              </label>
            </>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={closeAction}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <SubmitButton
              loading={submitting}
              loadingText={action === 'approve' ? 'Approving...' : 'Rejecting...'}
              error={submitError}
            >
              {action === 'approve' ? 'Approve and create tenant' : 'Reject application'}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
