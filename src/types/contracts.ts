// Lease contract generator types.
// All legal wording comes from management-approved templates stored by the API.
// This module only describes operational data and the template placeholder map.

export type ContractStatus =
  | 'draft'
  | 'ready_for_review'
  | 'issued'
  | 'awaiting_signature'
  | 'partially_signed'
  | 'fully_signed'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'terminated'
  | 'cancelled';

export type TemplateType = 'new_lease' | 'renewal';
export type ApprovalStatus = 'approved' | 'pending';

export type SignerRole =
  | 'landlord'
  | 'tenant'
  | 'additional_tenant'
  | 'witness_1'
  | 'witness_2';

export interface ContractTemplate {
  id: number;
  name: string;
  template_type: TemplateType;
  content: string;
  approval_status: ApprovalStatus;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractParty {
  name: string;
  email: string;
  phone: string;
  id_number: string;
}

export interface ContractClause {
  id: number;
  clause_number: number;
  clause_title: string;
  clause_content: string;
  enabled: boolean;
  display_order: number;
  source: 'template' | 'custom';
}

export interface ContractSignature {
  id: number;
  signer_role: SignerRole;
  signer_name: string;
  signature_method: string;
  evidence_url: string | null;
  signed_at: string;
}

export interface ContractVersion {
  id: number;
  version_number: number;
  previous_contract_id: number | null;
  document_url: string | null;
  change_summary: string | null;
  created_by: number | null;
  created_at: string;
}

export interface ContractAuditEntry {
  id: number;
  action: string;
  outcome: string;
  actor_email: string | null;
  meta: string | null;
  created_at: string;
}

export interface ContractSummary {
  id: number;
  contract_reference: string;
  tenant_id: number;
  tenant_name: string;
  property_id: number | null;
  property_name: string | null;
  unit_id: number | null;
  unit_number: string | null;
  template_id: number | null;
  contract_type: TemplateType;
  status: ContractStatus;
  agreement_date: string;
  commencement_date: string;
  termination_date: string;
  monthly_rent: string | number;
  deposit_amount: string | number;
  issued_at: string | null;
  landlord_signed_at: string | null;
  tenant_signed_at: string | null;
  previous_contract_id: number | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Contract extends ContractSummary {
  tenant: ContractParty;
  property: { name: string; address: string } | null;
  unit: { unit_number: string } | null;
  landlord: ContractParty;
  payment_due_day: number | null;
  payment_frequency: string | null;
  escalation_percentage: string | number | null;
  escalation_date: string | null;
  notice_period: string | null;
  lease_duration: string | null;
  payload: ContractPayload;
  clauses: ContractClause[];
  signatures: ContractSignature[];
  versions: ContractVersion[];
  audit: ContractAuditEntry[];
  can_edit: boolean;
  generated_document_url: string | null;
  signed_document_url: string | null;
  archived_at: string | null;
}

export interface ContractStats {
  total: number;
  draft: number;
  ready_for_review: number;
  issued: number;
  awaiting_signature: number;
  partially_signed: number;
  fully_signed: number;
  active: number;
  expiring_soon: number;
  expired: number;
  terminated: number;
  cancelled: number;
}

/** Operational wizard data. No legal clause text is stored here. */
export interface ContractPayload {
  emergency_contact?: { name: string; phone: string; relationship: string };
  additional_tenants?: string[];
  agreement?: {
    reference?: string;
    agreement_date?: string;
    commencement_date?: string;
    termination_date?: string;
    duration?: string;
    lease_type?: string;
    renewal_option?: string;
    notice_period?: string;
    occupation_date?: string;
  };
  rental?: {
    monthly_rent?: string;
    due_day?: string;
    frequency?: string;
    deposit_amount?: string;
    deposit_due_date?: string;
    deposit_status?: string;
    additional_charges?: string;
    utilities_included?: string;
    utilities_excluded?: string;
    late_payment_terms?: string;
    escalation_percentage?: string;
    escalation_date?: string;
  };
  payment?: {
    bank_name?: string;
    account_holder?: string;
    account_number?: string;
    account_type?: string;
    branch_code?: string;
    payment_reference?: string;
    alternative_methods?: string;
    cash_instructions?: string;
  };
  occupancy?: {
    max_occupants?: string;
    authorized_occupants?: string;
    permitted_use?: string;
    visitors_policy?: string;
    quiet_hours?: string;
    smoking_policy?: string;
    pet_policy?: string;
    parking?: string;
    shared_facilities?: string;
    electricity?: string;
    water?: string;
    waste_disposal?: string;
    security?: string;
    keys_access?: string;
    property_condition?: string;
    furniture_appliances?: string;
    inventory_checklist?: string;
    custom_rules?: string;
  };
  renewal?: {
    original_reference?: string;
    original_start_date?: string;
    original_end_date?: string;
    previous_monthly_rent?: string;
    existing_deposit?: string;
    additional_deposit?: string;
    renewed_deposit?: string;
    deposit_status?: string;
    additional_deposit_due_date?: string;
    duration?: string;
    type?: string;
    utility_terms?: string;
    payment_method?: string;
    occupancy_terms?: string;
    house_rules?: string;
    maintenance_terms?: string;
    notice_period?: string;
    special_conditions?: string;
    inspection_report_reference?: string;
    condition_notes?: string;
  };
  additional_tenant_name?: string;
  custom_terms?: string;
}

/** Flat wizard state; mapped to ContractPayload on submit. */
export interface ContractForm {
  templateId: string;
  contractType: TemplateType;
  propertyId: string;
  unitId: string;
  tenantId: string;
  additionalTenants: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  agreementDate: string;
  commencementDate: string;
  terminationDate: string;
  leaseType: string;
  duration: string;
  renewalOption: string;
  noticePeriod: string;
  occupationDate: string;
  monthlyRent: string;
  dueDay: string;
  frequency: string;
  depositAmount: string;
  depositDueDate: string;
  depositStatus: string;
  additionalCharges: string;
  utilitiesIncluded: string;
  utilitiesExcluded: string;
  latePaymentTerms: string;
  escalationPercentage: string;
  escalationDate: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  accountType: string;
  branchCode: string;
  paymentReference: string;
  alternativeMethods: string;
  cashInstructions: string;
  maxOccupants: string;
  authorizedOccupants: string;
  permittedUse: string;
  visitorsPolicy: string;
  quietHours: string;
  smokingPolicy: string;
  petPolicy: string;
  parking: string;
  sharedFacilities: string;
  electricity: string;
  water: string;
  wasteDisposal: string;
  security: string;
  keysAccess: string;
  propertyCondition: string;
  furnitureAppliances: string;
  inventoryChecklist: string;
  customRules: string;
  originalReference: string;
  originalStartDate: string;
  originalEndDate: string;
  previousMonthlyRent: string;
  existingDeposit: string;
  additionalDeposit: string;
  renewedDeposit: string;
  renewalDepositStatus: string;
  additionalDepositDueDate: string;
  renewalDuration: string;
  renewalType: string;
  updatedUtilities: string;
  updatedPaymentMethod: string;
  updatedOccupancy: string;
  updatedHouseRules: string;
  updatedMaintenance: string;
  updatedNoticePeriod: string;
  updatedSpecialConditions: string;
  inspectionReportReference: string;
  conditionNotes: string;
  additionalTenantName: string;
  customTerms: string;
}

export const EMPTY_CONTRACT_FORM: ContractForm = {
  templateId: '',
  contractType: 'new_lease',
  propertyId: '',
  unitId: '',
  tenantId: '',
  additionalTenants: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelationship: '',
  agreementDate: '',
  commencementDate: '',
  terminationDate: '',
  leaseType: 'Fixed-term',
  duration: '12 months',
  renewalOption: '',
  noticePeriod: '',
  occupationDate: '',
  monthlyRent: '',
  dueDay: '1',
  frequency: 'Monthly',
  depositAmount: '',
  depositDueDate: '',
  depositStatus: '',
  additionalCharges: '',
  utilitiesIncluded: '',
  utilitiesExcluded: '',
  latePaymentTerms: '',
  escalationPercentage: '',
  escalationDate: '',
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  accountType: '',
  branchCode: '',
  paymentReference: '',
  alternativeMethods: '',
  cashInstructions: '',
  maxOccupants: '',
  authorizedOccupants: '',
  permittedUse: 'Residential purposes only',
  visitorsPolicy: '',
  quietHours: '',
  smokingPolicy: '',
  petPolicy: '',
  parking: '',
  sharedFacilities: '',
  electricity: '',
  water: '',
  wasteDisposal: '',
  security: '',
  keysAccess: '',
  propertyCondition: '',
  furnitureAppliances: '',
  inventoryChecklist: '',
  customRules: '',
  originalReference: '',
  originalStartDate: '',
  originalEndDate: '',
  previousMonthlyRent: '',
  existingDeposit: '',
  additionalDeposit: '',
  renewedDeposit: '',
  renewalDepositStatus: '',
  additionalDepositDueDate: '',
  renewalDuration: '12 months',
  renewalType: 'Fixed-term',
  updatedUtilities: '',
  updatedPaymentMethod: '',
  updatedOccupancy: '',
  updatedHouseRules: '',
  updatedMaintenance: '',
  updatedNoticePeriod: '',
  updatedSpecialConditions: '',
  inspectionReportReference: '',
  conditionNotes: '',
  additionalTenantName: '',
  customTerms: '',
};
