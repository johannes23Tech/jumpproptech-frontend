import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Home,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  Wallet,
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/roles';
import Modal from '../components/Modal';
import PremiumButton from '../components/PremiumButton';
import { PageBanner, SubmitButton } from '../components/FormFeedback';

type Tenancy = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'notice' | 'ended';
  unit_id: number | null;
  lease_start: string | null;
  lease_end: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  termination_reason: string | null;
  monthly_rent: string | number | null;
  unit_number: string | null;
  unit_status: string | null;
  property_name: string | null;
  building_name: string | null;
  current_lease: {
    id: number;
    version: number;
    status: string;
    start_date: string;
    end_date: string;
    document_url: string | null;
    signature_count: number;
  } | null;
  deposit_summary: DepositSummary;
};

type DepositSummary = {
  required: number;
  received: number;
  deductions: number;
  refunds: number;
  adjustments: number;
  balance: number;
  status: string;
};

type DepositTransaction = {
  id: number;
  type: 'received' | 'deduction' | 'refund' | 'adjustment';
  amount: string | number;
  method: string | null;
  reference: string | null;
  notes: string | null;
  recorded_at: string;
};

type DepositRow = {
  id: number;
  name: string;
  email: string;
  status: string;
  unit_number: string | null;
  property_name: string | null;
  summary: DepositSummary;
  transactions?: DepositTransaction[];
};

type Lease = {
  id: number;
  tenant_id: number;
  tenant_name: string;
  unit_number: string;
  property_name: string;
  building_name: string | null;
  version: number;
  status: string;
  title: string | null;
  template_reference: string | null;
  document_url: string | null;
  start_date: string;
  end_date: string;
  monthly_rent: string | number;
  deposit_required: string | number;
  notes: string | null;
  activated_at: string | null;
  signatures: { party: string; signer_name: string; method: string; signed_at: string }[];
};

type Inspection = {
  id: number;
  tenant_id: number;
  tenant_name: string;
  unit_number: string;
  property_name: string;
  type: 'move_in' | 'move_out' | 'routine';
  status: 'draft' | 'completed';
  inspected_at: string | null;
  notes: string | null;
  completed_at: string | null;
  photos: { id: number; url: string; caption: string | null }[];
};

type Tab = 'tenancies' | 'leases' | 'deposits' | 'inspections';

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'tenancies', label: 'Tenancies', icon: Home },
  { id: 'leases', label: 'Leases', icon: FileText },
  { id: 'deposits', label: 'Deposits', icon: Wallet },
  { id: 'inspections', label: 'Inspections', icon: ShieldCheck },
];

