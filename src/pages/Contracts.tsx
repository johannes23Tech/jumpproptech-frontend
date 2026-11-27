import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Archive,
  Download,
  Eye,
  FilePlus2,
  FileText,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Upload,
  XCircle,
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/roles';
import Modal from '../components/Modal';
import PremiumButton from '../components/PremiumButton';
import { PageBanner } from '../components/FormFeedback';
import ContractDocument from '../components/contracts/ContractDocument';
import { contractFilename, money, STATUS_LABELS, STATUS_STYLES } from '../utils/contracts';
import { exportContractDocx, exportContractPdf } from '../utils/contractExport';
import { renderSavedContract, type RenderedContract } from '../utils/contractRender';
import type { Contract, ContractStats } from '../types/contracts';

const STAT_CARDS: { key: keyof ContractStats; label: string }[] = [
  { key: 'total', label: 'Total leases' },
  { key: 'active', label: 'Active leases' },
  { key: 'draft', label: 'Draft contracts' },
  { key: 'awaiting_signature', label: 'Awaiting signature' },
  { key: 'expiring_soon', label: 'Expiring in 30 days' },
  { key: 'expired', label: 'Expired' },
  { key: 'terminated', label: 'Terminated' },
];

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All Lease Agreements' },
  { value: 'draft', label: 'Draft Contracts' },
  { value: 'ready_for_review', label: 'Ready for Review' },
  { value: 'issued', label: 'Issued to Tenant' },
  { value: 'awaiting_signature', label: 'Pending Signatures' },
  { value: 'partially_signed', label: 'Partially Signed' },
  { value: 'fully_signed', label: 'Fully Signed' },
  { value: 'active', label: 'Active Leases' },
  { value: 'expiring_soon', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired Leases' },
  { value: 'terminated', label: 'Terminated Leases' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Contracts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManage = hasPermission(user, 'contracts.manage');
  const canManageTemplates = hasPermission(user, 'templates.manage');

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [preview, setPreview] = useState<RenderedContract | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const signedFileRef = useRef<HTMLInputElement>(null);
  const signedTargetRef = useRef<Contract | null>(null);

  const status = searchParams.get('status') || '';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (query.trim()) params.q = query.trim();
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const [list, summary] = await Promise.all([
        api.getContracts(params) as Promise<Contract[]>,
        api.getContractStats() as Promise<ContractStats>,
      ]);
      setContracts(Array.isArray(list) ? list : []);
      setStats(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The contracts could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [status]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contracts;
    return contracts.filter((item) =>
      [item.tenant_name, item.contract_reference, item.unit_number, item.property_name]
        .some((value) => String(value || '').toLowerCase().includes(q)),
    );
  }, [contracts, query]);

  const runAction = async (id: number, payload: Record<string, unknown>, message: string) => {
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await api.contractAction({ id, ...payload });
      setSuccess(message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The action could not be completed.');
    } finally {
      setBusyId(null);
    }
  };

  const showPreview = async (row: Contract) => {
    setError('');
    try {
      setPreview(await renderSavedContract(row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The contract preview could not be loaded.');
    }
  };

  const download = async (row: Contract, format: 'pdf' | 'docx') => {
    setBusyId(row.id);
    setError('');
    try {
      const rendered = await renderSavedContract(row.id);
      const exportMeta = {
        contractReference: rendered.meta.contractReference,
        propertyAddress: rendered.meta.propertyAddress,
        agreementDate: rendered.meta.agreementDate,
      };
      const filename = contractFilename(row, format);
      if (format === 'pdf') {
        exportContractPdf(rendered.title, rendered.blocks, exportMeta, filename);
      } else {
        await exportContractDocx(rendered.title, rendered.blocks, exportMeta, filename);
      }
      setSuccess(`${format.toUpperCase()} downloaded: ${filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The document could not be downloaded.');
    } finally {
      setBusyId(null);
    }
  };

  const terminate = (row: Contract) => {
    const reason = window.prompt('Reason for terminating this lease agreement:');
    if (reason === null) return;
    if (reason.trim().length < 5) {
      setError('A termination reason of at least 5 characters is required.');
      return;
    }
    void runAction(row.id, { action: 'terminate', reason: reason.trim() }, 'Lease agreement terminated.');
  };

  const uploadSigned = async (file: File) => {
    const target = signedTargetRef.current;
    if (!target) return;
    try {
      const url = await api.uploadDocument(file);
      await runAction(target.id, { action: 'upload_signed', signed_document_url: url }, 'Signed contract uploaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The signed contract could not be uploaded.');
    }
    signedTargetRef.current = null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Documents</p>
          <h2 className="mt-1 font-display text-2xl text-charcoal md:text-3xl">Lease Agreements</h2>
          <p className="mt-1 text-sm text-gray-600">
            Generate, issue and manage residential lease agreements from approved templates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageTemplates && (
            <Link to="/contracts/templates">
              <PremiumButton variant="secondary" icon={<Settings2 size={15} />}>Templates</PremiumButton>
            </Link>
          )}
          {canManage && (
            <Link to="/contracts/new">
              <PremiumButton icon={<FilePlus2 size={15} />}>Create New Lease</PremiumButton>
            </Link>
          )}
        </div>
      </div>

      {success && <PageBanner message={success} onDismiss={() => setSuccess('')} />}
      {error && (
        <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {STAT_CARDS.map(({ key, label }) => (
          <div key={key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-charcoal">{stats?.[key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by status">
        {FILTERS.map((item) => {
          const active = status === item.value;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setSearchParams(item.value ? { status: item.value } : {})}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? 'border-gold bg-gold text-black' : 'border-gray-200 bg-white text-gray-600 hover:border-gold/50'}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-premium">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Search contracts</span>
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onBlur={() => { if (query.trim()) void load(); }}
              onKeyDown={(event) => { if (event.key === 'Enter') void load(); }}
              placeholder="Tenant, reference or unit"
              className="w-full rounded-xl border border-gray-200 bg-ivory py-2.5 pl-9 pr-3 text-sm focus:border-gold focus:outline-none"
            />
          </label>
          <input
            type="date"
            aria-label="From date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            onBlur={() => void load()}
            className="rounded-xl border border-gray-200 bg-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
          <input
            type="date"
            aria-label="To date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            onBlur={() => void load()}
            className="rounded-xl border border-gray-200 bg-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
          <PremiumButton variant="secondary" size="sm" onClick={() => void load()}>Apply</PremiumButton>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Loading lease agreements…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <FileText size={28} className="mx-auto text-gray-300" />
          <p className="mt-2 font-semibold text-charcoal">No lease agreements found</p>
          <p className="mt-1 text-sm text-gray-500">Create a new lease or adjust your filters.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-premium md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-ivory text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Monthly Rent</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 hover:bg-ivory/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-charcoal">{row.tenant_name}</p>
                      <p className="text-xs text-gray-500">{row.contract_reference}</p>
                    </td>
                    <td className="px-4 py-3">{row.property_name || '—'}</td>
                    <td className="px-4 py-3">{row.unit_number || '—'}</td>
                    <td className="px-4 py-3">{money(row.monthly_rent)}</td>
                    <td className="px-4 py-3">{row.commencement_date}</td>
                    <td className="px-4 py-3">{row.termination_date}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${STATUS_STYLES[row.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button title="View details" onClick={() => navigate(`/contracts/${row.id}`)} className="rounded-lg border border-gray-200 p-1.5 hover:border-gold"><Eye size={14} /></button>
                        <button title="Preview document" onClick={() => void showPreview(row)} className="rounded-lg border border-gray-200 p-1.5 hover:border-gold"><FileText size={14} /></button>
                        {canManage && row.can_edit && (
                          <button title="Edit draft" onClick={() => navigate(`/contracts/${row.id}/edit`)} className="rounded-lg border border-gray-200 p-1.5 hover:border-gold"><Pencil size={14} /></button>
                        )}
                        <button title="Download PDF" disabled={busyId === row.id} onClick={() => void download(row, 'pdf')} className="rounded-lg border border-gray-200 p-1.5 hover:border-gold disabled:opacity-50"><Download size={14} /></button>
                        <button title="Download DOCX" disabled={busyId === row.id} onClick={() => void download(row, 'docx')} className="rounded-lg border border-gray-200 p-1.5 hover:border-gold disabled:opacity-50"><FileText size={14} /></button>
                        {canManage && (row.status === 'draft' || row.status === 'ready_for_review') && (
                          <button title="Issue to tenant" disabled={busyId === row.id} onClick={() => void runAction(row.id, { action: 'issue' }, 'Contract issued to tenant.')} className="rounded-lg border border-gray-200 p-1.5 hover:border-gold"><Send size={14} /></button>
                        )}
                        {canManage && (
                          <button title="Upload signed contract" onClick={() => { signedTargetRef.current = row; signedFileRef.current?.click(); }} className="rounded-lg border border-gray-200 p-1.5 hover:border-gold"><Upload size={14} /></button>
                        )}
                        {canManage && (
                          <button title="Renew lease" onClick={() => navigate(`/contracts/new?renew=${row.id}`)} className="rounded-lg border border-gray-200 p-1.5 hover:border-gold"><RefreshCw size={14} /></button>
                        )}
                        {canManage && row.status === 'active' && (
                          <button title="Terminate lease" onClick={() => terminate(row)} className="rounded-lg border border-gray-200 p-1.5 hover:border-danger"><XCircle size={14} /></button>
                        )}
                        {canManage && (
                          <button title="Archive" onClick={() => void runAction(row.id, { action: 'archive' }, 'Contract archived.')} className="rounded-lg border border-gray-200 p-1.5 hover:border-gold"><Archive size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <div key={row.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-charcoal">{row.tenant_name}</p>
                    <p className="text-xs text-gray-500">{row.contract_reference}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${STATUS_STYLES[row.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[row.status] || row.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600">{row.property_name} · Unit {row.unit_number || '—'}</p>
                <p className="mt-1 text-sm font-semibold text-charcoal">{money(row.monthly_rent)} / month</p>
                <p className="mt-1 text-xs text-gray-500">{row.commencement_date} → {row.termination_date}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <PremiumButton variant="secondary" size="sm" onClick={() => navigate(`/contracts/${row.id}`)}>View</PremiumButton>
                  <PremiumButton variant="secondary" size="sm" onClick={() => void showPreview(row)}>Preview</PremiumButton>
                  <PremiumButton variant="secondary" size="sm" onClick={() => void download(row, 'pdf')}>PDF</PremiumButton>
                  {canManage && row.can_edit && (
                    <PremiumButton variant="secondary" size="sm" onClick={() => navigate(`/contracts/${row.id}/edit`)}>Edit</PremiumButton>
                  )}
                  {canManage && (row.status === 'draft' || row.status === 'ready_for_review') && (
                    <PremiumButton variant="secondary" size="sm" disabled={busyId === row.id} onClick={() => void runAction(row.id, { action: 'issue' }, 'Contract issued to tenant.')}>Send to Tenant</PremiumButton>
                  )}
                  {canManage && (
                    <PremiumButton variant="secondary" size="sm" onClick={() => { signedTargetRef.current = row; signedFileRef.current?.click(); }}>Upload Signed</PremiumButton>
                  )}
                  {canManage && (
                    <PremiumButton variant="secondary" size="sm" onClick={() => navigate(`/contracts/new?renew=${row.id}`)}>Renew</PremiumButton>
                  )}
                  {canManage && row.status === 'active' && (
                    <PremiumButton variant="danger" size="sm" onClick={() => terminate(row)}>Terminate</PremiumButton>
                  )}
                  {canManage && (
                    <PremiumButton variant="secondary" size="sm" onClick={() => void runAction(row.id, { action: 'archive' }, 'Contract archived.')}>Archive</PremiumButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <input
        ref={signedFileRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadSigned(file);
          event.target.value = '';
        }}
      />

      <Modal
        isOpen={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Contract Preview"
        subtitle={preview?.meta.contractReference || 'Lease agreement'}
      >
        {preview && (
          <div className="no-print space-y-4">
            <p className="text-xs text-gray-500">
              The preview uses the approved template with your lease data. Page breaks are finalised when you download the PDF.
            </p>
            <ContractDocument
              title={preview.title}
              blocks={preview.blocks}
              meta={preview.meta}
              showPendingWarning={preview.pendingApproval}
              compact
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
