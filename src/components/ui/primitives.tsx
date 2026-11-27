import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useMemo,
  useState,
} from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import './ui.css';

/* ---------- Layout ---------- */

export function Card({
  children,
  className = '',
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return <div className={`ui-card ${interactive ? 'ui-card--interactive' : ''} ${className}`}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ivory-dark px-5 py-4">
      <div>
        <h3 className="ui-section-title">{title}</h3>
        {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
        <h2 className="mt-1 font-display text-2xl tracking-tight text-charcoal md:text-3xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-gray-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Toolbar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-center gap-3 ${className}`}>{children}</div>;
}

/* ---------- Display ---------- */

const TONES: Record<string, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  gold: 'bg-gold/10 text-gold',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-blue-50 text-blue-700',
};

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  dot?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONES[tone] || TONES.neutral}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'gold',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}) {
  const accent: Record<string, string> = {
    gold: 'text-gold bg-gold/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
    info: 'text-blue-700 bg-blue-50',
    neutral: 'text-gray-600 bg-gray-100',
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-charcoal">{value}</p>
          {hint && <p className="mt-1 truncate text-[11px] text-gray-400">{hint}</p>}
        </div>
        {icon && <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent[tone]}`}>{icon}</span>}
      </div>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ivory-dark text-gray-400">
        {icon || <Inbox size={22} />}
      </div>
      <p className="mt-3 font-display text-lg text-charcoal">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- Forms ---------- */

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="ui-label">{label}{required && <span className="ml-0.5 text-danger">*</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] font-semibold text-danger">{error}</span>}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { error?: string };

export function Input({ error, className = '', ...props }: InputProps) {
  return <input {...props} className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`} />;
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export function Select({ error, options, placeholder = 'Select…', className = '', children, ...props }: SelectProps) {
  return (
    <select {...props} className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`}>
      <option value="">{placeholder}</option>
      {options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      {children}
    </select>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string };

export function Textarea({ error, className = '', ...props }: TextareaProps) {
  return <textarea {...props} className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`} />;
}

export function Checkbox({ label, description, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-3">
      <input type="checkbox" {...props} className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-gold" />
      <span>
        <span className="block text-sm font-medium text-charcoal">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-gray-500">{description}</span>}
      </span>
    </label>
  );
}

/* ---------- Data display ---------- */

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = 'No records found',
  emptyDescription,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}) {
  const [sort, setSort] = useState<{ key: string; direction: 1 | -1 } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((item) => item.key === sort.key);
    if (!column?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      if (left === right) return 0;
      return (left > right ? 1 : -1) * sort.direction;
    });
  }, [rows, columns, sort]);

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-ivory-dark">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className || ''}>
                {column.sortValue ? (
                  <button
                    type="button"
                    className="ui-focus inline-flex items-center gap-1 font-semibold hover:text-gold"
                    onClick={() => setSort((previous) => ({
                      key: column.key,
                      direction: previous?.key === column.key && previous.direction === 1 ? -1 : 1,
                    }))}
                  >
                    {column.header}
                    {sort?.key === column.key && <span aria-hidden>{sort.direction === 1 ? '↑' : '↓'}</span>}
                  </button>
                ) : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3 text-xs text-gray-500">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="ui-focus rounded-lg border border-gray-200 p-1.5 disabled:opacity-40"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="ui-focus rounded-lg border border-gray-200 p-1.5 disabled:opacity-40"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-ivory-dark">
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          type="button"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={`ui-focus inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${value === item.value ? 'border-gold text-gold' : 'border-transparent text-gray-500 hover:text-charcoal'}`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
