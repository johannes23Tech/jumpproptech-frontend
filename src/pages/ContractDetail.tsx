import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Download,
  FileText,
  Pencil,
  RefreshCw,
  Send,
  Upload,
  XCircle,
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/roles';
import PremiumButton from '../components/PremiumButton';
import ContractDocument from '../components/contracts/ContractDocument';
import SignaturePanel from '../components/contracts/SignaturePanel';
import Modal from '../components/Modal';
import { contractFilename, displayDate, money, STATUS_LABELS, STATUS_STYLES } from '../utils/contracts';
import { exportContractDocx, exportContractPdf } from '../utils/contractExport';
import { renderSavedContract, type RenderedContract } from '../utils/contractRender';
import type { Contract, SignerRole } from '../types/contracts';

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = hasPermission(user, 'contracts.manage');
  const [contract, setContract] = useState<Contract | null>(null);
  const [rendered, setRendered] = useState<RenderedContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [signatureRole, setSignatureRole] = useState<SignerRole | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signatureMethod, setSignatureMethod] = useState('in_person');
  const signedFileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [detail, document] = await Promise.all([
        api.getContract(Number(id)) as Promise<Contract>,
        renderSavedContract(Number(id)),
      ]);
      setContract(detail);
      setRendered(document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The contract could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [id]);

  const act = async (payload: Record<string, unknown>, message: string) => {
    if (!contract) return;
    setBusy(true);
    setError('');
    try {
      await api.contractAction({ id: contract.id, ...payload });
      setSuccess(message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The action could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const download = async (format: 'pdf' | 'docx') => {
    if (!contract || !rendered) return;
    try {
      const filename = contractFilename(contract, format);
      const meta = {
        contractReference: rendered.meta.contractReference,
        propertyAddress: rendered.meta.propertyAddress,
        agreementDate: rendered.meta.agreementDate,
      };
      if (format === 'pdf') exportContractPdf(rendered.title, rendered.blocks, meta, filename);
      else await exportContractDocx(rendered.title, rendered.blocks, meta, filename);
      setSuccess(`${format.toUpperCase()} downloaded: ${filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The document could not be downloaded.');
    }
  };

  const recordSignature = async () => {
    if (!signatureRole || !signerName.trim()) {
      setError('Enter the signer name before recording the signature.');
      return;
    }
    await act(
      { action: 'record_signature', signer_role: signatureRole, signer_name: signerName.trim(), signature_method: signatureMethod },
      'Signature recorded as an audit record.',
    );
    setSignatureRole(null);
    setSignerName('');
  };

  const uploadSigned = async (file: File) => {
    try {
      const url = await api.uploadDocument(file);
      await act({ action: 'upload_signed', signed_document_url: url }, 'Signed contract uploaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The signed contract could not be uploaded.');
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500">Loading agreement…</div>;
  if (!contract) return <div role="alert" className="rounded-xl bg-danger/10 p-4 text-danger">{error || 'Agreement not found.'}</div>;

  const details = [
    ['Contract reference', contract.contract_reference],
    ['Tenant', contract.tenant_name],
    ['Property', contract.property?.name || contract.property_name || '—'],
    ['Unit', contract.unit?.unit_number || contract.unit_number || '—'],
    ['Agreement date', displayDate(contract.agreement_date)],
    ['Commencement', displayDate(contract.commencement_date)],
    ['Termination', displayDate(contract.termination_date)],
    ['Monthly rent', money(contract.monthly_rent)],
    ['Deposit', money(contract.deposit_amount)],
    ['Version', String(contract.version)],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Lease Agreement</p>
          <h2 className="mt-1 font-display text-2xl text-charcoal md:text-3xl">{contract.contract_reference}</h2>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[contract.status]}`}>
            {STATUS_LABELS[contract.status]}
          </span>
        </div>
        <PremiumButton variant="secondary" size="sm" onClick={() => navigate('/contracts')}>Back to agreements</PremiumButton>
      </div>

      {success && <div role="status" className="rounded-xl bg-success/10 p-3 text-sm text-success">{success}</div>}
      {error && <div role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-charcoal">Agreement details</h3>
              {canManage && contract.can_edit && (
                <PremiumButton variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={() => navigate(`/contracts/${contract.id}/edit`)}>Edit draft</PremiumButton>
              )}
            </div>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-gray-100 pb-2 text-sm">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-right font-semibold text-charcoal">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-display text-lg text-charcoal">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <PremiumButton variant="secondary" size="sm" icon={<FileText size={14} />} onClick={() => setPreviewOpen(true)}>Preview</PremiumButton>
              <PremiumButton variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => void download('pdf')}>Download PDF</PremiumButton>
              <PremiumButton variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => void download('docx')}>Download DOCX</PremiumButton>
              {canManage && (contract.status === 'draft' || contract.status === 'ready_for_review') && (
                <PremiumButton size="sm" icon={<Send size={14} />} disabled={busy} onClick={() => void act({ action: 'issue' }, 'Contract issued to tenant.')}>Issue to tenant</PremiumButton>
              )}
              {canManage && contract.status === 'fully_signed' && (
                <PremiumButton size="sm" disabled={busy} onClick={() => void act({ action: 'activate' }, 'Lease activated.')}>Activate lease</PremiumButton>
              )}
              {canManage && (
                <PremiumButton variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => navigate(`/contracts/new?renew=${contract.id}`)}>Renew lease</PremiumButton>
              )}
              {canManage && (
                <PremiumButton variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => signedFileRef.current?.click()}>Upload signed copy</PremiumButton>
              )}
              {canManage && contract.status === 'active' && (
                <PremiumButton variant="danger" size="sm" icon={<XCircle size={14} />} disabled={busy} onClick={() => {
                  const reason = window.prompt('Reason for terminating this lease agreement:');
                  if (reason && reason.trim().length >= 5) void act({ action: 'terminate', reason: reason.trim() }, 'Lease terminated.');
                }}>Terminate</PremiumButton>
              )}
            </div>
          </section>

          <SignaturePanel
            signatures={contract.signatures || []}
            canManage={canManage}
            onRecord={(role) => { setSignatureRole(role); setSignerName(''); }}
            onUpload={() => signedFileRef.current?.click()}
          />

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-display text-lg text-charcoal">Version history</h3>
            {(contract.versions || []).length === 0 ? (
              <p className="text-sm text-gray-500">No earlier versions.</p>
            ) : (
              <div className="space-y-2">
                {contract.versions.map((version) => (
                  <div key={version.id} className="flex items-center justify-between rounded-xl bg-ivory p-3 text-sm">
                    <span className="font-semibold">Version {version.version_number}</span>
                    <span className="text-xs text-gray-500">{displayDate(version.created_at.slice(0, 10))}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-display text-lg text-charcoal">Audit trail</h3>
            {(contract.audit || []).length === 0 ? (
              <p className="text-sm text-gray-500">No audit events recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {contract.audit.map((entry) => (
                  <div key={entry.id} className="flex flex-wrap justify-between gap-2 border-b border-gray-100 pb-2 text-xs">
                    <span className="font-semibold text-charcoal">{entry.action}</span>
                    <span className="text-gray-500">{entry.actor_email || 'System'} · {new Date(entry.created_at).toLocaleString('en-ZA')}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside>
          {rendered ? (
            <div className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-gray-200">
              <ContractDocument title={rendered.title} blocks={rendered.blocks} meta={rendered.meta} showPendingWarning={rendered.pendingApproval} compact />
            </div>
          ) : (
            <p className="text-sm text-gray-500">Preview unavailable.</p>
          )}
        </aside>
      </div>

      <input
        ref={signedFileRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadSigned(file); event.target.value = ''; }}
      />

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Full Contract Preview" subtitle={contract.contract_reference}>
        {rendered && <ContractDocument title={rendered.title} blocks={rendered.blocks} meta={rendered.meta} showPendingWarning={rendered.pendingApproval} />}
      </Modal>

      <Modal isOpen={Boolean(signatureRole)} onClose={() => setSignatureRole(null)} title="Record Signature" subtitle="Audit record — not a verified electronic signature">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Recording {signatureRole?.replace('_', ' ')} signature for {contract.contract_reference}.</p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Signer full name</span>
            <input value={signerName} onChange={(event) => setSignerName(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Signature method</span>
            <select value={signatureMethod} onChange={(event) => setSignatureMethod(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
              <option value="in_person">Signed in person</option>
              <option value="scanned">Scanned signature uploaded</option>
            </select>
          </label>
          <PremiumButton disabled={busy} onClick={() => void recordSignature()}>Record signature</PremiumButton>
        </div>
      </Modal>
    </div>
  );
}
