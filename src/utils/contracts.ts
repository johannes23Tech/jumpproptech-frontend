import type {
  Contract,
  ContractForm,
  ContractParty,
  ContractPayload,
  ContractStatus,
} from '../types/contracts';

export const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Draft',
  ready_for_review: 'Ready for Review',
  issued: 'Issued to Tenant',
  awaiting_signature: 'Awaiting Signature',
  partially_signed: 'Partially Signed',
  fully_signed: 'Fully Signed',
  active: 'Active',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
  terminated: 'Terminated',
  cancelled: 'Cancelled',
};

export const STATUS_STYLES: Record<ContractStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  ready_for_review: 'bg-blue-50 text-blue-700',
  issued: 'bg-purple-50 text-purple-700',
  awaiting_signature: 'bg-yellow-50 text-yellow-800',
  partially_signed: 'bg-orange-50 text-orange-700',
  fully_signed: 'bg-emerald-50 text-emerald-700',
  active: 'bg-success/10 text-success',
  expiring_soon: 'bg-warning/10 text-warning',
  expired: 'bg-gray-100 text-gray-500',
  terminated: 'bg-danger/10 text-danger',
  cancelled: 'bg-gray-100 text-gray-500',
};

export const money = (value: string | number | null | undefined): string =>
  `R ${Number(value ?? 0).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const addMonthsISO = (months: number, from = new Date()): string => {
  const date = new Date(from);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

export const displayDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const contractFilename = (
  contract: Pick<Contract, 'tenant_name' | 'unit_number' | 'commencement_date'>,
  extension: 'pdf' | 'docx',
): string => {
  const surname = (contract.tenant_name || 'TENANT').trim().split(/\s+/).pop() || 'TENANT';
  const unit = (contract.unit_number || 'UNIT').replace(/[^a-z0-9]+/gi, '_').toUpperCase();
  return `LEASE_${surname.toUpperCase()}_${unit}_${contract.commencement_date || todayISO()}.${extension}`;
};

export interface PlaceholderContext {
  form: ContractForm;
  landlord?: ContractParty | null;
  tenant?: ContractParty | null;
  property?: { name: string; address: string; unit_number: string } | null;
  contract?: Partial<Contract> | null;
}

/**
 * Build the {{placeholder}} -> value map used by approved templates.
 * Values come only from operational data; the legal wording stays in the template.
 */
export function buildPlaceholderMap(ctx: PlaceholderContext): Record<string, string> {
  const { form, landlord, tenant, property, contract } = ctx;
  const pick = (...values: Array<string | number | null | undefined>): string => {
    for (const value of values) {
      if (value !== null && value !== undefined && String(value).trim() !== '') return String(value).trim();
    }
    return '—';
  };

  const originalReference = pick(
    form.originalReference,
    contract?.previous_contract_id ? `LC-${contract.previous_contract_id}` : null,
    contract?.contract_reference,
  );

  return {
    // References and dates
    contract_reference: pick(contract?.contract_reference, form.agreementDate && 'PENDING'),
    agreement_reference: pick(contract?.contract_reference),
    contract_number: pick(contract?.contract_reference),
    agreement_date: pick(form.agreementDate, contract?.agreement_date),
    document_date: pick(form.agreementDate, contract?.agreement_date),

    // Renewal references
    renewal_reference: pick(contract?.contract_reference),
    original_contract_reference: originalReference,
    renewal_agreement_date: pick(form.agreementDate, contract?.agreement_date),

    // Parties
    landlord_full_name: pick(landlord?.name, contract?.landlord?.name),
    landlord_name: pick(landlord?.name, contract?.landlord?.name),
    landlord_id_number: pick(landlord?.id_number, contract?.landlord?.id_number),
    landlord_phone: pick(landlord?.phone, contract?.landlord?.phone),
    landlord_email: pick(landlord?.email, contract?.landlord?.email),
    tenant_full_name: pick(tenant?.name, contract?.tenant?.name, contract?.tenant_name),
    tenant_name: pick(tenant?.name, contract?.tenant?.name, contract?.tenant_name),
    tenant_id_number: pick(tenant?.id_number, contract?.tenant?.id_number),
    tenant_phone: pick(tenant?.phone, contract?.tenant?.phone),
    tenant_email: pick(tenant?.email, contract?.tenant?.email),
    additional_tenant_name: pick(form.additionalTenantName, form.additionalTenants, '—'),

    // Property
    property_name: pick(property?.name, contract?.property?.name, contract?.property_name),
    property_address: pick(property?.address, contract?.property?.address),
    unit_number: pick(property?.unit_number, contract?.unit?.unit_number, contract?.unit_number),

    // Dates and duration
    start_date: pick(form.commencementDate, contract?.commencement_date),
    end_date: pick(form.terminationDate, contract?.termination_date),
    lease_start: pick(form.commencementDate, contract?.commencement_date),
    lease_end: pick(form.terminationDate, contract?.termination_date),
    original_start_date: pick(form.originalStartDate, form.commencementDate),
    original_end_date: pick(form.originalEndDate, form.terminationDate),
    renewal_start_date: pick(form.commencementDate, contract?.commencement_date),
    renewal_end_date: pick(form.terminationDate, contract?.termination_date),
    renewal_duration: pick(form.renewalDuration, form.duration),
    renewal_type: pick(form.renewalType, form.leaseType),
    occupation_date: pick(form.occupationDate, form.commencementDate),
    lease_duration: pick(form.duration, form.renewalDuration),
    notice_period: pick(form.noticePeriod, form.updatedNoticePeriod),
    lease_type: pick(form.leaseType, form.renewalType),
    renewal_option: pick(form.renewalOption),

    // Rental
    monthly_rent: money(form.monthlyRent || contract?.monthly_rent),
    renewed_monthly_rent: money(form.monthlyRent || contract?.monthly_rent),
    previous_monthly_rent: money(form.previousMonthlyRent),
    monthly_rent_amount: form.monthlyRent || String(contract?.monthly_rent ?? ''),
    deposit_amount: money(form.depositAmount || contract?.deposit_amount),
    deposit: money(form.depositAmount || contract?.deposit_amount),
    existing_deposit_amount: money(form.existingDeposit),
    additional_deposit_amount: money(form.additionalDeposit),
    renewed_deposit_amount: money(form.renewedDeposit || form.depositAmount),
    deposit_status: pick(form.renewalDepositStatus, form.depositStatus),
    additional_deposit_due_date: pick(form.additionalDepositDueDate, form.depositDueDate),
    rent_due_day: pick(form.dueDay),
    payment_frequency: pick(form.frequency),
    additional_charges: pick(form.additionalCharges),
    utilities_included: pick(form.utilitiesIncluded),
    utilities_excluded: pick(form.utilitiesExcluded),
    late_payment_terms: pick(form.latePaymentTerms),
    escalation_percentage: pick(form.escalationPercentage),
    rental_increase_percentage: pick(form.escalationPercentage),
    escalation_date: pick(form.escalationDate),
    rental_effective_date: pick(form.escalationDate, form.commencementDate),

    // Payment instructions (configured, never hardcoded)
    bank_name: pick(form.bankName),
    account_holder: pick(form.accountHolder, landlord?.name),
    account_number: pick(form.accountNumber),
    account_type: pick(form.accountType),
    branch_code: pick(form.branchCode),
    payment_reference: pick(form.paymentReference, contract?.contract_reference),
    alternative_payment_methods: pick(form.alternativeMethods),
    cash_payment_instructions: pick(form.cashInstructions),

    // Occupancy and rules
    occupancy_limit: pick(form.maxOccupants),
    authorized_occupants: pick(form.authorizedOccupants),
    permitted_use: pick(form.permittedUse),
    visitors_policy: pick(form.visitorsPolicy),
    quiet_hours: pick(form.quietHours),
    smoking_policy: pick(form.smokingPolicy),
    pet_policy: pick(form.petPolicy),
    parking_arrangements: pick(form.parking),
    shared_facilities: pick(form.sharedFacilities),
    electricity_arrangements: pick(form.electricity),
    water_arrangements: pick(form.water),
    waste_disposal: pick(form.wasteDisposal),
    security_responsibilities: pick(form.security),
    keys_and_access: pick(form.keysAccess),
    property_condition: pick(form.propertyCondition),
    furniture_and_appliances: pick(form.furnitureAppliances),
    inventory_checklist: pick(form.inventoryChecklist),
    custom_property_rules: pick(form.customRules),
    custom_terms: pick(form.customTerms),

    // Renewal-only updated terms
    updated_utility_terms: pick(form.updatedUtilities, form.utilitiesIncluded),
    updated_payment_method: pick(form.updatedPaymentMethod, form.frequency),
    updated_occupancy_terms: pick(form.updatedOccupancy, form.maxOccupants),
    updated_house_rules: pick(form.updatedHouseRules, form.customRules),
    updated_maintenance_terms: pick(form.updatedMaintenance),
    updated_notice_period: pick(form.updatedNoticePeriod, form.noticePeriod),
    updated_special_conditions: pick(form.updatedSpecialConditions, form.customTerms),
    inspection_report_reference: pick(form.inspectionReportReference),
    condition_notes: pick(form.conditionNotes, form.propertyCondition),

    // Emergency contact
    emergency_contact_name: pick(form.emergencyName),
    emergency_contact_phone: pick(form.emergencyPhone),
    emergency_contact_relationship: pick(form.emergencyRelationship),
  };
}

/** Replace {{key}} tokens with values. Unresolved tokens become an em dash. */
export function resolveTemplate(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_match, key: string) => {
    const value = values[key.trim().toLowerCase()];
    return value && value.trim() !== '' ? value : '—';
  });
}

export type TemplateBlock =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'space' };

/** Parse the approved template's lightweight markdown into renderable blocks. */
export function parseTemplate(content: string): TemplateBlock[] {
  return content.split(/\r?\n/).map((raw): TemplateBlock => {
    const line = raw.trim();
    if (line === '') return { type: 'space' };
    if (line.startsWith('### ')) return { type: 'h3', text: line.slice(4).trim() };
    if (line.startsWith('## ')) return { type: 'h2', text: line.slice(3).trim() };
    if (line.startsWith('# ')) return { type: 'h1', text: line.slice(2).trim() };
    return { type: 'paragraph', text: line };
  });
}

export function formToPayload(form: ContractForm): ContractPayload {
  return {
    emergency_contact: {
      name: form.emergencyName,
      phone: form.emergencyPhone,
      relationship: form.emergencyRelationship,
    },
    additional_tenants: form.additionalTenants.split('\n').map((v) => v.trim()).filter(Boolean),
    agreement: {
      reference: form.originalReference,
      agreement_date: form.agreementDate,
      commencement_date: form.commencementDate,
      termination_date: form.terminationDate,
      duration: form.duration,
      lease_type: form.leaseType,
      renewal_option: form.renewalOption,
      notice_period: form.noticePeriod,
      occupation_date: form.occupationDate,
    },
    rental: {
      monthly_rent: form.monthlyRent,
      due_day: form.dueDay,
      frequency: form.frequency,
      deposit_amount: form.depositAmount,
      deposit_due_date: form.depositDueDate,
      deposit_status: form.depositStatus,
      additional_charges: form.additionalCharges,
      utilities_included: form.utilitiesIncluded,
      utilities_excluded: form.utilitiesExcluded,
      late_payment_terms: form.latePaymentTerms,
      escalation_percentage: form.escalationPercentage,
      escalation_date: form.escalationDate,
    },
    payment: {
      bank_name: form.bankName,
      account_holder: form.accountHolder,
      account_number: form.accountNumber,
      account_type: form.accountType,
      branch_code: form.branchCode,
      payment_reference: form.paymentReference,
      alternative_methods: form.alternativeMethods,
      cash_instructions: form.cashInstructions,
    },
    occupancy: {
      max_occupants: form.maxOccupants,
      authorized_occupants: form.authorizedOccupants,
      permitted_use: form.permittedUse,
      visitors_policy: form.visitorsPolicy,
      quiet_hours: form.quietHours,
      smoking_policy: form.smokingPolicy,
      pet_policy: form.petPolicy,
      parking: form.parking,
      shared_facilities: form.sharedFacilities,
      electricity: form.electricity,
      water: form.water,
      waste_disposal: form.wasteDisposal,
      security: form.security,
      keys_access: form.keysAccess,
      property_condition: form.propertyCondition,
      furniture_appliances: form.furnitureAppliances,
      inventory_checklist: form.inventoryChecklist,
      custom_rules: form.customRules,
    },
    renewal: {
      original_reference: form.originalReference,
      original_start_date: form.originalStartDate,
      original_end_date: form.originalEndDate,
      previous_monthly_rent: form.previousMonthlyRent,
      existing_deposit: form.existingDeposit,
      additional_deposit: form.additionalDeposit,
      renewed_deposit: form.renewedDeposit,
      deposit_status: form.renewalDepositStatus,
      additional_deposit_due_date: form.additionalDepositDueDate,
      duration: form.renewalDuration,
      type: form.renewalType,
      utility_terms: form.updatedUtilities,
      payment_method: form.updatedPaymentMethod,
      occupancy_terms: form.updatedOccupancy,
      house_rules: form.updatedHouseRules,
      maintenance_terms: form.updatedMaintenance,
      notice_period: form.updatedNoticePeriod,
      special_conditions: form.updatedSpecialConditions,
      inspection_report_reference: form.inspectionReportReference,
      condition_notes: form.conditionNotes,
    },
    additional_tenant_name: form.additionalTenantName,
    custom_terms: form.customTerms,
  };
}

export function payloadToForm(payload: ContractPayload, contract?: Contract | null): Partial<ContractForm> {
  const next: Partial<ContractForm> = {};
  const s = (value: string | undefined | null) => (value ? String(value) : '');
  next.originalReference = s(payload.agreement?.reference || payload.renewal?.original_reference);
  next.agreementDate = s(payload.agreement?.agreement_date);
  next.commencementDate = s(contract?.commencement_date || payload.agreement?.commencement_date);
  next.terminationDate = s(contract?.termination_date || payload.agreement?.termination_date);
  next.duration = s(payload.agreement?.duration);
  next.leaseType = s(payload.agreement?.lease_type) || 'Fixed-term';
  next.renewalOption = s(payload.agreement?.renewal_option);
  next.noticePeriod = s(payload.agreement?.notice_period);
  next.occupationDate = s(payload.agreement?.occupation_date);
  next.monthlyRent = s(contract?.monthly_rent ?? payload.rental?.monthly_rent);
  next.dueDay = s(payload.rental?.due_day) || '1';
  next.frequency = s(payload.rental?.frequency) || 'Monthly';
  next.depositAmount = s(contract?.deposit_amount ?? payload.rental?.deposit_amount);
  next.depositDueDate = s(payload.rental?.deposit_due_date);
  next.depositStatus = s(payload.rental?.deposit_status);
  next.additionalCharges = s(payload.rental?.additional_charges);
  next.utilitiesIncluded = s(payload.rental?.utilities_included);
  next.utilitiesExcluded = s(payload.rental?.utilities_excluded);
  next.latePaymentTerms = s(payload.rental?.late_payment_terms);
  next.escalationPercentage = s(payload.rental?.escalation_percentage);
  next.escalationDate = s(payload.rental?.escalation_date);
  next.bankName = s(payload.payment?.bank_name);
  next.accountHolder = s(payload.payment?.account_holder);
  next.accountNumber = s(payload.payment?.account_number);
  next.accountType = s(payload.payment?.account_type);
  next.branchCode = s(payload.payment?.branch_code);
  next.paymentReference = s(payload.payment?.payment_reference);
  next.alternativeMethods = s(payload.payment?.alternative_methods);
  next.cashInstructions = s(payload.payment?.cash_instructions);
  next.maxOccupants = s(payload.occupancy?.max_occupants);
  next.authorizedOccupants = s(payload.occupancy?.authorized_occupants);
  next.permittedUse = s(payload.occupancy?.permitted_use) || 'Residential purposes only';
  next.visitorsPolicy = s(payload.occupancy?.visitors_policy);
  next.quietHours = s(payload.occupancy?.quiet_hours);
  next.smokingPolicy = s(payload.occupancy?.smoking_policy);
  next.petPolicy = s(payload.occupancy?.pet_policy);
  next.parking = s(payload.occupancy?.parking);
  next.sharedFacilities = s(payload.occupancy?.shared_facilities);
  next.electricity = s(payload.occupancy?.electricity);
  next.water = s(payload.occupancy?.water);
  next.wasteDisposal = s(payload.occupancy?.waste_disposal);
  next.security = s(payload.occupancy?.security);
  next.keysAccess = s(payload.occupancy?.keys_access);
  next.propertyCondition = s(payload.occupancy?.property_condition);
  next.furnitureAppliances = s(payload.occupancy?.furniture_appliances);
  next.inventoryChecklist = s(payload.occupancy?.inventory_checklist);
  next.customRules = s(payload.occupancy?.custom_rules);
  next.originalStartDate = s(payload.renewal?.original_start_date);
  next.originalEndDate = s(payload.renewal?.original_end_date);
  next.previousMonthlyRent = s(payload.renewal?.previous_monthly_rent);
  next.existingDeposit = s(payload.renewal?.existing_deposit);
  next.additionalDeposit = s(payload.renewal?.additional_deposit);
  next.renewedDeposit = s(payload.renewal?.renewed_deposit);
  next.renewalDepositStatus = s(payload.renewal?.deposit_status);
  next.additionalDepositDueDate = s(payload.renewal?.additional_deposit_due_date);
  next.renewalDuration = s(payload.renewal?.duration) || '12 months';
  next.renewalType = s(payload.renewal?.type) || 'Fixed-term';
  next.updatedUtilities = s(payload.renewal?.utility_terms);
  next.updatedPaymentMethod = s(payload.renewal?.payment_method);
  next.updatedOccupancy = s(payload.renewal?.occupancy_terms);
  next.updatedHouseRules = s(payload.renewal?.house_rules);
  next.updatedMaintenance = s(payload.renewal?.maintenance_terms);
  next.updatedNoticePeriod = s(payload.renewal?.notice_period);
  next.updatedSpecialConditions = s(payload.renewal?.special_conditions);
  next.inspectionReportReference = s(payload.renewal?.inspection_report_reference);
  next.conditionNotes = s(payload.renewal?.condition_notes);
  next.additionalTenantName = s(payload.additional_tenant_name);
  next.customTerms = s(payload.custom_terms);
  next.emergencyName = s(payload.emergency_contact?.name);
  next.emergencyPhone = s(payload.emergency_contact?.phone);
  next.emergencyRelationship = s(payload.emergency_contact?.relationship);
  next.additionalTenants = (payload.additional_tenants || []).join('\n');
  return next;
}

export type StepErrors = Record<string, string>;

export function validateStep(step: number, form: ContractForm): StepErrors {
  const errors: StepErrors = {};
  if (step === 0) {
    if (!form.propertyId) errors.propertyId = 'Select a property.';
    if (!form.unitId) errors.unitId = 'Select a rental unit.';
  }
  if (step === 1) {
    if (!form.tenantId) errors.tenantId = 'Select an existing tenant.';
  }
  if (step === 2) {
    if (!form.agreementDate) errors.agreementDate = 'Enter the agreement date.';
    if (!form.commencementDate) errors.commencementDate = 'Enter the commencement date.';
    if (!form.terminationDate) errors.terminationDate = 'Enter the termination date.';
    if (form.commencementDate && form.terminationDate && form.terminationDate <= form.commencementDate) {
      errors.terminationDate = 'The end date must be after the start date.';
    }
    if (!form.monthlyRent || Number(form.monthlyRent) <= 0) errors.monthlyRent = 'Enter the monthly rent.';
    if (!form.depositAmount || Number(form.depositAmount) < 0) errors.depositAmount = 'Enter the deposit amount (0 is allowed).';
    if (!form.dueDay || Number(form.dueDay) < 1 || Number(form.dueDay) > 28) {
      errors.dueDay = 'Choose a due day between 1 and 28.';
    }
  }
  if (step === 4 && !form.templateId) errors.templateId = 'Choose an approved template.';
  return errors;
}
