import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/roles';
import { AlertCircle, Calendar, DollarSign, Plus, Trash2, Wallet } from 'lucide-react';
import Modal from '../components/Modal';
import PremiumButton from '../components/PremiumButton';
import { PageBanner } from '../components/FormFeedback';

type Budget = {
  id: number;
  property_id: number;
  property_name: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  period_start: string;
  period_end: string;
};

const money = (value: number | string): string =>
  `R ${Number(value).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatPeriod = (start: string, end: string): string => {
  const from = new Date(start).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
  const to = new Date(end).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
  return `${from} – ${to}`;
};

export default function Budgets() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'budgets.manage');

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [propertyId, setPropertyId] = useState('');
  const [category, setCategory] = useState('Maintenance');
  const [amount, setAmount] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const fetchData = async () => {
    try {
      const [budgetData, propertyData] = await Promise.all([api.getBudgets(), api.getProperties()]);
      setBudgets(Array.isArray(budgetData) ? budgetData : []);
      setProperties(propertyData);
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load budgets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const openModal = () => {
    setPropertyId(properties[0]?.id?.toString() ?? '');
    setCategory('Maintenance');
    setAmount('');
    const now = new Date();
    setPeriodStart(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
    setPeriodEnd(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      await api.addBudget({
        property_id: Number(propertyId),
        category,
        amount: Number(amount),
        period_start: periodStart,
        period_end: periodEnd,
      });
      setIsModalOpen(false);
      setToast({ message: 'Budget saved.', type: 'success' });
      await fetchData();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'The budget could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await api.deleteBudget(id);
      setToast({ message: 'Budget deleted.', type: 'success' });
      await fetchData();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'The budget could not be deleted.', type: 'error' });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading budgets...</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      {toast && <PageBanner message={toast.message} onDismiss={() => setToast(null)} />}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Budgets</h2>
          <p className="text-sm text-gray-500">Spend counts approved, non-reversed expenses inside the budget period.</p>
        </div>
        {canManage && (
          <PremiumButton onClick={openModal} icon={<Plus size={16} />}>
            Add Budget
          </PremiumButton>
        )}
      </div>

      {loadError ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger/20 bg-danger/10 p-5 text-danger sm:flex-row sm:items-center sm:justify-between">
          <span>{loadError}</span>
          <button type="button" onClick={() => { setLoading(true); void fetchData(); }} className="font-bold underline">
            Try again
          </button>
        </div>
      ) : budgets.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No budgets yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const pct = budget.amount > 0 ? Math.min(100, (budget.spent / budget.amount) * 100) : 0;
            const over = budget.remaining < 0;
            return (
              <div key={budget.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-bold">{budget.property_name}</h3>
                    <p className="text-xs text-gray-500">{budget.category}</p>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      aria-label="Delete budget"
                      onClick={() => void handleDelete(budget.id)}
                      className="text-gray-400 hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={13} />
                  {formatPeriod(budget.period_start, budget.period_end)}
                </div>

                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Budget</span>
                  <span className="font-display text-xl font-bold">{money(budget.amount)}</span>
                </div>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Spent</span>
                  <span className={`font-bold ${over ? 'text-danger' : 'text-gray-700'}`}>{money(budget.spent)}</span>
                </div>

                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${over ? 'bg-danger' : pct > 80 ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className={`mt-2 text-xs ${over ? 'font-bold text-danger' : 'text-gray-500'}`}>
                  {over ? `${money(Math.abs(budget.remaining))} over budget` : `${money(budget.remaining)} remaining`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { if (!submitting) setIsModalOpen(false); }}
        title="Add budget"
        subtitle="Per property and category"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property</label>
            <select required value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none">
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none">
              <option>Maintenance</option><option>Repairs</option><option>Utilities</option><option>Rates & Taxes</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Budget amount (R)</label>
            <input type="number" required min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border p-3 rounded-lg focus:border-gold outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Period start</label>
              <input type="date" required value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Period end</label>
              <input type="date" required value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="w-full border p-3 rounded-lg bg-white focus:border-gold outline-none" />
            </div>
          </div>
          {modalError && <p role="alert" className="text-sm text-danger">{modalError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-gold text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