const money = (value: string | number | null | undefined): string =>
  `R ${Number(value ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const localDate = (offsetMonths = 0): string => {
  const date = new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  return date.toISOString().slice(0, 10);
};

const TENANCY_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  active: 'bg-success/10 text-success',
  notice: 'bg-blue-50 text-blue-700',
  ended: 'bg-gray-100 text-gray-500',
};

const LEASE_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_signature: 'bg-warning/10 text-warning',
  active: 'bg-success/10 text-success',
  superseded: 'bg-blue-50 text-blue-700',
  expired: 'bg-gray-100 text-gray-500',
  terminated: 'bg-danger/10 text-danger',
};

const label = (value: string): string => value.replace(/_/g, ' ');

export default function Tenancy() {
  const { user } = useAuth();
  const canManageLeases = hasPermission(user, 'leases.manage');
  const canManageDeposits = hasPermission(user, 'deposits.manage');
  const canManageTenancies = hasPermission(user, 'tenants.manage');
  const canViewLeases = hasPermission(user, 'leases.view');
  const canViewDeposits = hasPermission(user, 'deposits.view');

  const [tab, setTab] = useState<Tab>(canViewLeases ? 'tenancies' : 'deposits');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);

  const activeTenancies = useMemo(
    () => tenancies.filter((item) => item.unit_id !== null && item.status !== 'ended'),
    [tenancies],
  );

  const loadAll = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const jobs: Promise<void>[] = [];
      if (canViewLeases) {
        jobs.push(api.getTenancies().then((data) => setTenancies(Array.isArray(data) ? data : [])));
        jobs.push(api.getLeases().then((data) => setLeases(Array.isArray(data) ? data : [])));
        jobs.push(api.getInspections().then((data) => setInspections(Array.isArray(data) ? data : [])));
      }
      if (canViewDeposits) {
        jobs.push(api.getDeposits().then((data) => setDeposits(Array.isArray(data) ? data : [])));
      }
      await Promise.all(jobs);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'The tenancy workspace could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Tenancy lifecycle modal
  // -------------------------------------------------------------------------
  const [tenancyAction, setTenancyAction] = useState<'move_in' | 'notice' | 'end' | 'renew' | null>(null);
  const [actionTenant, setActionTenant] = useState<Tenancy | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState(localDate(1));
  const [actionReason, setActionReason] = useState('');
  const [renewStart, setRenewStart] = useState(localDate(12));
  const [renewEnd, setRenewEnd] = useState(localDate(24));
  const [renewRent, setRenewRent] = useState('');
  const [renewDeposit, setRenewDeposit] = useState('');

  const openTenancyAction = (
    tenant: Tenancy,
    action: 'move_in' | 'notice' | 'end' | 'renew',
  ) => {
    setActionTenant(tenant);
    setTenancyAction(action);
    setActionError('');
    setActionReason('');
    setMoveOutDate(localDate(1));
    setRenewStart(localDate(12));
    setRenewEnd(localDate(24));
    setRenewRent(String(Number(tenant.monthly_rent ?? 0)));
    setRenewDeposit(String(Number(tenant.deposit_summary.required ?? 0)));
  };

  const closeTenancyAction = () => {
    setTenancyAction(null);
    setActionTenant(null);
    setActionError('');
  };

  const quickTenancyAction = async (tenant: Tenancy, action: 'move_in' | 'cancel_notice') => {
    setLoadError('');
    try {
      await api.tenancyAction({ id: tenant.id, action });
      setSuccessMessage(
        action === 'move_in' ? 'Move-in recorded.' : 'Notice cancelled; the tenancy is active again.',
      );
      await loadAll();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'The tenancy could not be updated.');
    }
  };

  const submitTenancyAction = async () => {
    if (!actionTenant || !tenancyAction) return;
    setActionBusy(true);
    setActionError('');
    try {
      if (tenancyAction === 'renew') {
        await api.tenancyAction({
          id: actionTenant.id,
          action: 'renew',
          start_date: renewStart,
          end_date: renewEnd,
          monthly_rent: Number(renewRent),
          deposit_required: Number(renewDeposit),
        });
        setSuccessMessage('Renewal lease version created as a draft.');
      } else if (tenancyAction === 'notice') {
        await api.tenancyAction({
          id: actionTenant.id,
          action: 'notice',
          move_out_date: moveOutDate,
          reason: actionReason,
        });
        setSuccessMessage('Notice to vacate recorded.');
      } else if (tenancyAction === 'end') {
        await api.tenancyAction({
          id: actionTenant.id,
          action: 'end',
          move_out_date: moveOutDate,
          reason: actionReason,
        });
        setSuccessMessage('Tenancy ended and the unit is now vacant.');
      }
      closeTenancyAction();
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'The tenancy could not be updated.');
    } finally {
      setActionBusy(false);
    }
  };

  // -------------------------------------------------------------------------
  // Lease modals
  // -------------------------------------------------------------------------
  const [leaseModal, setLeaseModal] = useState<'create' | 'sign' | null>(null);
  const [signLeaseTarget, setSignLeaseTarget] = useState<Lease | null>(null);
  const [leaseError, setLeaseError] = useState('');
  const [leaseBusy, setLeaseBusy] = useState(false);

  const [leaseTenantId, setLeaseTenantId] = useState('');
  const [leaseStart, setLeaseStart] = useState(localDate(0));
  const [leaseEnd, setLeaseEnd] = useState(localDate(12));
  const [leaseRent, setLeaseRent] = useState('');
  const [leaseDeposit, setLeaseDeposit] = useState('');
  const [leaseTitle, setLeaseTitle] = useState('');
  const [leaseTemplate, setLeaseTemplate] = useState('');
  const [leaseNotes, setLeaseNotes] = useState('');
  const [leaseDocumentUrl, setLeaseDocumentUrl] = useState('');
  const [leaseUploading, setLeaseUploading] = useState(false);

  const [signParty, setSignParty] = useState<'tenant' | 'landlord'>('tenant');
  const [signName, setSignName] = useState('');
  const [signMethod, setSignMethod] = useState<'in_person' | 'electronic' | 'scanned'>('in_person');

  const openLeaseCreate = () => {
    const first = activeTenancies[0];
    setLeaseModal('create');
    setLeaseError('');
    setLeaseTenantId(first ? String(first.id) : '');
    setLeaseStart(localDate(0));
    setLeaseEnd(localDate(12));
    setLeaseRent(first ? String(Number(first.monthly_rent ?? 0)) : '');
    setLeaseDeposit(first ? String(Number(first.deposit_summary.required ?? 0)) : '');
    setLeaseTitle('');
    setLeaseTemplate('');
    setLeaseNotes('');
    setLeaseDocumentUrl('');
  };

  const openLeaseSign = (lease: Lease, party: 'tenant' | 'landlord') => {
    setSignLeaseTarget(lease);
    setLeaseModal('sign');
    setLeaseError('');
    setSignParty(party);
    setSignName(party === 'landlord' ? 'JUMP PROPTECH' : lease.tenant_name);
    setSignMethod('in_person');
  };

  const closeLeaseModal = () => {
    setLeaseModal(null);
    setSignLeaseTarget(null);
    setLeaseError('');
  };

  const handleLeaseDocument = async (file: File | undefined) => {
    if (!file) return;
    setLeaseUploading(true);
    setLeaseError('');
    try {
      const url = await api.uploadDocument(file);
      setLeaseDocumentUrl(url);
    } catch (err) {
      setLeaseError(err instanceof Error ? err.message : 'The document could not be uploaded.');
    } finally {
      setLeaseUploading(false);
    }
  };

  const submitLeaseCreate = async () => {
    if (!leaseTenantId) {
      setLeaseError('Select a tenant.');
      return;
    }
    setLeaseBusy(true);
    setLeaseError('');
    try {
      await api.createLease({
        tenant_id: Number(leaseTenantId),
        start_date: leaseStart,
        end_date: leaseEnd,
        monthly_rent: Number(leaseRent),
        deposit_required: Number(leaseDeposit),
        document_url: leaseDocumentUrl || undefined,
        title: leaseTitle || undefined,
        template_reference: leaseTemplate || undefined,
        notes: leaseNotes || undefined,
      });
      setSuccessMessage('New lease version created as a draft.');
      closeLeaseModal();
      await loadAll();
    } catch (err) {
      setLeaseError(err instanceof Error ? err.message : 'The lease could not be created.');
    } finally {
      setLeaseBusy(false);
    }
  };

  const submitLeaseSign = async () => {
    if (!signLeaseTarget) return;
    setLeaseBusy(true);
    setLeaseError('');
    try {
      await api.signLease({
        id: signLeaseTarget.id,
        party: signParty,
        signer_name: signName,
        method: signMethod,
      });
      setSuccessMessage(`${signParty === 'tenant' ? 'Tenant' : 'Landlord'} signature recorded.`);
      closeLeaseModal();
      await loadAll();
    } catch (err) {
      setLeaseError(err instanceof Error ? err.message : 'The signature could not be recorded.');
    } finally {
      setLeaseBusy(false);
    }
  };

  const activateLease = async (lease: Lease) => {
    if (!window.confirm(
      `Activate lease version ${lease.version}? This supersedes any other active lease and applies the rent and deposit terms.`,
    )) return;
    setLoadError('');
    try {
      await api.activateLease(lease.id);
      setSuccessMessage(`Lease version ${lease.version} activated.`);
      await loadAll();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'The lease could not be activated.');
    }
  };

  const deleteLease = async (lease: Lease) => {
    if (!window.confirm(`Delete draft lease version ${lease.version}?`)) return;
    setLoadError('');
    try {
      await api.deleteLease(lease.id);
      setSuccessMessage('Draft lease deleted.');
      await loadAll();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'The lease could not be deleted.');
    }
  };

  // -------------------------------------------------------------------------
  // Deposit ledger modal
  // -------------------------------------------------------------------------
  const [ledgerTarget, setLedgerTarget] = useState<DepositRow | null>(null);
  const [ledgerError, setLedgerError] = useState('');
  const [ledgerBusy, setLedgerBusy] = useState(false);
  const [depositType, setDepositType] = useState<'received' | 'deduction' | 'refund' | 'adjustment'>('received');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'cash' | 'eft' | 'other'>('eft');
  const [depositReference, setDepositReference] = useState('');
  const [depositNotes, setDepositNotes] = useState('');

  const openLedger = async (row: DepositRow) => {
    setLedgerTarget(row);
    setLedgerError('');
    setDepositType('received');
    setDepositAmount('');
    setDepositMethod('eft');
    setDepositReference('');
    setDepositNotes('');
    try {
      const data = await api.getDeposits(row.id);
      setLedgerTarget(data && typeof data === 'object' ? (data as DepositRow) : row);
    } catch (err) {
      setLedgerError(err instanceof Error ? err.message : 'The deposit ledger could not be loaded.');
    }
  };

  const closeLedger = () => {
    setLedgerTarget(null);
    setLedgerError('');
  };

  const submitDeposit = async () => {
    if (!ledgerTarget) return;
    setLedgerBusy(true);
    setLedgerError('');
    try {
      await api.recordDeposit({
        tenant_id: ledgerTarget.id,
        type: depositType,
        amount: Number(depositAmount),
        method: depositType === 'received' ? depositMethod : undefined,
        reference: depositReference || undefined,
        notes: depositNotes || undefined,
      });
      const data = await api.getDeposits(ledgerTarget.id);
      setLedgerTarget(data && typeof data === 'object' ? (data as DepositRow) : ledgerTarget);
      setSuccessMessage('Deposit movement recorded.');
      setDepositAmount('');
      setDepositReference('');
      setDepositNotes('');
      await loadAll();
    } catch (err) {
      setLedgerError(err instanceof Error ? err.message : 'The deposit movement could not be recorded.');
    } finally {
      setLedgerBusy(false);
    }
  };

  // -------------------------------------------------------------------------
  // Inspection modal
  // -------------------------------------------------------------------------
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectionError, setInspectionError] = useState('');
  const [inspectionBusy, setInspectionBusy] = useState(false);
  const [inspectionTenantId, setInspectionTenantId] = useState('');
  const [inspectionType, setInspectionType] = useState<'move_in' | 'move_out' | 'routine'>('move_in');
  const [inspectionDate, setInspectionDate] = useState(localDate(0));
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [inspectionComplete, setInspectionComplete] = useState(true);
  const [inspectionPhotos, setInspectionPhotos] = useState<{ url: string; caption: string }[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  const openInspection = () => {
    const first = activeTenancies[0];
    setInspectionModalOpen(true);
    setInspectionError('');
    setInspectionTenantId(first ? String(first.id) : '');
    setInspectionType('move_in');
    setInspectionDate(localDate(0));
    setInspectionNotes('');
    setInspectionComplete(true);
    setInspectionPhotos([]);
  };

  const closeInspection = () => {
    setInspectionModalOpen(false);
    setInspectionError('');
  };

  const handleInspectionPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPhotoUploading(true);
    setInspectionError('');
    try {
      const uploaded: { url: string; caption: string }[] = [];
      for (const file of Array.from(files).slice(0, 12)) {
        const url = await api.uploadImage(file);
        uploaded.push({ url, caption: '' });
      }
      setInspectionPhotos((prev) => [...prev, ...uploaded].slice(0, 12));
    } catch (err) {
      setInspectionError(err instanceof Error ? err.message : 'A photo could not be uploaded.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const submitInspection = async () => {
    if (!inspectionTenantId) {
      setInspectionError('Select a tenant.');
      return;
    }
    setInspectionBusy(true);
    setInspectionError('');
    try {
      await api.createInspection({
        tenant_id: Number(inspectionTenantId),
        type: inspectionType,
        inspected_at: inspectionDate,
        notes: inspectionNotes || undefined,
        status: inspectionComplete ? 'completed' : 'draft',
        photos: inspectionPhotos.length ? inspectionPhotos : undefined,
      });
      setSuccessMessage('Inspection saved.');
      closeInspection();
      await loadAll();
    } catch (err) {
      setInspectionError(err instanceof Error ? err.message : 'The inspection could not be saved.');
    } finally {
      setInspectionBusy(false);
    }
  };

  const completeInspection = async (inspection: Inspection) => {
    setLoadError('');
    try {
      await api.updateInspection({ id: inspection.id, status: 'completed' });
      setSuccessMessage('Inspection marked complete.');
      await loadAll();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'The inspection could not be updated.');
    }
  };

  const visibleTabs = TABS.filter((entry) => {
    if (entry.id === 'deposits') return canViewDeposits;
    return canViewLeases;
  });

  return (
    <div className="animate-fade-in">
      {successMessage && <PageBanner message={successMessage} onDismiss={() => setSuccessMessage('')} />}
      {loadError && (
        <div role="alert" className="mb-6 rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {loadError}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Tenancy</h2>
          <p className="text-sm text-gray-500">
            Tenancy lifecycle, versioned leases, deposit ledgers and inspections.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAll()}
          className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {visibleTabs.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              aria-pressed={tab === entry.id}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                tab === entry.id
                  ? 'bg-black text-gold'
                  : 'border border-gray-200 bg-white text-gray-500 hover:border-gray-400'
              }`}
            >
              <Icon size={14} /> {entry.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading tenancy records...</p>
      ) : (
        <>
          {tab === 'tenancies' && (
            <TenanciesTab
              tenancies={tenancies}
              canManage={canManageTenancies}
              onMoveIn={(tenant) => void quickTenancyAction(tenant, 'move_in')}
              onCancelNotice={(tenant) => void quickTenancyAction(tenant, 'cancel_notice')}
              onAction={openTenancyAction}
            />
          )}

          {tab === 'leases' && (
            <LeasesTab
              leases={leases}
              canManage={canManageLeases}
              onCreate={openLeaseCreate}
              onSign={openLeaseSign}
              onActivate={(lease) => void activateLease(lease)}
              onDelete={(lease) => void deleteLease(lease)}
            />
          )}

          {tab === 'deposits' && (
            <DepositsTab deposits={deposits} onOpenLedger={(row) => void openLedger(row)} />
          )}

          {tab === 'inspections' && (
            <InspectionsTab
              inspections={inspections}
              canManage={canManageLeases}
              onCreate={openInspection}
              onComplete={(inspection) => void completeInspection(inspection)}
            />
          )}
        </>
      )}

      {/* Tenancy action modal */}
      <Modal
        isOpen={tenancyAction !== null}
        onClose={closeTenancyAction}
        title={
          tenancyAction === 'renew'
            ? 'Create renewal lease'
            : tenancyAction === 'notice'
              ? 'Record notice to vacate'
              : tenancyAction === 'end'
                ? 'End tenancy'
                : 'Record move-in'
        }
        subtitle={actionTenant ? `${actionTenant.name}${actionTenant.unit_number ? ` · Unit ${actionTenant.unit_number}` : ''}` : undefined}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitTenancyAction();
          }}
          className="space-y-5"
        >
          {tenancyAction === 'renew' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold">
                  Start date
                  <input
                    type="date"
                    required
                    value={renewStart}
                    onChange={(event) => setRenewStart(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  End date
                  <input
                    type="date"
                    required
                    value={renewEnd}
                    onChange={(event) => setRenewEnd(event.target.value)}
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
                    value={renewRent}
                    onChange={(event) => setRenewRent(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Deposit required (ZAR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={renewDeposit}
                    onChange={(event) => setRenewDeposit(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                This creates the next draft lease version. The current lease stays active until the new version is
                signed and activated.
              </p>
            </>
          ) : (
            <>
              <label className="block text-sm font-semibold">
                Move-out date
                <input
                  type="date"
                  required
                  value={moveOutDate}
                  onChange={(event) => setMoveOutDate(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                />
              </label>
              <label className="block text-sm font-semibold">
                Reason {tenancyAction === 'end' ? '' : '(optional)'}
                <textarea
                  required={tenancyAction === 'end'}
                  minLength={tenancyAction === 'end' ? 3 : undefined}
                  maxLength={500}
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  className="mt-2 h-24 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                />
              </label>
              {tenancyAction === 'end' && (
                <p className="rounded-lg bg-danger/5 p-3 text-xs text-danger">
                  Ending the tenancy terminates the active lease, marks the tenant ended and releases the unit as vacant.
                </p>
              )}
            </>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={closeTenancyAction}
              disabled={actionBusy}
              className="flex-1 rounded-xl border border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <SubmitButton loading={actionBusy} loadingText="Saving..." error={actionError}>
              {tenancyAction === 'renew' ? 'Create renewal' : tenancyAction === 'end' ? 'End tenancy' : 'Save'}
            </SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Lease create / sign modal */}
      <Modal
        isOpen={leaseModal !== null}
        onClose={closeLeaseModal}
        title={leaseModal === 'sign' ? 'Record signature' : 'New lease version'}
        subtitle={leaseModal === 'sign' && signLeaseTarget ? `${signLeaseTarget.tenant_name} · v${signLeaseTarget.version}` : undefined}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void (leaseModal === 'sign' ? submitLeaseSign() : submitLeaseCreate());
          }}
          className="space-y-5"
        >
          {leaseModal === 'sign' ? (
            <>
              <label className="block text-sm font-semibold">
                Signing party
                <select
                  value={signParty}
                  onChange={(event) => setSignParty(event.target.value as 'tenant' | 'landlord')}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                >
                  <option value="tenant">Tenant</option>
                  <option value="landlord">Landlord (company)</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Signer name
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={signName}
                  onChange={(event) => setSignName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                />
              </label>
              <label className="block text-sm font-semibold">
                Method
                <select
                  value={signMethod}
                  onChange={(event) => setSignMethod(event.target.value as 'in_person' | 'electronic' | 'scanned')}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                >
                  <option value="in_person">In person</option>
                  <option value="scanned">Scanned copy on file</option>
                  <option value="electronic">Electronic</option>
                </select>
              </label>
              <p className="text-xs text-gray-500">
                No external e-signature provider is integrated. Record signatures captured on the management-approved
                lease document.
              </p>
            </>
          ) : (
            <>
              <label className="block text-sm font-semibold">
                Tenant
                <select
                  required
                  value={leaseTenantId}
                  onChange={(event) => {
                    setLeaseTenantId(event.target.value);
                    const match = activeTenancies.find((item) => String(item.id) === event.target.value);
                    if (match) {
                      setLeaseRent(String(Number(match.monthly_rent ?? 0)));
                      setLeaseDeposit(String(Number(match.deposit_summary.required ?? 0)));
                    }
                  }}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                >
                  <option value="">Select a tenant</option>
                  {activeTenancies.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} — Unit {tenant.unit_number}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold">
                  Start date
                  <input
                    type="date"
                    required
                    value={leaseStart}
                    onChange={(event) => setLeaseStart(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  End date
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
                    value={leaseRent}
                    onChange={(event) => setLeaseRent(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Deposit required (ZAR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={leaseDeposit}
                    onChange={(event) => setLeaseDeposit(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                Document title
                <input
                  type="text"
                  maxLength={150}
                  value={leaseTitle}
                  onChange={(event) => setLeaseTitle(event.target.value)}
                  placeholder="Residential lease agreement"
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                />
              </label>
              <label className="block text-sm font-semibold">
                Template reference
                <input
                  type="text"
                  maxLength={150}
                  value={leaseTemplate}
                  onChange={(event) => setLeaseTemplate(event.target.value)}
                  placeholder="Management-approved template version / date"
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                />
              </label>
              <label className="block text-sm font-semibold">
                Approved lease document (PDF or image)
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <Upload size={16} /> {leaseUploading ? 'Uploading...' : 'Choose file'}
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      disabled={leaseUploading}
                      onChange={(event) => void handleLeaseDocument(event.target.files?.[0])}
                    />
                  </label>
                  {leaseDocumentUrl && (
                    <a
                      href={leaseDocumentUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-xs font-semibold text-gold hover:underline"
                    >
                      Document attached
                    </a>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Upload the management-approved lease. The platform stores and versions it; it does not generate legal
                  clauses.
                </p>
              </label>
              <label className="block text-sm font-semibold">
                Notes (optional)
                <textarea
                  maxLength={2000}
                  value={leaseNotes}
                  onChange={(event) => setLeaseNotes(event.target.value)}
                  className="mt-2 h-20 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                />
              </label>
            </>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={closeLeaseModal}
              disabled={leaseBusy}
              className="flex-1 rounded-xl border border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <SubmitButton
              loading={leaseBusy}
              loadingText="Saving..."
              error={leaseError}
              disabled={leaseUploading}
            >
              {leaseModal === 'sign' ? 'Record signature' : 'Create draft version'}
            </SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Deposit ledger modal */}
      <Modal
        isOpen={ledgerTarget !== null}
        onClose={closeLedger}
        title="Deposit ledger"
        subtitle={ledgerTarget ? `${ledgerTarget.name}${ledgerTarget.unit_number ? ` · Unit ${ledgerTarget.unit_number}` : ''}` : undefined}
      >
        {ledgerTarget && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-4 text-sm sm:grid-cols-4">
              <Metric label="Required" value={money(ledgerTarget.summary.required)} />
              <Metric label="Received" value={money(ledgerTarget.summary.received)} />
              <Metric label="Deductions" value={money(ledgerTarget.summary.deductions)} />
              <Metric label="Held balance" value={money(ledgerTarget.summary.balance)} emphasise />
            </div>

            <div>
              <h4 className="mb-2 text-sm font-bold">Movements</h4>
              {(ledgerTarget.transactions ?? []).length === 0 ? (
                <p className="rounded-lg bg-white p-3 text-sm text-gray-500">No deposit movements recorded yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg bg-white">
                  {(ledgerTarget.transactions ?? []).map((transaction) => (
                    <li key={transaction.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <div>
                        <p className="font-semibold capitalize">
                          {label(transaction.type)}
                          {transaction.method ? ` · ${transaction.method.toUpperCase()}` : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.recorded_at).toLocaleString('en-ZA')}
                          {transaction.reference ? ` · ${transaction.reference}` : ''}
                          {transaction.notes ? ` · ${transaction.notes}` : ''}
                        </p>
                      </div>
                      <span className="font-bold">{money(transaction.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canManageDeposits && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitDeposit();
                }}
                className="space-y-3 rounded-xl bg-white p-4"
              >
                <h4 className="text-sm font-bold">Record a movement</h4>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Type
                    <select
                      value={depositType}
                      onChange={(event) => setDepositType(event.target.value as typeof depositType)}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm font-normal text-black outline-none focus:border-gold"
                    >
                      <option value="received">Received</option>
                      <option value="deduction">Deduction</option>
                      <option value="refund">Refund</option>
                      <option value="adjustment">Adjustment</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Amount (ZAR)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={depositAmount}
                      onChange={(event) => setDepositAmount(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm font-normal text-black outline-none focus:border-gold"
                    />
                  </label>
                </div>
                {depositType === 'received' && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Method
                      <select
                        value={depositMethod}
                        onChange={(event) => setDepositMethod(event.target.value as typeof depositMethod)}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm font-normal text-black outline-none focus:border-gold"
                      >
                        <option value="eft">EFT</option>
                        <option value="cash">Cash</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Reference
                      <input
                        type="text"
                        maxLength={100}
                        value={depositReference}
                        onChange={(event) => setDepositReference(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm font-normal text-black outline-none focus:border-gold"
                      />
                    </label>
                  </div>
                )}
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Notes
                  <input
                    type="text"
                    maxLength={2000}
                    value={depositNotes}
                    onChange={(event) => setDepositNotes(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm font-normal text-black outline-none focus:border-gold"
                  />
                </label>
                {ledgerError && <p className="text-sm text-danger">{ledgerError}</p>}
                <PremiumButton type="submit" disabled={ledgerBusy} fullWidth>
                  {ledgerBusy ? 'Recording...' : 'Record movement'}
                </PremiumButton>
              </form>
            )}
          </div>
        )}
      </Modal>

      {/* Inspection modal */}
      <Modal
        isOpen={inspectionModalOpen}
        onClose={closeInspection}
        title="New inspection"
        subtitle="Move-in, move-out or routine"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitInspection();
          }}
          className="space-y-5"
        >
          <label className="block text-sm font-semibold">
            Tenant
            <select
              required
              value={inspectionTenantId}
              onChange={(event) => setInspectionTenantId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
            >
              <option value="">Select a tenant</option>
              {activeTenancies.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} — Unit {tenant.unit_number}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              Type
              <select
                value={inspectionType}
                onChange={(event) => setInspectionType(event.target.value as typeof inspectionType)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
              >
                <option value="move_in">Move-in</option>
                <option value="move_out">Move-out</option>
                <option value="routine">Routine</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Inspection date
              <input
                type="date"
                required
                value={inspectionDate}
                onChange={(event) => setInspectionDate(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Notes
            <textarea
              maxLength={4000}
              value={inspectionNotes}
              onChange={(event) => setInspectionNotes(event.target.value)}
              placeholder="Condition of walls, floors, fixtures and meter readings."
              className="mt-2 h-28 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
            />
          </label>
          <label className="block text-sm font-semibold">
            Photos
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Upload size={16} /> {photoUploading ? 'Uploading...' : 'Add photos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={photoUploading}
                  onChange={(event) => void handleInspectionPhotos(event.target.files)}
                />
              </label>
              <span className="text-xs text-gray-500">{inspectionPhotos.length}/12 photos</span>
            </div>
          </label>
          {inspectionPhotos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {inspectionPhotos.map((photo, index) => (
                <div key={photo.url + index} className="relative">
                  <img src={photo.url} alt={`Inspection ${index + 1}`} className="h-16 w-16 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setInspectionPhotos((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute -right-1 -top-1 rounded-full bg-black/70 p-0.5 text-white"
                    aria-label="Remove photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={inspectionComplete}
              onChange={(event) => setInspectionComplete(event.target.checked)}
            />
            Mark inspection as completed
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={closeInspection}
              disabled={inspectionBusy}
              className="flex-1 rounded-xl border border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <SubmitButton
              loading={inspectionBusy}
              loadingText="Saving..."
              error={inspectionError}
              disabled={photoUploading}
            >
              Save inspection
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Metric({ label: metricLabel, value, emphasise }: { label: string; value: string; emphasise?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{metricLabel}</p>
      <p className={`font-bold ${emphasise ? 'text-gold' : 'text-black'}`}>{value}</p>
    </div>
  );
}

function TenanciesTab({
  tenancies,
  canManage,
  onMoveIn,
  onCancelNotice,
  onAction,
}: {
  tenancies: Tenancy[];
  canManage: boolean;
  onMoveIn: (tenant: Tenancy) => void;
  onCancelNotice: (tenant: Tenancy) => void;
  onAction: (tenant: Tenancy, action: 'move_in' | 'notice' | 'end' | 'renew') => void;
}) {
  if (tenancies.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No tenancies yet. Approved applications appear here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tenancies.map((tenant) => (
        <article key={tenant.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold">{tenant.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TENANCY_STATUS_STYLES[tenant.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {tenant.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {tenant.property_name ?? 'No property'}
                {tenant.building_name ? ` · ${tenant.building_name}` : ''}
                {tenant.unit_number ? ` · Unit ${tenant.unit_number}` : ' · No unit'}
              </p>
            </div>
            <p className="text-sm font-bold">{money(tenant.monthly_rent)}<span className="text-xs font-normal text-gray-400"> / month</span></p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-600 sm:grid-cols-4">
            <Info label="Lease start" value={tenant.lease_start ?? '—'} />
            <Info label="Lease end" value={tenant.lease_end ?? '—'} />
            <Info label="Move-in" value={tenant.move_in_date ?? '—'} />
            <Info label="Deposit held" value={money(tenant.deposit_summary.balance)} />
          </div>

          {tenant.current_lease && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              <FileText size={14} className="text-gold" />
              <span className="font-semibold">Lease v{tenant.current_lease.version}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${LEASE_STATUS_STYLES[tenant.current_lease.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {label(tenant.current_lease.status)}
              </span>
              <span>{tenant.current_lease.signature_count} signature(s)</span>
              {tenant.current_lease.document_url ? (
                <a href={tenant.current_lease.document_url} target="_blank" rel="noreferrer noopener" className="font-semibold text-gold hover:underline">
                  View document
                </a>
              ) : (
                <span className="text-warning">No document attached</span>
              )}
            </div>
          )}

          {tenant.status === 'notice' && tenant.move_out_date && (
            <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              Notice to vacate on {tenant.move_out_date}
              {tenant.termination_reason ? ` — ${tenant.termination_reason}` : ''}
            </p>
          )}

          {tenant.status === 'ended' && (
            <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              Ended {tenant.move_out_date ?? ''}
              {tenant.termination_reason ? ` — ${tenant.termination_reason}` : ''}
            </p>
          )}

          {canManage && tenant.unit_id !== null && tenant.status !== 'ended' && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              {!tenant.move_in_date && (
                <button
                  type="button"
                  onClick={() => onMoveIn(tenant)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Home size={14} /> Record move-in
                </button>
              )}
              {tenant.status === 'notice' ? (
                <button
                  type="button"
                  onClick={() => onCancelNotice(tenant)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <CheckCircle2 size={14} /> Cancel notice
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onAction(tenant, 'notice')}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <CalendarClock size={14} /> Notice to vacate
                </button>
              )}
              <button
                type="button"
                onClick={() => onAction(tenant, 'renew')}
                className="flex items-center gap-2 rounded-lg bg-gold px-3 py-2 text-xs font-bold text-black hover:opacity-90"
              >
                <Plus size={14} /> Renew
              </button>
              <button
                type="button"
                onClick={() => onAction(tenant, 'end')}
                className="flex items-center gap-2 rounded-lg border border-danger/30 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/5"
              >
                <LogOut size={14} /> End tenancy
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function LeasesTab({
  leases,
  canManage,
  onCreate,
  onSign,
  onActivate,
  onDelete,
}: {
  leases: Lease[];
  canManage: boolean;
  onCreate: () => void;
  onSign: (lease: Lease, party: 'tenant' | 'landlord') => void;
  onActivate: (lease: Lease) => void;
  onDelete: (lease: Lease) => void;
}) {
  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCreate}
            className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:opacity-90"
          >
            <Plus size={16} /> New lease version
          </button>
        </div>
      )}

      {leases.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No lease records yet.
        </div>
      ) : (
        leases.map((lease) => {
          const hasTenantSignature = lease.signatures.some((signature) => signature.party === 'tenant');
          const hasLandlordSignature = lease.signatures.some((signature) => signature.party === 'landlord');
          const editable = lease.status === 'draft' || lease.status === 'pending_signature';
          return (
            <article key={lease.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold">{lease.tenant_name}</h3>
                    <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-gold">v{lease.version}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${LEASE_STATUS_STYLES[lease.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {label(lease.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {lease.property_name}
                    {lease.building_name ? ` · ${lease.building_name}` : ''} · Unit {lease.unit_number}
                  </p>
                  {lease.title && <p className="text-xs text-gray-600">{lease.title}</p>}
                </div>
                <p className="text-sm font-bold">
                  {money(lease.monthly_rent)}
                  <span className="text-xs font-normal text-gray-400"> / month</span>
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-600 sm:grid-cols-4">
                <Info label="Start" value={lease.start_date} />
                <Info label="End" value={lease.end_date} />
                <Info label="Deposit" value={money(lease.deposit_required)} />
                <Info label="Activated" value={lease.activated_at ? new Date(lease.activated_at).toLocaleDateString('en-ZA') : 'Not yet'} />
              </div>

              {lease.template_reference && (
                <p className="mt-2 text-xs text-gray-500">Template: {lease.template_reference}</p>
              )}
              {lease.document_url ? (
                <a
                  href={lease.document_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
                >
                  <FileText size={14} /> View lease document
                </a>
              ) : (
                <p className="mt-3 text-xs text-warning">No approved document attached.</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase">
                <span className={`rounded-full px-2 py-0.5 ${hasTenantSignature ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}`}>
                  Tenant {hasTenantSignature ? 'signed' : 'unsigned'}
                </span>
                <span className={`rounded-full px-2 py-0.5 ${hasLandlordSignature ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}`}>
                  Landlord {hasLandlordSignature ? 'signed' : 'unsigned'}
                </span>
              </div>

              {canManage && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  {editable && (
                    <>
                      <button
                        type="button"
                        onClick={() => onSign(lease, 'tenant')}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Record tenant signature
                      </button>
                      <button
                        type="button"
                        onClick={() => onSign(lease, 'landlord')}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Record landlord signature
                      </button>
                      <button
                        type="button"
                        onClick={() => onActivate(lease)}
                        className="flex items-center gap-1 rounded-lg bg-gold px-3 py-2 text-xs font-bold text-black hover:opacity-90"
                      >
                        <CheckCircle2 size={14} /> Activate
                      </button>
                    </>
                  )}
                  {lease.status === 'draft' && lease.signatures.length === 0 && (
                    <button
                      type="button"
                      onClick={() => onDelete(lease)}
                      className="flex items-center gap-1 rounded-lg border border-danger/30 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/5"
                    >
                      <Trash2 size={14} /> Delete draft
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}

function DepositsTab({
  deposits,
  onOpenLedger,
}: {
  deposits: DepositRow[];
  onOpenLedger: (row: DepositRow) => void;
}) {
  if (deposits.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No tenants with a deposit position yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-4 py-3">Tenant</th>
            <th className="px-4 py-3">Unit</th>
            <th className="px-4 py-3">Required</th>
            <th className="px-4 py-3">Received</th>
            <th className="px-4 py-3">Held</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {deposits.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">
                <p className="font-semibold">{row.name}</p>
                <p className="text-xs text-gray-500">{row.email}</p>
              </td>
              <td className="px-4 py-3 text-xs text-gray-600">{row.unit_number ?? '—'}</td>
              <td className="px-4 py-3">{money(row.summary.required)}</td>
              <td className="px-4 py-3">{money(row.summary.received)}</td>
              <td className="px-4 py-3 font-bold text-gold">{money(row.summary.balance)}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  row.summary.status === 'outstanding'
                    ? 'bg-warning/10 text-warning'
                    : row.summary.status === 'held'
                      ? 'bg-success/10 text-success'
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  {label(row.summary.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onOpenLedger(row)}
                  className="text-xs font-bold text-gold hover:underline"
                >
                  Ledger
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InspectionsTab({
  inspections,
  canManage,
  onCreate,
  onComplete,
}: {
  inspections: Inspection[];
  canManage: boolean;
  onCreate: () => void;
  onComplete: (inspection: Inspection) => void;
}) {
  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCreate}
            className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:opacity-90"
          >
            <Plus size={16} /> New inspection
          </button>
        </div>
      )}

      {inspections.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No inspections recorded yet.
        </div>
      ) : (
        inspections.map((inspection) => (
          <article key={inspection.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold">{inspection.tenant_name}</h3>
                  <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold uppercase text-gold">
                    {label(inspection.type)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    inspection.status === 'completed' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {inspection.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {inspection.property_name} · Unit {inspection.unit_number} · {inspection.inspected_at ?? 'No date'}
                </p>
              </div>
              {canManage && inspection.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => onComplete(inspection)}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <CheckCircle2 size={14} /> Complete
                </button>
              )}
            </div>

            {inspection.notes && <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{inspection.notes}</p>}

            {inspection.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {inspection.photos.map((photo) => (
                  <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer noopener">
                    <img src={photo.url} alt={photo.caption ?? 'Inspection photo'} className="h-20 w-20 rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            )}
          </article>
        ))
      )}
    </div>
  );
}

function Info({ label: infoLabel, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{infoLabel}</p>
      <p className="font-semibold text-gray-700">{value}</p>
    </div>
  );
}
