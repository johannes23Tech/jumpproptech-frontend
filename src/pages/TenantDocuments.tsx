import { useEffect, useState } from 'react';
import { FileText, Wallet, ShieldCheck, Download, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

type TenantData = {
  lease: {
    id: number;
    version: number;
    status: string;
    title: string | null;
    document_url: string | null;
    start_date: string;
    end_date: string;
    monthly_rent: string | number;
    deposit_required: string | number;
    activated_at: string | null;
    signatures: { party: string; signer_name: string; method: string; signed_at: string }[];
  } | null;
  deposit: {
    required: number;
    received: number;
    deductions: number;
    refunds: number;
    adjustments: number;
    balance: number;
    status: string;
    transactions: {
      id: number;
      type: string;
      amount: string | number;
      method: string | null;
      reference: string | null;
      notes: string | null;
      recorded_at: string;
    }[];
  } | null;
  inspections: {
    id: number;
    type: string;
    status: string;
    inspected_at: string | null;
    notes: string | null;
    photos: { id: number; url: string; caption: string | null }[];
  }[];
};

const money = (value: string | number | null | undefined): string =>
  `R ${Number(value ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const humanise = (value: string): string => value.replace(/_/g, ' ');

export default function TenantDocuments() {
  const [data, setData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTenantData()
      .then((res) => setData(res as TenantData))
      .catch((err) => setError(err instanceof Error ? err.message : 'Your documents could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading your documents...</p>;
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
        {error}
      </div>
    );
  }

  const lease = data?.lease ?? null;
  const deposit = data?.deposit ?? null;
  const inspections = data?.inspections ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-display text-xl font-bold">My Lease</h2>
        {!lease ? (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-ivory p-4 text-sm text-gray-600">
            <AlertCircle className="text-warning" />
            <p>No lease has been issued yet. Your property manager will publish it here once it is activated.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-ivory p-4">
              <div className="flex items-center gap-3">
                <FileText className="text-gold" />
                <div>
                  <p className="font-bold">{lease.title || 'Residential lease agreement'}</p>
                  <p className="text-xs text-gray-500">
                    Version {lease.version} · {humanise(lease.status)} · {lease.start_date} to {lease.end_date}
                  </p>
                </div>
              </div>
              {lease.document_url ? (
                <a
                  href={lease.document_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-gold hover:bg-white"
                >
                  <Download size={20} />
                </a>
              ) : (
                <span className="text-xs text-warning">Document not attached yet</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Monthly rent</p>
                <p className="font-bold">{money(lease.monthly_rent)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Deposit required</p>
                <p className="font-bold">{money(lease.deposit_required)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Activated</p>
                <p className="font-bold">{lease.activated_at ? new Date(lease.activated_at).toLocaleDateString('en-ZA') : 'Not yet'}</p>
              </div>
            </div>

            {lease.signatures.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Signatures</p>
                <ul className="space-y-2">
                  {lease.signatures.map((signature) => (
                    <li key={`${signature.party}-${signature.signed_at}`} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
                      <span className="font-semibold capitalize">{signature.party}</span>
                      <span className="text-xs text-gray-500">
                        {signature.signer_name} · {humanise(signature.method)} · {new Date(signature.signed_at).toLocaleDateString('en-ZA')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <Wallet className="text-gold" /> My Deposit
        </h2>
        {!deposit || (deposit.required === 0 && deposit.received === 0 && deposit.balance === 0) ? (
          <p className="rounded-lg border border-gray-200 bg-ivory p-4 text-sm text-gray-600">
            No deposit has been recorded on your tenancy.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Required</p>
                <p className="font-bold">{money(deposit.required)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Received</p>
                <p className="font-bold">{money(deposit.received)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Deductions</p>
                <p className="font-bold">{money(deposit.deductions)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Held balance</p>
                <p className="font-bold text-gold">{money(deposit.balance)}</p>
              </div>
            </div>

            {deposit.transactions.length > 0 && (
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
                {deposit.transactions.map((transaction) => (
                  <li key={transaction.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <div>
                      <p className="font-semibold capitalize">{humanise(transaction.type)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.recorded_at).toLocaleDateString('en-ZA')}
                        {transaction.method ? ` · ${transaction.method.toUpperCase()}` : ''}
                      </p>
                    </div>
                    <span className="font-bold">{money(transaction.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <ShieldCheck className="text-gold" /> My Inspections
        </h2>
        {inspections.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-ivory p-4 text-sm text-gray-600">
            No inspections have been recorded on your unit yet.
          </p>
        ) : (
          <div className="space-y-3">
            {inspections.map((inspection) => (
              <div key={inspection.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold capitalize">{humanise(inspection.type)} inspection</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    inspection.status === 'completed' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {inspection.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{inspection.inspected_at ?? 'Date not set'}</p>
                {inspection.notes && <p className="mt-2 text-sm text-gray-600">{inspection.notes}</p>}
                {inspection.photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {inspection.photos.map((photo) => (
                      <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer noopener">
                        <img src={photo.url} alt={photo.caption ?? 'Inspection photo'} className="h-16 w-16 rounded-lg object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
