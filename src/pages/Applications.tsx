import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, FileText, RefreshCw, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/roles';
import Modal from '../components/Modal';
import PremiumButton from '../components/PremiumButton';
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
  submitted: 'bg-warning/10 text-warning',
  reviewing: 'bg-blue-50 text-blue-700',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
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

  return (
    <div className="animate-fade-in">
      {successMessage && <PageBanner message={successMessage} onDismiss={() => setSuccessMessage('')} />}
      {loadError && (
        <div role="alert" className="mb-6 rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {loadError}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Applications</h2>
          <p className="text-sm text-gray-500">QR onboarding applications awaiting management review.</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchApplications()}
          className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            aria-pressed={filter === option}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === option ? 'bg-black text-gold' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading applications...</p>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No applications in this view.
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold">{application.full_name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[application.status]}`}>
                      {application.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {application.property_name}
                    {application.building_name ? ` · ${application.building_name}` : ''} · Unit {application.unit_number}
                  </p>
                </div>
                <p className="text-xs text-gray-400">APP-{String(application.id).padStart(6, '0')}</p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                <p><span className="font-semibold text-black">Email:</span> {application.email}</p>
                <p><span className="font-semibold text-black">Phone:</span> {application.phone}</p>
                <p><span className="font-semibold text-black">Occupants:</span> {application.occupants}</p>
                <p><span className="font-semibold text-black">ID number:</span> {application.id_number || 'Not provided'}</p>
                {application.emergency_contact_name && (
                  <p>
                    <span className="font-semibold text-black">Emergency contact:</span>{' '}
                    {application.emergency_contact_name}
                    {application.emergency_contact_phone ? ` (${application.emergency_contact_phone})` : ''}
                  </p>
                )}
              </div>

              {application.notes && (
                <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{application.notes}</p>
              )}

              {application.rejection_reason && (
                <p className="mt-3 rounded-lg bg-danger/5 p-3 text-sm text-danger">
                  Rejected: {application.rejection_reason}
                </p>
              )}

              {application.documents.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {application.documents.map((document) => (
                    <a
                      key={document.url}
                      href={document.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <FileText size={14} /> {document.type.replace(/_/g, ' ')}
                    </a>
                  ))}
                </div>
              )}

              {canReview && (application.status === 'submitted' || application.status === 'reviewing') && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  {application.status === 'submitted' && (
                    <button
                      type="button"
                      onClick={() => void markReviewing(application)}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Eye size={16} /> Start review
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openAction(application, 'approve')}
                    className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-black hover:opacity-90"
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => openAction(application, 'reject')}
                    className="flex items-center gap-2 rounded-lg border border-danger/30 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/5"
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
              <p className="text-sm text-gray-600">
                Approving creates the tenant account, tenancy record and first rent obligation.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold">
                  Lease start
                  <input
                    type="date"
                    required
                    value={leaseStart}
                    onChange={(event) => setLeaseStart(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Lease end
                  <input
                    type="date"
                    required
                    value={leaseEnd}
                    onChange={(event) => setLeaseEnd(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold">
                  Monthly rent (ZAR)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={monthlyRent}
                    onChange={(event) => setMonthlyRent(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
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
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                  />
                </label>
              </div>
            </>
          ) : (
            <label className="block text-sm font-semibold">
              Reason
              <textarea
                required
                minLength={3}
                maxLength={500}
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Tell the applicant why this application was rejected."
                className="mt-2 h-28 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
              />
            </label>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={closeAction}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
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
