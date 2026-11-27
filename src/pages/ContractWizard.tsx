import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Eye, Save } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import PremiumButton from '../components/PremiumButton';
import { PageBanner } from '../components/FormFeedback';
import StepIndicator from '../components/contracts/StepIndicator';
import TemplatePicker from '../components/contracts/TemplatePicker';
import ContractDocument from '../components/contracts/ContractDocument';
import {
  addMonthsISO,
  formToPayload,
  payloadToForm,
  todayISO,
  validateStep,
  type StepErrors,
} from '../utils/contracts';
import { renderFromForm } from '../utils/contractRender';
import {
  EMPTY_CONTRACT_FORM,
  type Contract,
  type ContractForm,
  type ContractTemplate,
} from '../types/contracts';

const STEPS = ['Property', 'Tenant', 'Lease Terms', 'Conditions', 'Template & Review'];
const DRAFT_KEY = 'jpt_contract_draft';

type Option = { id: number; label: string };

function Field({ label, error, required, children, hint }: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-charcoal">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] font-semibold text-danger">{error}</span>}
    </label>
  );
}

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none';

function TextInput({ value, onChange, error, ...props }: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}) {
  return (
    <input
      {...props}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputClass} ${error ? 'border-danger' : ''}`}
    />
  );
}

function TextArea({ value, onChange, rows = 3, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
    />
  );
}

function Select({ value, onChange, options, placeholder = 'Select…', error }: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputClass} ${error ? 'border-danger' : ''}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>{option.label}</option>
      ))}
    </select>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-display text-lg text-charcoal">{title}</h3>
      {description && <p className="mb-4 mt-1 text-xs text-gray-500">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </section>
  );
}

export default function ContractWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const renewalId = searchParams.get('renew');
  const editId = id ? Number(id) : null;
  const isRenewal = Boolean(renewalId) || Boolean(searchParams.get('type') === 'renewal');

  const [form, setForm] = useState<ContractForm>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return { ...EMPTY_CONTRACT_FORM, ...JSON.parse(saved) } as ContractForm;
    } catch { /* ignore corrupted draft */ }
    return { ...EMPTY_CONTRACT_FORM, agreementDate: todayISO(), commencementDate: todayISO(), terminationDate: addMonthsISO(12) };
  });
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [errors, setErrors] = useState<StepErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState('');
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [tenants, setTenants] = useState<Option[]>([]);
  const [tenantsById, setTenantsById] = useState<Record<number, any>>({});
  const [propertiesById, setPropertiesById] = useState<Record<number, any>>({});
  const [unitsById, setUnitsById] = useState<Record<number, any>>({});
  const [originalContract, setOriginalContract] = useState<Contract | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newTenantOpen, setNewTenantOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: '', email: '', password: '', phone: '', id_number: '',
    lease_start: todayISO(), lease_end: addMonthsISO(12), rent_due_day: '1',
    deposit: '0', monthly_rent: '',
  });
  const [newTenantError, setNewTenantError] = useState('');
  const [newTenantBusy, setNewTenantBusy] = useState(false);

  const set = <K extends keyof ContractForm>(key: K, value: ContractForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  };

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [templateList, propertyList, unitList, tenantList] = await Promise.all([
          api.getContractTemplates() as Promise<ContractTemplate[]>,
          api.getProperties() as Promise<any[]>,
          api.getUnits() as Promise<any[]>,
          api.getTenants() as Promise<any[]>,
        ]);
        if (!active) return;
        const loadedTemplates = Array.isArray(templateList) ? templateList : [];
        setTemplates(loadedTemplates);
        setForm((previous) => {
          if (previous.templateId || loadedTemplates.length === 0) return previous;
          const preferred = loadedTemplates.find((template) => template.is_default && template.template_type === previous.contractType)
            || loadedTemplates.find((template) => template.template_type === previous.contractType);
          return preferred ? { ...previous, templateId: String(preferred.id) } : previous;
        });
        const props = Array.isArray(propertyList) ? propertyList : [];
        const uns = Array.isArray(unitList) ? unitList : [];
        const ts = Array.isArray(tenantList) ? tenantList : [];
        setProperties(props.map((p) => ({ id: Number(p.id), label: p.name || `Property ${p.id}` })));
        setPropertiesById(Object.fromEntries(props.map((p) => [Number(p.id), p])));
        setUnits(uns.map((u) => ({ id: Number(u.id), label: u.unit_number || `Unit ${u.id}` })));
        setUnitsById(Object.fromEntries(uns.map((u) => [Number(u.id), u])));
        setTenants(ts.map((t) => ({ id: Number(t.id), label: `${t.name}${t.id_number ? ` · ${t.id_number}` : ''}` })));
        setTenantsById(Object.fromEntries(ts.map((t) => [Number(t.id), t])));

        const sourceId = editId || (renewalId ? Number(renewalId) : null);
        if (sourceId) {
          const contract = await api.getContract(sourceId) as Contract;
          if (!active) return;
          setOriginalContract(contract);
          const prefilled = {
            ...EMPTY_CONTRACT_FORM,
            ...payloadToForm(contract.payload, contract),
          } as ContractForm;
          setForm({
            ...prefilled,
            contractType: renewalId ? 'renewal' : contract.contract_type,
            propertyId: String(contract.property_id || uns.find((unit) => Number(unit.id) === Number(contract.unit_id))?.property_id || ''),
            unitId: String(contract.unit_id || ''),
            tenantId: String(contract.tenant_id || ''),
            templateId: String(contract.template_id || ''),
            agreementDate: prefilled.agreementDate || todayISO(),
            commencementDate: renewalId ? todayISO() : prefilled.commencementDate,
            terminationDate: renewalId ? addMonthsISO(12) : prefilled.terminationDate,
            originalReference: contract.contract_reference,
            originalStartDate: contract.commencement_date,
            originalEndDate: contract.termination_date,
            previousMonthlyRent: String(contract.monthly_rent),
            existingDeposit: String(contract.deposit_amount),
          });
        } else if (isRenewal) {
          setForm((previous) => ({ ...previous, contractType: 'renewal' }));
        }
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : 'The form data could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [editId, renewalId, isRenewal]);

  const selectedProperty = form.propertyId ? propertiesById[Number(form.propertyId)] : null;
  const selectedTenant = form.tenantId ? tenantsById[Number(form.tenantId)] : null;
  const selectedTemplate = templates.find((template) => Number(template.id) === Number(form.templateId)) || null;
  const availableUnits = useMemo(
    () => units.filter((unit) => {
      const record = unitsById[unit.id];
      return !form.propertyId || Number(record?.property_id) === Number(form.propertyId);
    }),
    [units, unitsById, form.propertyId],
  );

  const propertyAddress = selectedProperty
    ? [selectedProperty.address, selectedProperty.suburb, selectedProperty.city, selectedProperty.province, selectedProperty.postal_code]
      .filter(Boolean).join(', ')
    : '';

  const next = () => {
    const found = validateStep(step, form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const nextStep = Math.min(step + 1, STEPS.length - 1);
    setStep(nextStep);
    setFurthest((previous) => Math.max(previous, nextStep));
  };

  const back = () => {
    setErrors({});
    setStep((previous) => Math.max(0, previous - 1));
  };

  const createNewTenant = async () => {
    setNewTenantError('');
    if (!newTenant.name.trim() || !newTenant.email.trim() || newTenant.password.length < 8 || !form.unitId) {
      setNewTenantError('Name, email, an 8-character password and a selected unit are required.');
      return;
    }
    setNewTenantBusy(true);
    try {
      const created = await api.createTenant({
        name: newTenant.name.trim(),
        email: newTenant.email.trim(),
        password: newTenant.password,
        phone: newTenant.phone.trim(),
        id_number: newTenant.id_number.trim(),
        unit_id: Number(form.unitId),
        lease_start: newTenant.lease_start || form.commencementDate,
        lease_end: newTenant.lease_end || form.terminationDate,
        monthly_rent: Number(newTenant.monthlyRent || form.monthlyRent || 0),
        deposit: Number(newTenant.deposit || form.depositAmount || 0),
        rent_due_day: Number(newTenant.rent_due_day || form.dueDay || 1),
      });
      const list = await api.getTenants() as any[];
      const createdId = Number(created?.id || created?.tenant_id || 0);
      setTenants(Array.isArray(list) ? list.map((t) => ({ id: Number(t.id), label: `${t.name}${t.id_number ? ` · ${t.id_number}` : ''}` })) : []);
      setTenantsById(Object.fromEntries((Array.isArray(list) ? list : []).map((t) => [Number(t.id), t])));
      if (createdId) set('tenantId', String(createdId));
      setNewTenantOpen(false);
      setSuccess('Tenant created and linked to the unit.');
    } catch (err) {
      setNewTenantError(err instanceof Error ? err.message : 'The tenant could not be created.');
    } finally {
      setNewTenantBusy(false);
    }
  };

  const save = async () => {
    const allErrors: StepErrors = {};
    for (let index = 0; index < STEPS.length; index += 1) {
      Object.assign(allErrors, validateStep(index, form));
    }
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      setSaveError('Complete the highlighted fields before saving the agreement.');
      return;
    }
    if (!selectedTemplate) {
      setSaveError('Choose an approved template before saving the agreement.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const common = {
        tenant_id: Number(form.tenantId),
        unit_id: Number(form.unitId),
        template_id: Number(form.templateId),
        contract_type: form.contractType,
        agreement_date: form.agreementDate,
        commencement_date: form.commencementDate,
        termination_date: form.terminationDate,
        monthly_rent: Number(form.monthlyRent),
        deposit_amount: Number(form.depositAmount),
        payment_due_day: Number(form.dueDay),
        payment_frequency: form.frequency,
        escalation_percentage: form.escalationPercentage ? Number(form.escalationPercentage) : null,
        escalation_date: form.escalationDate || null,
        notice_period: form.noticePeriod || null,
        lease_duration: form.duration || null,
        payload: formToPayload(form),
      };
      let result: any;
      if (editId) {
        result = await api.contractAction({ action: 'update', id: editId, ...common });
      } else if (renewalId) {
        result = await api.contractAction({ action: 'renew', id: Number(renewalId), ...common });
      } else {
        result = await api.contractAction({ action: 'create', ...common });
      }
      localStorage.removeItem(DRAFT_KEY);
      const savedId = Number(result?.id || editId || originalContract?.id || 0);
      navigate(savedId ? `/contracts/${savedId}` : '/contracts', {
        state: { message: 'Lease agreement saved as a draft.' },
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'The agreement could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const rendered = selectedTemplate
    ? renderFromForm(form, selectedTemplate, {
        landlord: {
          name: String((user as any)?.full_name || 'JUMP PROPTECH'),
          email: String((user as any)?.email || ''),
          phone: String((user as any)?.phone || ''),
          id_number: '',
        },
        tenant: selectedTenant
          ? {
              name: String(selectedTenant.name || ''),
              email: String(selectedTenant.email || ''),
              phone: String(selectedTenant.phone || ''),
              id_number: String(selectedTenant.id_number || ''),
            }
          : null,
        property: propertyAddress ? { name: selectedProperty?.name || '', address: propertyAddress, unit_number: String(unitsById[Number(form.unitId)]?.unit_number || '') } : null,
        contract: originalContract,
      })
    : null;

  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Preparing the contract wizard…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Documents / Lease Agreements</p>
          <h2 className="mt-1 font-display text-2xl text-charcoal md:text-3xl">
            {editId ? 'Edit Draft Agreement' : renewalId || isRenewal ? 'Renew Lease Agreement' : 'Create New Lease Agreement'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">All legal wording comes from management-approved templates.</p>
        </div>
        <PremiumButton variant="secondary" size="sm" onClick={() => navigate('/contracts')}>Back to agreements</PremiumButton>
      </div>

      {success && <PageBanner message={success} onDismiss={() => setSuccess('')} />}
      {loadError && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{loadError}</div>}
      {saveError && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{saveError}</div>}

      <StepIndicator steps={STEPS} current={step} furthest={furthest} onSelect={setStep} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="space-y-5">
          {step === 0 && (
            <Section title="Step 1 — Select Property" description="Choose the property and the specific rental unit this agreement covers.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Property" required error={errors.propertyId}>
                  <Select
                    value={form.propertyId}
                    onChange={(value) => { set('propertyId', value); set('unitId', ''); }}
                    options={properties}
                    placeholder="Choose a property"
                    error={errors.propertyId}
                  />
                </Field>
                <Field label="Rental Unit" required error={errors.unitId}>
                  <Select
                    value={form.unitId}
                    onChange={(value) => set('unitId', value)}
                    options={availableUnits}
                    placeholder={form.propertyId ? 'Choose a unit' : 'Choose a property first'}
                    error={errors.unitId}
                  />
                </Field>
              </div>
              {selectedProperty && (
                <div className="mt-4 rounded-xl bg-ivory p-4 text-sm">
                  <p className="font-semibold text-charcoal">{selectedProperty.name}</p>
                  <p className="mt-1 text-gray-600">{propertyAddress || 'No address captured on the property record.'}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {[selectedProperty.property_type, selectedProperty.size_sqm && `${selectedProperty.size_sqm} m²`, selectedProperty.rooms && `${selectedProperty.rooms} rooms`]
                      .filter(Boolean).join(' · ') || 'Type and size not captured'}
                  </p>
                </div>
              )}
            </Section>
          )}

          {step === 1 && (
            <Section title="Step 2 — Select Tenant" description="Select a registered tenant or add a new one to this unit.">
              <Field label="Tenant" required error={errors.tenantId}>
                <Select
                  value={form.tenantId}
                  onChange={(value) => {
                    set('tenantId', value);
                    const tenant = tenantsById[Number(value)];
                    if (tenant) {
                      if (tenant.monthly_rent && !form.monthlyRent) set('monthlyRent', String(tenant.monthly_rent));
                      if (tenant.rent_due_day) set('dueDay', String(tenant.rent_due_day));
                    }
                  }}
                  options={tenants}
                  placeholder="Choose a registered tenant"
                  error={errors.tenantId}
                />
              </Field>
              <button type="button" onClick={() => setNewTenantOpen(true)} className="mt-3 text-xs font-semibold text-gold hover:underline">
                + Add a new tenant directly
              </button>
              {selectedTenant && (
                <div className="mt-4 rounded-xl bg-ivory p-4 text-sm">
                  <p className="font-semibold text-charcoal">{selectedTenant.name}</p>
                  <p className="mt-1 text-gray-600">{[selectedTenant.email, selectedTenant.phone].filter(Boolean).join(' · ')}</p>
                  <p className="mt-1 text-xs text-gray-500">ID / Passport: {selectedTenant.id_number || 'not captured'}</p>
                </div>
              )}
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Field label="Additional tenants / co-tenants" hint="One name per line">
                  <TextArea value={form.additionalTenants} onChange={(value) => set('additionalTenants', value)} rows={3} />
                </Field>
                <Field label="Emergency contact name">
                  <TextInput value={form.emergencyName} onChange={(value) => set('emergencyName', value)} />
                </Field>
                <Field label="Emergency contact number">
                  <TextInput value={form.emergencyPhone} onChange={(value) => set('emergencyPhone', value)} />
                </Field>
              </div>
            </Section>
          )}

          {step === 2 && (
            <>
              <Section title="Step 3 — Agreement Details">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Agreement date" required error={errors.agreementDate}>
                    <TextInput type="date" value={form.agreementDate} onChange={(value) => set('agreementDate', value)} error={errors.agreementDate} />
                  </Field>
                  <Field label="Commencement date" required error={errors.commencementDate}>
                    <TextInput type="date" value={form.commencementDate} onChange={(value) => set('commencementDate', value)} error={errors.commencementDate} />
                  </Field>
                  <Field label="Termination date" required error={errors.terminationDate}>
                    <TextInput type="date" value={form.terminationDate} onChange={(value) => set('terminationDate', value)} error={errors.terminationDate} />
                  </Field>
                  <Field label="Lease type">
                    <select value={form.leaseType} onChange={(event) => set('leaseType', event.target.value)} className={inputClass}>
                      <option>Fixed-term</option>
                      <option>Month-to-month</option>
                    </select>
                  </Field>
                  <Field label="Lease duration">
                    <TextInput value={form.duration} onChange={(value) => set('duration', value)} />
                  </Field>
                  <Field label="Notice period">
                    <TextInput value={form.noticePeriod} onChange={(value) => set('noticePeriod', value)} placeholder="e.g. 1 month" />
                  </Field>
                  <Field label="Occupation date">
                    <TextInput type="date" value={form.occupationDate} onChange={(value) => set('occupationDate', value)} />
                  </Field>
                  <Field label="Renewal option">
                    <TextInput value={form.renewalOption} onChange={(value) => set('renewalOption', value)} />
                  </Field>
                </div>
              </Section>

              <Section title="Rental Amount & Payment Terms">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Monthly rental (ZAR)" required error={errors.monthlyRent}>
                    <TextInput type="number" min="0" value={form.monthlyRent} onChange={(value) => set('monthlyRent', value)} error={errors.monthlyRent} />
                  </Field>
                  <Field label="Rental due day" required error={errors.dueDay} hint="Between 1 and 28">
                    <TextInput type="number" min="1" max="28" value={form.dueDay} onChange={(value) => set('dueDay', value)} error={errors.dueDay} />
                  </Field>
                  <Field label="Payment frequency">
                    <select value={form.frequency} onChange={(event) => set('frequency', event.target.value)} className={inputClass}>
                      <option>Monthly</option>
                      <option>Weekly</option>
                      <option>Bi-weekly</option>
                    </select>
                  </Field>
                  <Field label="Deposit amount (ZAR)" required error={errors.depositAmount}>
                    <TextInput type="number" min="0" value={form.depositAmount} onChange={(value) => set('depositAmount', value)} error={errors.depositAmount} />
                  </Field>
                  <Field label="Deposit due date">
                    <TextInput type="date" value={form.depositDueDate} onChange={(value) => set('depositDueDate', value)} />
                  </Field>
                  <Field label="Deposit payment status">
                    <select value={form.depositStatus} onChange={(event) => set('depositStatus', event.target.value)} className={inputClass}>
                      <option value="">Select…</option>
                      <option>Outstanding</option>
                      <option>Received</option>
                      <option>Held</option>
                      <option>Not required</option>
                    </select>
                  </Field>
                  <Field label="Additional charges">
                    <TextInput value={form.additionalCharges} onChange={(value) => set('additionalCharges', value)} />
                  </Field>
                  <Field label="Utilities included">
                    <TextInput value={form.utilitiesIncluded} onChange={(value) => set('utilitiesIncluded', value)} />
                  </Field>
                  <Field label="Utilities excluded">
                    <TextInput value={form.utilitiesExcluded} onChange={(value) => set('utilitiesExcluded', value)} />
                  </Field>
                  <Field label="Late payment terms">
                    <TextArea value={form.latePaymentTerms} onChange={(value) => set('latePaymentTerms', value)} rows={2} />
                  </Field>
                  <Field label="Rent escalation %">
                    <TextInput type="number" min="0" value={form.escalationPercentage} onChange={(value) => set('escalationPercentage', value)} />
                  </Field>
                  <Field label="Escalation effective date">
                    <TextInput type="date" value={form.escalationDate} onChange={(value) => set('escalationDate', value)} />
                  </Field>
                </div>
              </Section>

              <Section title="Payment Details" description="Banking details are configurable per agreement and are never hardcoded.">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Bank name"><TextInput value={form.bankName} onChange={(value) => set('bankName', value)} /></Field>
                  <Field label="Account holder"><TextInput value={form.accountHolder} onChange={(value) => set('accountHolder', value)} /></Field>
                  <Field label="Account number"><TextInput value={form.accountNumber} onChange={(value) => set('accountNumber', value)} /></Field>
                  <Field label="Account type"><TextInput value={form.accountType} onChange={(value) => set('accountType', value)} /></Field>
                  <Field label="Branch code"><TextInput value={form.branchCode} onChange={(value) => set('branchCode', value)} /></Field>
                  <Field label="Payment reference"><TextInput value={form.paymentReference} onChange={(value) => set('paymentReference', value)} /></Field>
                  <Field label="Alternative payment methods"><TextInput value={form.alternativeMethods} onChange={(value) => set('alternativeMethods', value)} /></Field>
                  <Field label="Cash payment instructions"><TextInput value={form.cashInstructions} onChange={(value) => set('cashInstructions', value)} /></Field>
                </div>
              </Section>
            </>
          )}

          {step === 3 && (
            <>
              <Section title="Step 4 — Property & Occupancy Conditions">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Maximum occupants"><TextInput type="number" min="0" value={form.maxOccupants} onChange={(value) => set('maxOccupants', value)} /></Field>
                  <Field label="Authorized occupants"><TextInput value={form.authorizedOccupants} onChange={(value) => set('authorizedOccupants', value)} /></Field>
                  <Field label="Permitted residential use"><TextInput value={form.permittedUse} onChange={(value) => set('permittedUse', value)} /></Field>
                  <Field label="Visitors policy"><TextInput value={form.visitorsPolicy} onChange={(value) => set('visitorsPolicy', value)} /></Field>
                  <Field label="Quiet hours"><TextInput value={form.quietHours} onChange={(value) => set('quietHours', value)} /></Field>
                  <Field label="Smoking policy"><TextInput value={form.smokingPolicy} onChange={(value) => set('smokingPolicy', value)} /></Field>
                  <Field label="Pet policy"><TextInput value={form.petPolicy} onChange={(value) => set('petPolicy', value)} /></Field>
                  <Field label="Parking arrangements"><TextInput value={form.parking} onChange={(value) => set('parking', value)} /></Field>
                  <Field label="Shared facilities"><TextInput value={form.sharedFacilities} onChange={(value) => set('sharedFacilities', value)} /></Field>
                  <Field label="Electricity arrangements"><TextInput value={form.electricity} onChange={(value) => set('electricity', value)} /></Field>
                  <Field label="Water arrangements"><TextInput value={form.water} onChange={(value) => set('water', value)} /></Field>
                  <Field label="Waste disposal"><TextInput value={form.wasteDisposal} onChange={(value) => set('wasteDisposal', value)} /></Field>
                  <Field label="Security responsibilities"><TextInput value={form.security} onChange={(value) => set('security', value)} /></Field>
                  <Field label="Keys and access"><TextInput value={form.keysAccess} onChange={(value) => set('keysAccess', value)} /></Field>
                  <Field label="Property condition"><TextArea value={form.propertyCondition} onChange={(value) => set('propertyCondition', value)} rows={2} /></Field>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Furniture and appliances included"><TextArea value={form.furnitureAppliances} onChange={(value) => set('furnitureAppliances', value)} rows={2} /></Field>
                  <Field label="Inventory checklist"><TextArea value={form.inventoryChecklist} onChange={(value) => set('inventoryChecklist', value)} rows={2} /></Field>
                </div>
                <div className="mt-4">
                  <Field label="Custom property rules" hint="One rule per line">
                    <TextArea value={form.customRules} onChange={(value) => set('customRules', value)} rows={4} />
                  </Field>
                </div>
              </Section>

              {form.contractType === 'renewal' && (
                <Section title="Renewal Terms" description="These values fill the renewal agreement template.">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Original contract reference"><TextInput value={form.originalReference} onChange={(value) => set('originalReference', value)} /></Field>
                    <Field label="Original start date"><TextInput type="date" value={form.originalStartDate} onChange={(value) => set('originalStartDate', value)} /></Field>
                    <Field label="Original end date"><TextInput type="date" value={form.originalEndDate} onChange={(value) => set('originalEndDate', value)} /></Field>
                    <Field label="Previous monthly rent"><TextInput type="number" min="0" value={form.previousMonthlyRent} onChange={(value) => set('previousMonthlyRent', value)} /></Field>
                    <Field label="Existing deposit"><TextInput type="number" min="0" value={form.existingDeposit} onChange={(value) => set('existingDeposit', value)} /></Field>
                    <Field label="Additional deposit required"><TextInput type="number" min="0" value={form.additionalDeposit} onChange={(value) => set('additionalDeposit', value)} /></Field>
                    <Field label="Total renewed deposit"><TextInput type="number" min="0" value={form.renewedDeposit} onChange={(value) => set('renewedDeposit', value)} /></Field>
                    <Field label="Additional deposit due date"><TextInput type="date" value={form.additionalDepositDueDate} onChange={(value) => set('additionalDepositDueDate', value)} /></Field>
                    <Field label="Renewal duration"><TextInput value={form.renewalDuration} onChange={(value) => set('renewalDuration', value)} /></Field>
                    <Field label="Renewal type"><TextInput value={form.renewalType} onChange={(value) => set('renewalType', value)} /></Field>
                    <Field label="Inspection report reference"><TextInput value={form.inspectionReportReference} onChange={(value) => set('inspectionReportReference', value)} /></Field>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Updated utility terms"><TextArea value={form.updatedUtilities} onChange={(value) => set('updatedUtilities', value)} rows={2} /></Field>
                    <Field label="Updated payment method"><TextArea value={form.updatedPaymentMethod} onChange={(value) => set('updatedPaymentMethod', value)} rows={2} /></Field>
                    <Field label="Updated occupancy terms"><TextArea value={form.updatedOccupancy} onChange={(value) => set('updatedOccupancy', value)} rows={2} /></Field>
                    <Field label="Updated house rules"><TextArea value={form.updatedHouseRules} onChange={(value) => set('updatedHouseRules', value)} rows={2} /></Field>
                    <Field label="Updated maintenance arrangements"><TextArea value={form.updatedMaintenance} onChange={(value) => set('updatedMaintenance', value)} rows={2} /></Field>
                    <Field label="Updated notice period"><TextInput value={form.updatedNoticePeriod} onChange={(value) => set('updatedNoticePeriod', value)} /></Field>
                    <Field label="Other conditions"><TextArea value={form.updatedSpecialConditions} onChange={(value) => set('updatedSpecialConditions', value)} rows={2} /></Field>
                    <Field label="Additional condition notes"><TextArea value={form.conditionNotes} onChange={(value) => set('conditionNotes', value)} rows={2} /></Field>
                  </div>
                </Section>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Section title="Step 5 — Approved Template" description="Choose the management-approved wording. Platform-authored clauses are not permitted.">
                <Field label="Contract template" required error={errors.templateId}>
                  <TemplatePicker
                    templates={templates}
                    selectedId={form.templateId}
                    filter={form.contractType}
                    onSelect={(template) => set('templateId', String(template.id))}
                  />
                </Field>
                {selectedTemplate?.approval_status !== 'approved' && selectedTemplate && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <span>This template is pending legal approval. You may save a draft, but the agreement cannot be issued until an approved template is loaded.</span>
                  </div>
                )}
              </Section>

              <Section title="Additional Information" description="Operational notes only — do not add legal wording here.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Additional tenant name (signature block)"><TextInput value={form.additionalTenantName} onChange={(value) => set('additionalTenantName', value)} /></Field>
                  <Field label="Custom terms (subject to legal review)"><TextArea value={form.customTerms} onChange={(value) => set('customTerms', value)} rows={3} /></Field>
                </div>
              </Section>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
            <PremiumButton variant="secondary" onClick={back} disabled={step === 0} icon={<ArrowLeft size={15} />}>Back</PremiumButton>
            <div className="flex flex-wrap gap-2">
              <PremiumButton variant="secondary" onClick={() => setPreviewOpen(true)} icon={<Eye size={15} />}>Preview</PremiumButton>
              {step < STEPS.length - 1 ? (
                <PremiumButton onClick={next} icon={<ArrowRight size={15} />}>Continue</PremiumButton>
              ) : (
                <PremiumButton onClick={() => void save()} disabled={saving} icon={<Check size={15} />}>
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Agreement'}
                </PremiumButton>
              )}
            </div>
          </div>
        </div>

        <aside className="no-print hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Live preview</p>
            {rendered ? (
              <div className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-xl border border-gray-200">
                <ContractDocument
                  title={rendered.title}
                  blocks={rendered.blocks}
                  meta={rendered.meta}
                  showPendingWarning={rendered.pendingApproval}
                  compact
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                Choose an approved template in step 5 to see the live document preview.
              </div>
            )}
          </div>
        </aside>
      </div>

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Contract Preview" subtitle="Approved template">
        {rendered ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Page breaks are finalised when you download the PDF from the saved agreement.</p>
            <ContractDocument title={rendered.title} blocks={rendered.blocks} meta={rendered.meta} showPendingWarning={rendered.pendingApproval} />
          </div>
        ) : (
          <p className="text-sm text-gray-600">No template selected yet.</p>
        )}
      </Modal>

      <Modal isOpen={newTenantOpen} onClose={() => setNewTenantOpen(false)} title="Add New Tenant" subtitle="Linked to the selected unit">
        <div className="space-y-4">
          {newTenantError && <div role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{newTenantError}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full legal name" required><TextInput value={newTenant.name} onChange={(value) => setNewTenant({ ...newTenant, name: value })} /></Field>
            <Field label="Email" required><TextInput type="email" value={newTenant.email} onChange={(value) => setNewTenant({ ...newTenant, email: value })} /></Field>
            <Field label="Password (min 8 characters)" required><TextInput type="password" value={newTenant.password} onChange={(value) => setNewTenant({ ...newTenant, password: value })} /></Field>
            <Field label="Contact number"><TextInput value={newTenant.phone} onChange={(value) => setNewTenant({ ...newTenant, phone: value })} /></Field>
            <Field label="ID / Passport number"><TextInput value={newTenant.id_number} onChange={(value) => setNewTenant({ ...newTenant, id_number: value })} /></Field>
            <Field label="Lease start"><TextInput type="date" value={newTenant.lease_start} onChange={(value) => setNewTenant({ ...newTenant, lease_start: value })} /></Field>
            <Field label="Lease end"><TextInput type="date" value={newTenant.lease_end} onChange={(value) => setNewTenant({ ...newTenant, lease_end: value })} /></Field>
            <Field label="Monthly rent"><TextInput type="number" min="0" value={newTenant.monthlyRent} onChange={(value) => setNewTenant({ ...newTenant, monthlyRent: value })} /></Field>
          </div>
          <PremiumButton onClick={() => void createNewTenant()} disabled={newTenantBusy} icon={<Save size={15} />}>
            {newTenantBusy ? 'Creating…' : 'Create Tenant'}
          </PremiumButton>
        </div>
      </Modal>
    </div>
  );
}
