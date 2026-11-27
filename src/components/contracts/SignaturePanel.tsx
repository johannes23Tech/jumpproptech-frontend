import { FileUp, PenLine } from 'lucide-react';
import type { ContractSignature, SignerRole } from '../../types/contracts';
import PremiumButton from '../PremiumButton';

const ROLES: { role: SignerRole; label: string }[] = [
  { role: 'landlord', label: 'Landlord' },
  { role: 'tenant', label: 'Tenant' },
  { role: 'additional_tenant', label: 'Additional Tenant' },
  { role: 'witness_1', label: 'Witness 1' },
  { role: 'witness_2', label: 'Witness 2' },
];

interface SignaturePanelProps {
  signatures: ContractSignature[];
  canManage: boolean;
  onRecord: (role: SignerRole) => void;
  onUpload: () => void;
}

export default function SignaturePanel({ signatures, canManage, onRecord, onUpload }: SignaturePanelProps) {
  const byRole = new Map(signatures.map((signature) => [signature.signer_role, signature]));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-premium">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-charcoal">Signatures</h2>
          <p className="mt-1 text-xs text-gray-500">
            Recorded signatures are an audit record. They are not verified electronic signatures.
          </p>
        </div>
        {canManage && (
          <PremiumButton variant="secondary" icon={<FileUp size={15} />} onClick={onUpload}>
            Upload signed copy
          </PremiumButton>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ROLES.map(({ role, label }) => {
          const signature = byRole.get(role);
          return (
            <div key={role} className="rounded-xl border border-gray-100 bg-ivory p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-charcoal">{label}</p>
                {signature ? (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">Recorded</span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">Pending</span>
                )}
              </div>
              {signature ? (
                <p className="mt-2 text-xs text-gray-600">
                  {signature.signer_name} · {signature.signature_method} ·{' '}
                  {new Date(signature.signed_at).toLocaleDateString('en-ZA')}
                </p>
              ) : (
                canManage && (
                  <button
                    type="button"
                    onClick={() => onRecord(role)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
                  >
                    <PenLine size={13} /> Record signature
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
