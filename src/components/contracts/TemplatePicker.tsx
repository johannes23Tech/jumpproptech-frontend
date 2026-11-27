import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import type { ContractTemplate } from '../../types/contracts';

interface TemplatePickerProps {
  templates: ContractTemplate[];
  selectedId: string;
  onSelect: (template: ContractTemplate) => void;
  filter?: 'new_lease' | 'renewal';
}

export default function TemplatePicker({ templates, selectedId, onSelect, filter }: TemplatePickerProps) {
  const visible = templates.filter((template) => !filter || template.template_type === filter);

  if (visible.length === 0) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
        No templates are available yet. Contact your administrator to load an approved lease template.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {visible.map((template) => {
        const selected = String(template.id) === selectedId;
        const pending = template.approval_status !== 'approved';
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`rounded-xl border p-4 text-left transition-colors ${selected ? 'border-gold bg-gold/5' : 'border-gray-200 bg-white hover:border-gold/60'}`}
          >
            <div className="flex items-start gap-3">
              <FileText size={18} className="mt-0.5 shrink-0 text-gold" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-charcoal">{template.name}</p>
                <p className="mt-1 text-xs capitalize text-gray-500">{template.template_type.replace('_', ' ')}</p>
                <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${pending ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                  {pending ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                  {pending ? 'Pending legal approval' : 'Approved for use'}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
