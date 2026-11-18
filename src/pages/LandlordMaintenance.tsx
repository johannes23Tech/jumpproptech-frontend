import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Wrench, Users, DollarSign, FileText, CheckCircle, Plus, ShieldCheck, X, Clock } from 'lucide-react';
import PremiumButton from '../components/PremiumButton';
import TiltCard from '../components/TiltCard';
import { PageBanner, SubmitButton } from '../components/FormFeedback';

type Ticket = {
  id: number;
  category: string;
  description: string;
  priority: string;
  severity: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  photo: string | null;
  unit_number: string;
  tenant_name: string;
  technician_id: number | null;
  technician_name: string | null;
  actual_cost: number | null;
  completion_notes: string | null;
  resolved_at: string | null;
  created_at: string;
};

type StaffMember = {
  id: number;
  full_name: string;
  staff_role: string;
};

type Expense = {
  id: number;
  category: string;
  amount: number;
  expense_date: string;
  description: string;
  property_name: string;
  supplier_name: string | null;
  supplier_trade: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by_name: string | null;
  approved_at: string | null;
  reversed_by_name: string | null;
  reversed_at: string | null;
  reversal_reason: string | null;
  attachment_url: string | null;
};

export default function LandlordMaintenance() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [data, setData] = useState<{ tickets: Ticket[], staff: StaffMember[] }>({ tickets: [], staff: [] });
  const [financeData, setFinanceData] = useState<{ expenses: Expense[], total_rent: number }>({ expenses: [], total_rent: 0 });
  const [properties, setProperties] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Expense form
  const [expProperty, setExpProperty] = useState('');
  const [expSupplier, setExpSupplier] = useState('');
  const [expCategory, setExpCategory] = useState('Maintenance');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expDesc, setExpDesc] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentError, setAttachmentError] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Expense reversal
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reverseExpenseId, setReverseExpenseId] = useState<number | null>(null);
  const [reverseReason, setReverseReason] = useState('');

  // Supplier form
  const [sName, setSName] = useState('');
  const [sTrade, setSTrade] = useState('');
  const [sContact, setSContact] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');

  // Resolve form
  const [resolveTicketId, setResolveTicketId] = useState<number | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveCost, setResolveCost] = useState('');

  // Approve/reject form
  const [approveExpenseId, setApproveExpenseId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Technician assign form
  const [assignTicketId, setAssignTicketId] = useState<number | null>(null);
  const [assignTechId, setAssignTechId] = useState<number | null>(null);
  const [assignSeverity, setAssignSeverity] = useState('Routine');

  const fetchData = async () => {
    try {
      const [maintRes, finRes, propRes, supRes] = await Promise.all([
        api.getMaintenanceData(),
        api.getExpenses(),
        api.getProperties(),
        api.getSuppliers(),
      ]);
      setData(maintRes);
      setFinanceData(finRes);
      setProperties(propRes);
      setSuppliers(supRes);
      if (propRes.length > 0) setExpProperty(propRes[0].id.toString());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalExpenses = financeData.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const approvedExpenses = financeData.expenses
    .filter(e => e.approval_status === 'approved' && !e.reversed_at)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const pendingExpenses = financeData.expenses.filter(e => e.approval_status === 'pending');
  const netIncome = financeData.total_rent - approvedExpenses;

  const handleAssignTechnician = async () => {
    if (assignTicketId === null) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.assignTechnician({
        ticket_id: assignTicketId,
        technician_id: assignTechId ?? undefined,
        severity: assignSeverity,
      });
      setIsContractorModalOpen(false);
      setAssignTicketId(null); setAssignTechId(null); setAssignSeverity('Routine');
      setSuccessMessage('Ticket assigned to internal technician.');
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The ticket could not be assigned.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (resolveTicketId === null) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.resolveMaintenance(resolveTicketId, resolveNotes);
      if (resolveCost !== '') {
        await api.updateMaintenanceCostNotes({
          ticket_id: resolveTicketId,
          actual_cost: Number(resolveCost),
          completion_notes: resolveNotes,
        });
      }
      setIsResolveModalOpen(false);
      setResolveTicketId(null); setResolveNotes(''); setResolveCost('');
      setSuccessMessage('Ticket marked as Resolved.');
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The ticket could not be resolved.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSupplier = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.addSupplier({
        name: sName, trade: sTrade, contact_name: sContact, phone: sPhone, email: sEmail,
      });
      setIsContractorModalOpen(false);
      setSName(''); setSTrade(''); setSContact(''); setSPhone(''); setSEmail('');
      setSuccessMessage('Supplier saved.');
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The supplier could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!window.confirm('Remove this supplier?')) return;
    try {
      await api.deleteSupplier(id);
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The supplier could not be removed.');
    }
  };

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (attachmentError) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      let uploadedAttachment = attachmentUrl;
      if (attachmentFile) {
        setUploadingAttachment(true);
        uploadedAttachment = await api.uploadDocument(attachmentFile);
        setAttachmentUrl(uploadedAttachment);
      }
      await api.addExpense({
        property_id: Number(expProperty),
        supplier_id: expSupplier ? Number(expSupplier) : undefined,
        category: expCategory,
        amount: Number(expAmount),
        expense_date: expDate,
        description: expDesc,
        attachment_url: uploadedAttachment || undefined,
      });
      setIsExpenseModalOpen(false);
      setExpAmount(''); setExpDesc(''); setAttachmentFile(null); setAttachmentUrl('');
      setSuccessMessage('Expense submitted for approval.');
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The expense could not be saved.');
    } finally {
      setUploadingAttachment(false);
      setSubmitting(false);
    }
  };

  const handleReverseExpense = async () => {
    if (reverseExpenseId === null) return;
    if (reverseReason.trim().length < 3) {
      setSubmitError('A reversal reason is required.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.reverseExpense(reverseExpenseId, reverseReason);
      setIsReverseModalOpen(false);
      setReverseExpenseId(null); setReverseReason('');
      setSuccessMessage('Expense reversed. A corrective expense can be logged if needed.');
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The expense could not be reversed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveExpense = async () => {
    if (approveExpenseId === null) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.approveExpense(approveExpenseId);
      setIsApproveModalOpen(false);
      setApproveExpenseId(null);
      setSuccessMessage('Expense approved.');
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The expense could not be approved.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectExpense = async () => {
    if (approveExpenseId === null) return;
    if (rejectReason.trim().length < 3) {
      setSubmitError('A rejection reason is required.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.rejectExpense(approveExpenseId, rejectReason);
      setIsApproveModalOpen(false);
      setApproveExpenseId(null); setRejectReason('');
      setSuccessMessage('Expense rejected.');
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The expense could not be rejected.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusStyles: Record<string, string> = {
    Open: 'bg-warning/10 text-warning',
    'In Progress': 'bg-blue-100 text-blue-700',
    Resolved: 'bg-success/10 text-success',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {successMessage && <PageBanner message={successMessage} onDismiss={() => setSuccessMessage('')} />}
      {submitError && <PageBanner message={submitError} type="error" onDismiss={() => setSubmitError('')} />}
      <h2 className="font-display text-2xl font-bold">Maintenance & Finance Hub</h2>

      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'tickets', label: 'Work Orders', icon: Wrench },
          { id: 'suppliers', label: 'Suppliers', icon: Users },
          { id: 'finance', label: 'Finance & Expenses', icon: DollarSign },
          { id: 'reports', label: 'Reports', icon: FileText },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === tab.id ? 'bg-gold text-black shadow-gold' : 'text-gray-500 hover:bg-gray-100'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-premium p-6">

        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-lg font-bold">Work Orders</h3>
              <PremiumButton onClick={() => setActiveTab('tickets')} icon={<Plus size={14} />} size="sm">
                Refresh
              </PremiumButton>
            </div>
            {data.tickets.length === 0 && <p className="text-gray-500">No work orders right now.</p>}

            {data.tickets.map(t => (
              <div key={t.id} className={`flex flex-col md:flex-row gap-4 p-4 border rounded-xl transition-colors ${t.status === 'Resolved' ? 'bg-gray-50 border-gray-200 opacity-75' : 'border-gray-200'}`}>
                <div className="w-full md:w-48 h-32 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {t.photo && <img src={t.photo} alt="Issue" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{t.category} <span className="text-sm text-gray-500 font-normal">- Unit {t.unit_number}</span></p>
                      <p className="text-sm text-gray-600">{t.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Reported by: {t.tenant_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${t.priority === 'Emergency' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                        {t.priority}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${statusStyles[t.status]}`}>
                        {t.status}
                      </span>
                      {t.technician_name && (
                        <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-indigo/10 text-indigo-700">
                          Tech: {t.technician_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-3 items-center">
                    {t.status !== 'Resolved' ? (
                      <>
                        {t.technician_id ? (
                          <span className="text-xs font-bold text-gray-600">
                            Assigned to {t.technician_name} ({t.severity})
                          </span>
                        ) : (
                          <>
                            <select
                              value={assignTechId === null ? '' : String(assignTechId)}
                              onChange={(e) => setAssignTechId(e.target.value ? Number(e.target.value) : null)}
                              className="border border-gray-300 rounded-lg p-2 text-sm bg-white focus:border-gold outline-none"
                            >
                              <option value="">-- Assign Technician --</option>
                              {data.staff.map(s => (
                                <option key={s.id} value={s.id}>{s.full_name} ({s.staff_role.replace('_', ' ')})</option>
                              ))}
                            </select>
                            <select value={assignSeverity} onChange={(e) => setAssignSeverity(e.target.value)} className="ml-2 border border-gray-300 rounded-lg p-2 text-sm bg-white focus:border-gold outline-none">
                              <option value="Routine">Routine</option>
                              <option value="Emergency">Emergency</option>
                            </select>
                            <button
                              onClick={() => { setAssignTicketId(t.id); setIsContractorModalOpen(true); }}
                              className="bg-black text-gold px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90"
                            >
                              Assign
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { setResolveTicketId(t.id); setResolveNotes(''); setResolveCost(''); setIsResolveModalOpen(true); }}
                          className="bg-success text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 ml-auto transition-opacity"
                        >
                          <CheckCircle size={16} /> Mark Resolved
                        </button>
                      </>
                    ) : (
                      <div className="text-sm text-success font-bold flex items-center gap-2 py-2">
                        <CheckCircle size={16} /> Resolved{t.completion_notes ? ` — ${t.completion_notes}` : ''}
                        {t.actual_cost !== null && t.actual_cost > 0 && (
                          <span className="ml-2 text-gray-600">Cost: R {t.actual_cost}</span>
                        )}
                        {t.resolved_at && (
                          <span className="ml-2 text-xs text-gray-500">{new Date(t.resolved_at).toLocaleDateString('en-ZA')}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-lg font-bold">Approved Suppliers</h3>
              <PremiumButton onClick={() => { setSubmitError(''); setSuccessMessage(''); setSName(''); setSTrade(''); setSContact(''); setSPhone(''); setSEmail(''); setIsContractorModalOpen(true); }} icon={<Plus size={14} />} size="sm">
                Add Supplier
              </PremiumButton>
            </div>

            {suppliers.length === 0 && <p className="text-gray-500">No suppliers yet.</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suppliers.map(s => (
                <div key={s.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-premium transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-lg">{s.name}</p>
                      {s.trade && <p className="text-sm text-gold font-semibold">{s.trade}</p>}
                    </div>
                    <span className={`bg-${s.is_active ? 'success' : 'gray'}/10 text-${s.is_active ? 'success' : 'gray-600'} font-bold px-2 py-1 rounded text-sm`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {s.contact_name && <p className="text-sm text-gray-600 mb-1">{s.contact_name}</p>}
                  {s.phone && <p className="text-sm text-gray-600 mb-1">Phone: {s.phone}</p>}
                  {s.email && <p className="text-sm text-gray-600">Email: {s.email}</p>}
                  <button
                    onClick={() => handleDeleteSupplier(s.id)}
                    className="mt-3 text-xs text-danger font-bold underline hover:text-danger/80"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TiltCard className="bg-gradient-to-br from-success/5 to-white border-success/20">
                <div className="flex items-center gap-2 text-success font-bold mb-1">
                  <ShieldCheck size={18} /> Approved Expenses
                </div>
                <p className="font-display text-3xl font-bold text-success">R {approvedExpenses}</p>
              </TiltCard>

              <TiltCard className="bg-gradient-to-br from-warning/5 to-white border-warning/20">
                <div className="flex items-center gap-2 text-warning font-bold mb-1">
                  <Clock size={18} /> Pending Approval
                </div>
                <p className="font-display text-3xl font-bold text-warning">{pendingExpenses.length}</p>
              </TiltCard>

              <TiltCard className="bg-gradient-to-br from-charcoal to-black border-gray-800 text-ivory">
                <div className="flex items-center gap-2 text-gold font-bold mb-1">
                  <DollarSign size={18} /> Net Income
                </div>
                <p className={`font-display text-3xl font-bold ${netIncome >= 0 ? 'text-gold-light' : 'text-danger'}`}>R {netIncome}</p>
              </TiltCard>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <h3 className="font-display text-lg font-bold">Expense Ledger</h3>
              <PremiumButton onClick={() => { setSubmitError(''); setSuccessMessage(''); setExpProperty(''); setExpSupplier(''); setExpCategory('Maintenance'); setExpAmount(''); setExpDesc(''); setExpDate(new Date().toISOString().slice(0, 10)); setAttachmentFile(null); setAttachmentUrl(''); setAttachmentError(''); setIsExpenseModalOpen(true); }} icon={<Plus size={14} />} size="sm">
                Log Expense
              </PremiumButton>
            </div>

            <div className="space-y-3">
              {financeData.expenses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No expenses logged yet.</p>
              ) : (
                financeData.expenses.map(e => (
                  <div key={e.id} className="flex flex-col md:flex-row gap-3 p-4 bg-ivory rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="font-bold text-black">{e.category} - {e.property_name}</p>
                      <p className="text-xs text-gray-500">{e.description} • {e.expense_date}</p>
                      {e.supplier_name && <p className="text-xs text-gray-500">Supplier: {e.supplier_name}</p>}
                      {e.attachment_url && (
                        <a href={e.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 underline">
                          View attachment
                        </a>
                      )}
                      {e.reversed_at && (
                        <p className="text-xs text-danger">
                          Reversed by {e.reversed_by_name} on {String(e.reversed_at).slice(0, 10)}: {e.reversal_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
                      <div className={`text-xs uppercase font-bold px-2 py-1 rounded-full ${
                        e.reversed_at ? 'bg-gray-200 text-gray-600 line-through' :
                        e.approval_status === 'approved' ? 'bg-success/10 text-success' :
                        e.approval_status === 'rejected' ? 'bg-danger/10 text-danger' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {e.reversed_at ? 'Reversed' : e.approval_status.charAt(0).toUpperCase() + e.approval_status.slice(1)}
                      </div>
                      <p className="font-bold text-danger">- R {e.amount}</p>
                      {e.approval_status === 'pending' && !e.reversed_at && (
                        <button
                          onClick={() => { setApproveExpenseId(e.id); setIsApproveModalOpen(true); }}
                          className="text-xs font-bold bg-black text-gold px-2 py-1 rounded hover:opacity-90"
                        >
                          Approve / Reject
                        </button>
                      )}
                      {e.approval_status === 'approved' && !e.reversed_at && (
                        <button
                          onClick={() => { setReverseExpenseId(e.id); setReverseReason(''); setSubmitError(''); setIsReverseModalOpen(true); }}
                          className="text-xs font-bold border border-danger text-danger px-2 py-1 rounded hover:bg-danger/10"
                        >
                          Reverse
                        </button>
                      )}
                      {e.approval_status === 'rejected' && e.approved_by_name && (
                        <p className="text-xs text-danger">Rejected by {e.approved_by_name}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && <div className="text-center p-8 text-gray-500">Downloadable PDF Reports coming soon.</div>}
      </div>

      {/* Assign Technician Modal */}
      {isContractorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Assign Internal Technician</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAssignTechnician(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Technician</label>
                <select required value={assignTechId ?? ''} onChange={(e) => setAssignTechId(e.target.value ? Number(e.target.value) : null)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none">
                  <option value="">-- Select technician --</option>
                  {data.staff.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.staff_role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Severity</label>
                <select value={assignSeverity} onChange={(e) => setAssignSeverity(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none">
                  <option value="Routine">Routine (1-5 days)</option>
                  <option value="Emergency">Emergency (24h)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsContractorModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <SubmitButton loading={submitting} loadingText="Assigning..." error={submitError}>
                  Assign Technician
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal (reuses contractor modal UI) */}
      {isContractorModalOpen && assignTicketId === null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Add Supplier</h3>
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supplier Name</label>
                <input type="text" required value={sName} onChange={(e) => setSName(e.target.value)} className="w-full border p-3 rounded-lg focus:border-gold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trade / Specialty</label>
                <input type="text" value={sTrade} onChange={(e) => setSTrade(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none" placeholder="e.g. Plumbing" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Name</label>
                <input type="text" value={sContact} onChange={(e) => setSContact(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                <input type="tel" value={sPhone} onChange={(e) => setSPhone(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input type="email" value={sEmail} onChange={(e) => setSEmail(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsContractorModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <SubmitButton loading={submitting} loadingText="Saving supplier..." error={submitError}>
                  Save Supplier
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Ticket Modal */}
      {isResolveModalOpen && resolveTicketId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Resolve Work Order</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleResolve(); }} className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Work order</p>
                <p className="font-bold text-black">{data.tickets.find(t => t.id === resolveTicketId)?.category}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Completion Notes (required)</label>
                <textarea required value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} className="w-full border p-3 rounded-lg h-24 focus:border-gold outline-none" placeholder="Describe the work completed..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Actual Cost (R, optional)</label>
                <input type="number" min="0" step="0.01" value={resolveCost} onChange={(e) => setResolveCost(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsResolveModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <SubmitButton loading={submitting} loadingText="Resolving..." error={submitError}>
                  Mark Resolved
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Log Expense</h3>
            <p className="text-xs text-gray-500 mb-4">Expenses require one-manager approval before they count as approved spend.</p>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property</label>
                <select required value={expProperty} onChange={(e) => setExpProperty(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none">
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supplier (optional)</label>
                <select value={expSupplier} onChange={(e) => setExpSupplier(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none">
                  <option value="">-- Select supplier --</option>
                  {suppliers.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.trade})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none">
                    <option>Maintenance</option><option>Repairs</option><option>Utilities</option><option>Rates & Taxes</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (R)</label>
                  <input type="number" required min="0" step="0.01" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="w-full border p-3 rounded-lg focus:border-gold outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input type="date" required value={expDate} onChange={(e) => setExpDate(e.target.value)} className="w-full border p-3 rounded-lg focus:border-gold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <input type="text" required value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="e.g. Geyser repair at Unit A1" className="w-full border p-3 rounded-lg focus:border-gold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Attachment (optional, PDF/image, max 10 MB)</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setAttachmentError('');
                    if (file && file.size > 10 * 1024 * 1024) {
                      setAttachmentError('The attachment must be 10 MB or smaller.');
                      setAttachmentFile(null);
                      e.target.value = '';
                      return;
                    }
                    setAttachmentFile(file);
                  }}
                  className="w-full border p-2 rounded-lg bg-white text-sm file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-gold file:text-xs file:font-bold"
                />
                {attachmentUrl && <p className="mt-1 text-xs text-success">Attachment uploaded.</p>}
                {attachmentError && <p role="alert" className="mt-1 text-xs text-danger">{attachmentError}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <SubmitButton loading={submitting} loadingText="Saving expense..." error={submitError}>
                  Submit for Approval
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve / Reject Expense Modal */}
      {isApproveModalOpen && approveExpenseId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Approve or Reject Expense</h3>
            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50 mb-4">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">One-manager approval</p>
              <p className="font-bold text-black">{financeData.expenses.find(e => e.id === approveExpenseId)?.description}</p>
              <p className="text-xs text-gray-500">R {financeData.expenses.find(e => e.id === approveExpenseId)?.amount}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setIsApproveModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => handleApproveExpense()} disabled={submitting} className="flex-1 py-3 bg-success text-white font-bold hover:bg-success/90 disabled:opacity-50 rounded-lg transition-colors">
                Approve
              </button>
            </div>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rejection Reason</label>
              <textarea required minLength={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full border p-3 rounded-lg h-20 focus:border-gold outline-none" placeholder="Why is this expense rejected?" />
              <button onClick={() => handleRejectExpense()} disabled={submitting || rejectReason.trim().length < 3} className="mt-3 w-full py-3 bg-danger text-white font-bold hover:bg-danger/90 disabled:opacity-50 rounded-lg transition-colors">
                Reject Expense
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reverse Expense Modal */}
      {isReverseModalOpen && reverseExpenseId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Reverse Expense</h3>
            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50 mb-4">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Approved expense</p>
              <p className="font-bold text-black">{financeData.expenses.find(e => e.id === reverseExpenseId)?.description}</p>
              <p className="text-xs text-gray-500">R {financeData.expenses.find(e => e.id === reverseExpenseId)?.amount}</p>
            </div>
            <p className="text-xs text-gray-500 mb-3">The original record stays in the ledger and no longer counts as approved spend. Reversals cannot be undone — log a corrective expense instead.</p>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reversal Reason (required)</label>
            <textarea required minLength={3} value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} className="w-full border p-3 rounded-lg h-20 focus:border-gold outline-none" placeholder="Why is this expense being reversed?" />
            {submitError && <p role="alert" className="mt-2 text-sm text-danger">{submitError}</p>}
            <div className="flex gap-2 pt-4">
              <button type="button" onClick={() => setIsReverseModalOpen(false)} disabled={submitting} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={() => handleReverseExpense()} disabled={submitting || reverseReason.trim().length < 3} className="flex-1 py-3 bg-danger text-white font-bold hover:bg-danger/90 disabled:opacity-50 rounded-lg transition-colors">
                {submitting ? 'Reversing...' : 'Reverse Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
