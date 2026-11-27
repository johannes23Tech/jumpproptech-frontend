import { api } from './api';
import {
  buildPlaceholderMap,
  parseTemplate,
  payloadToForm,
  resolveTemplate,
  type PlaceholderContext,
} from './contracts';
import type { Contract, ContractForm, ContractTemplate } from '../types/contracts';

const TEMPLATE_TITLES: Record<string, string> = {
  new_lease: 'Residential Lease Agreement',
  renewal: 'Residential Lease Renewal Agreement',
};

export interface RenderedContract {
  contract: Contract | null;
  template: ContractTemplate;
  title: string;
  blocks: ReturnType<typeof parseTemplate>;
  meta: {
    contractReference: string;
    propertyAddress: string;
    agreementDate: string;
    landlordInitials: string;
    tenantInitials: string;
  };
  pendingApproval: boolean;
}

export function renderFromForm(
  form: ContractForm,
  template: ContractTemplate,
  context: Omit<PlaceholderContext, 'form'>,
): Omit<RenderedContract, 'contract'> {
  const values = buildPlaceholderMap({ form, ...context });
  return {
    template,
    title: TEMPLATE_TITLES[template.template_type] || template.name,
    blocks: parseTemplate(resolveTemplate(template.content, values)),
    meta: {
      contractReference: context.contract?.contract_reference || 'PENDING',
      propertyAddress: context.property?.address || '',
      agreementDate: form.agreementDate,
      landlordInitials: '',
      tenantInitials: '',
    },
    pendingApproval: template.approval_status !== 'approved',
  };
}

/** Fetch a saved contract + its approved template and resolve it for preview/export. */
export async function renderSavedContract(id: number): Promise<RenderedContract> {
  const [contract, templates] = await Promise.all([
    api.getContract(id) as Promise<Contract>,
    api.getContractTemplates() as Promise<ContractTemplate[]>,
  ]);
  const template = templates.find((item) => item.id === contract.template_id)
    || templates.find((item) => item.template_type === contract.contract_type && item.is_default)
    || templates.find((item) => item.template_type === contract.contract_type);

  if (!template) throw new Error('The approved template for this contract could not be loaded.');

  const form = { ...payloadToForm(contract.payload, contract) } as ContractForm;
  const rendered = renderFromForm(form, template, {
    landlord: contract.landlord,
    tenant: contract.tenant,
    property: contract.property
      ? {
          name: contract.property.name,
          address: contract.property.address,
          unit_number: contract.unit?.unit_number || contract.unit_number || '',
        }
      : null,
    contract,
  });

  return {
    ...rendered,
    contract,
    meta: {
      ...rendered.meta,
      contractReference: contract.contract_reference,
      landlordInitials: contract.landlord_signed_at ? contract.landlord?.name || 'SIGNED' : '',
      tenantInitials: contract.tenant_signed_at ? contract.tenant?.name || 'SIGNED' : '',
    },
  };
}
