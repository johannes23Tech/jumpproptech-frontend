import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Save } from 'lucide-react';
import { api } from '../utils/api';
import PremiumButton from '../components/PremiumButton';
import type { ContractTemplate } from '../types/contracts';

export default function ContractTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'pending'>('pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.getContractTemplates() as ContractTemplate[];
      setTemplates(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Templates could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const select = (template: ContractTemplate) => {
    setSelectedId(template.id);
    setName(template.name);
    setContent(template.content);
    setApprovalStatus(template.approval_status);
    setError('');
    setSuccess('');
  };

  const save = async () => {
    if (!name.trim() || content.trim().length < 40) {
      setError('A template name and content of at least 40 characters are required.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.saveContractTemplate({
        action: selectedId ? 'update' : 'create',
        id: selectedId || undefined,
        name: name.trim(),
        content,
        approval_status: approvalStatus,
        template_type: templates.find((template) => template.id === selectedId)?.template_type || 'new_lease',
      });
      setSuccess('Template saved.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The template could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Documents / Lease Agreements</p>
          <h2 className="mt-1 font-display text-2xl text-charcoal md:text-3xl">Contract Templates</h2>
          <p className="mt-1 text-sm text-gray-600">Management-approved legal wording only. Templates must be reviewed by a qualified South African legal professional.</p>
        </div>
        <PremiumButton variant="secondary" size="sm" onClick={() => navigate('/contracts')}>Back to agreements</PremiumButton>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
        <AlertTriangle size={17} className="mt-0.5 shrink-0" />
        <span>Do not invent contract clauses. Only management-supplied, legally reviewed wording may be marked as approved. A template can only be issued when its approval status is “Approved”.</span>
      </div>

      {success && <div role="status" className="rounded-xl bg-success/10 p-3 text-sm text-success">{success}</div>}
      {error && <div role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-2">
          {loading && <p className="text-sm text-gray-500">Loading templates…</p>}
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => select(template)}
              className={`w-full rounded-xl border p-4 text-left ${selectedId === template.id ? 'border-gold bg-gold/5' : 'border-gray-200 bg-white hover:border-gold/50'}`}
            >
              <p className="font-semibold text-charcoal">{template.name}</p>
              <p className="mt-1 text-xs capitalize text-gray-500">{template.template_type.replace('_', ' ')}</p>
              <p className={`mt-2 text-[11px] font-semibold ${template.approval_status === 'approved' ? 'text-success' : 'text-warning'}`}>
                {template.approval_status === 'approved' ? 'Approved for use' : 'Pending approval'}
              </p>
            </button>
          ))}
          <PremiumButton
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedId(null);
              setName('');
              setContent('');
              setApprovalStatus('pending');
            }}
          >
            + New template
          </PremiumButton>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-display text-lg text-charcoal">{selectedId ? 'Edit Template' : 'New Template'}</h3>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Template name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Approval status</span>
              <select value={approvalStatus} onChange={(event) => setApprovalStatus(event.target.value as 'approved' | 'pending')} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
                <option value="pending">Pending legal approval</option>
                <option value="approved">Approved for use</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Template content</span>
              <span className="mb-1.5 block text-[11px] text-gray-500">Use line prefixes # / ## / ### for headings and {'{{placeholder}}'} tokens for lease data.</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={22}
                spellCheck
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-xs leading-relaxed"
              />
            </label>
            <PremiumButton disabled={saving} onClick={() => void save()} icon={<Save size={15} />}>
              {saving ? 'Saving…' : 'Save Template'}
            </PremiumButton>
          </div>
        </section>
      </div>
    </div>
  );
}
