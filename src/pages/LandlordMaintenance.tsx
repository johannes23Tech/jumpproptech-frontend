import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Wrench, Users, DollarSign, FileText, CheckCircle, Plus, TrendingUp, TrendingDown } from 'lucide-react';

export default function LandlordMaintenance() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [data, setData] = useState<{ tickets: any[], contractors: any[] }>({ tickets: [], contractors: [] });
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  
  // Finance State
  const [financeData, setFinanceData] = useState<{ expenses: any[], total_rent: number }>({ expenses: [], total_rent: 0 });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  
  // Expense Form
  const [expProperty, setExpProperty] = useState('');
  const [expCategory, setExpCategory] = useState('Maintenance');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expDesc, setExpDesc] = useState('');

  // Contractor Form
  const [cName, setCName] = useState('');
  const [cTrade, setCTrade] = useState('Plumbing');
  const [cPhone, setCPhone] = useState('');

  const fetchData = async () => {
    try {
      const [maintRes, finRes, propRes] = await Promise.all([
        api.getMaintenanceData(),
        api.getExpenses(),
        api.getProperties()
      ]);
      setData(maintRes);
      setFinanceData(finRes);
      setProperties(propRes);
      if (propRes.length > 0) setExpProperty(propRes[0].id.toString());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (ticketId: number, contractorId: string, severity: string) => {
    await api.assignContractor({ ticket_id: ticketId, contractor_id: contractorId, severity });
    fetchData();
  };

  const handleResolve = async (ticketId: number) => {
    if(window.confirm("Are you sure this issue has been completely resolved?")) {
      await api.resolveMaintenance(ticketId);
      fetchData();
    }
  };

  const handleAddContractor = async (e: FormEvent) => {
    e.preventDefault();
    await api.addContractor({ name: cName, trade: cTrade, phone: cPhone });
    setIsContractorModalOpen(false);
    setCName(''); setCPhone('');
    fetchData();
  };

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    await api.addExpense({
      property_id: Number(expProperty),
      category: expCategory,
      amount: Number(expAmount),
      expense_date: expDate,
      description: expDesc
    });
    setIsExpenseModalOpen(false);
    setExpAmount(''); setExpDesc('');
    fetchData();
  };

  const totalExpenses = financeData.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const netIncome = financeData.total_rent - totalExpenses;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Maintenance & Finance Hub</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'tickets', label: 'Triage Hub', icon: Wrench },
          { id: 'contractors', label: 'Contractors', icon: Users },
          { id: 'finance', label: 'Finance & Expenses', icon: DollarSign },
          { id: 'reports', label: 'Reports', icon: FileText },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === tab.id ? 'bg-gold text-black' : 'text-gray-500 hover:bg-gray-100'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        
        {/* TRIAGE HUB */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold">Incoming Requests</h3>
            {data.tickets.length === 0 && <p className="text-gray-500">No maintenance tickets right now.</p>}
            {data.tickets.map(t => (
              <div key={t.id} className={`flex flex-col md:flex-row gap-4 p-4 border rounded-xl transition-colors ${t.status === 'Resolved' ? 'bg-gray-50 border-gray-200 opacity-75' : 'border-gray-200'}`}>
                <div className="w-full md:w-48 h-32 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {t.photo && <img src={t.photo} alt="Issue" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{t.category} <span className="text-sm text-gray-500 font-normal">- Unit {t.unit_number}</span></p>
                      <p className="text-sm text-gray-600">{t.description}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${t.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{t.status}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-3 items-center">
                    {t.status !== 'Resolved' ? (
                      <>
                        <select className="border border-gray-300 rounded-lg p-2 text-sm bg-white" value={t.severity || 'Routine'} onChange={(e) => handleAssign(t.id, t.contractor_id || '', e.target.value)}>
                          <option value="Routine">Routine (1-5 days)</option>
                          <option value="Emergency">Emergency (24h)</option>
                        </select>
                        <select className="border border-gray-300 rounded-lg p-2 text-sm bg-white flex-1 min-w-[150px]" value={t.contractor_id || ''} onChange={(e) => handleAssign(t.id, e.target.value, t.severity || 'Routine')}>
                          <option value="">-- Assign Contractor --</option>
                          {data.contractors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.trade})</option>)}
                        </select>
                        <button onClick={() => handleResolve(t.id)} className="bg-success text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 ml-auto"><CheckCircle size={16} /> Mark Resolved</button>
                      </>
                    ) : <p className="text-sm text-success font-bold flex items-center gap-2 py-2"><CheckCircle size={16} /> Issue has been resolved</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTRACTORS */}
        {activeTab === 'contractors' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-lg font-bold">My Contractor Network</h3>
              <button onClick={() => setIsContractorModalOpen(true)} className="bg-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 text-sm"><Plus size={16} /> Add Contractor</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.contractors.map(c => (
                <div key={c.id} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div><p className="font-bold text-lg">{c.name}</p><p className="text-sm text-gold font-semibold">{c.trade}</p></div>
                    <span className="bg-success/10 text-success font-bold px-2 py-1 rounded text-sm">{c.rating} ★</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Phone: {c.phone}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINANCE & EXPENSES */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-success/10 p-4 rounded-xl border border-success/20">
                <div className="flex items-center gap-2 text-success font-bold mb-1"><TrendingUp size={18} /> Total Rent Collected</div>
                <p className="font-display text-3xl font-bold text-success">R {financeData.total_rent}</p>
              </div>
              <div className="bg-danger/10 p-4 rounded-xl border border-danger/20">
                <div className="flex items-center gap-2 text-danger font-bold mb-1"><TrendingDown size={18} /> Total Expenses</div>
                <p className="font-display text-3xl font-bold text-danger">R {totalExpenses}</p>
              </div>
              <div className="bg-charcoal text-ivory p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-2 text-gold font-bold mb-1"><DollarSign size={18} /> Net Income</div>
                <p className={`font-display text-3xl font-bold ${netIncome >= 0 ? 'text-gold-light' : 'text-danger'}`}>R {netIncome}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <h3 className="font-display text-lg font-bold">Expense Ledger</h3>
              <button onClick={() => setIsExpenseModalOpen(true)} className="bg-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 text-sm"><Plus size={16} /> Log Expense</button>
            </div>

            <div className="space-y-3">
              {financeData.expenses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No expenses logged yet.</p>
              ) : (
                financeData.expenses.map(e => (
                  <div key={e.id} className="flex justify-between items-center p-4 bg-ivory rounded-lg border border-gray-200">
                    <div>
                      <p className="font-bold text-black">{e.category} - {e.property_name}</p>
                      <p className="text-xs text-gray-500">{e.description} • {e.expense_date}</p>
                    </div>
                    <p className="font-bold text-danger">- R {e.amount}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && <div className="text-center p-8 text-gray-500">Downloadable PDF Reports coming soon.</div>}
      </div>

      {/* Add Contractor Modal */}
      {isContractorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Add New Contractor</h3>
            <form onSubmit={handleAddContractor} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contractor Name</label><input type="text" required value={cName} onChange={(e) => setCName(e.target.value)} className="w-full border p-3 rounded-lg" /></div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trade / Specialty</label>
                <select value={cTrade} onChange={(e) => setCTrade(e.target.value)} className="w-full border p-3 rounded-lg bg-white">
                  <option>Plumbing</option><option>Electrical</option><option>Structural</option><option>Appliance Repair</option><option>Pest Control</option><option>General Handyman</option><option>Other</option>
                </select>
              </div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label><input type="tel" required value={cPhone} onChange={(e) => setCPhone(e.target.value)} className="w-full border p-3 rounded-lg" /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsContractorModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-black font-bold rounded-lg">Save Contractor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ivory w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Log an Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property</label>
                <select value={expProperty} onChange={(e) => setExpProperty(e.target.value)} className="w-full border p-3 rounded-lg bg-white">
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full border p-3 rounded-lg bg-white">
                    <option>Maintenance</option><option>Repairs</option><option>Utilities</option><option>Rates & Taxes</option><option>Other</option>
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (R)</label><input type="number" required value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="w-full border p-3 rounded-lg" /></div>
              </div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label><input type="date" required value={expDate} onChange={(e) => setExpDate(e.target.value)} className="w-full border p-3 rounded-lg" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label><input type="text" required value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="e.g. Paid Sipho for fixing geyser" className="w-full border p-3 rounded-lg" /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-black font-bold rounded-lg">Log Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}