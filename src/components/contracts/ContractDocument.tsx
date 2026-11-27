import type { TemplateBlock } from '../../utils/contracts';
import { displayDate } from '../../utils/contracts';
import './contracts.css';

export interface ContractDocumentMeta {
  contractReference: string;
  propertyAddress?: string;
  agreementDate?: string;
  landlordInitials?: string;
  tenantInitials?: string;
}

interface ContractDocumentProps {
  title: string;
  blocks: TemplateBlock[];
  meta: ContractDocumentMeta;
  showPendingWarning?: boolean;
  compact?: boolean;
}

export const LEGAL_DISCLAIMER =
  'This document is generated from a template approved for use by management. It is not legal advice and no guarantee of legal compliance is given. Have the agreement reviewed by a qualified South African legal professional before signature.';

/** Renders an approved template as a formal, printable A4-style document. */
export default function ContractDocument({
  title,
  blocks,
  meta,
  showPendingWarning = false,
  compact = false,
}: ContractDocumentProps) {
  return (
    <div className={`contract-paper ${compact ? 'contract-paper--compact' : ''}`}>
      <div className="contract-paper__watermark-area">
        <div className="contract-paper__header">
          <div>
            <p className="contract-brand">JUMP LIVING</p>
            <p className="contract-brand-sub">PROPERTY MANAGEMENT</p>
          </div>
          <span className="contract-confidential">CONFIDENTIAL</span>
        </div>

        <div className="contract-paper__body">
          <h1 className="contract-title">{title}</h1>
          <div className="contract-meta">
            <p><span>Contract Reference:</span> {meta.contractReference || '—'}</p>
            {meta.propertyAddress && <p><span>Property Address:</span> {meta.propertyAddress}</p>}
            {meta.agreementDate && <p><span>Agreement Date:</span> {displayDate(meta.agreementDate)}</p>}
          </div>
          <hr className="contract-rule" />

          <div className="contract-content">
            {blocks.map((block, index) => {
              if (block.type === 'space') return <div className="contract-space" key={index} />;
              const text = block.text.replace(/\*\*/g, '');
              if (block.type === 'h1') return <h2 className="contract-h1" key={index}>{text}</h2>;
              if (block.type === 'h2') return <h2 className="contract-h2" key={index}>{text}</h2>;
              if (block.type === 'h3') return <h3 className="contract-h3" key={index}>{text}</h3>;
              return <p className="contract-paragraph" key={index}>{text}</p>;
            })}
          </div>

          <p className="contract-disclaimer">{LEGAL_DISCLAIMER}</p>
        </div>
      </div>

      <div className="contract-paper__footer">
        <span>Ref: {meta.contractReference || '—'}</span>
        <span>Landlord initials: {meta.landlordInitials || '____'}</span>
        <span>Tenant initials: {meta.tenantInitials || '____'}</span>
        <span>CONFIDENTIAL</span>
      </div>

      {showPendingWarning && (
        <div className="contract-pending-stamp" aria-label="Template pending legal approval">
          DRAFT — PENDING LEGAL APPROVAL — DO NOT ISSUE
        </div>
      )}
    </div>
  );
}
