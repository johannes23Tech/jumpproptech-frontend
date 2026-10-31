import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Wrench, Users, DollarSign, FileText, CheckCircle } from 'lucide-react';

export default function LandlordMaintenance() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [data, setData] = useState<{ tickets: any[], contractors: any[] }>({ tickets: [], contractors: [] });

  const fetchData = async () => {
    try {
      const res = await api.getMaintenanceData();
      setData(res);
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

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Maintenance Hub</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'tickets', label: 'Triage Hub', icon: Wrench },
          { id: 'contractors', label: 'Contractors', icon: Users },
          { id: 'finance', label: 'Finance', icon: DollarSign },
          { id: 'reports', label: 'Reports', icon: FileText },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === tab.id ? 'bg-gold text-black' : 'text-gray-500 hover:bg-gray-100'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold">Incoming Requests</h3>
            
            {data.tickets.length === 0 && <p className="text-gray-500">No maintenance tickets right now.</p>}

            {data.tickets.map(t => (
              <div key={t.id} className={`flex flex-col md:flex-row gap-4 p-4 border rounded-xl transition-colors ${t.status === 'Resolved' ? 'bg-gray-50 border-gray-200 opacity-75' : 'border-gray-200'}`}>
                
                {/* Photo */}
                <div className="w-full md:w-48 h-32 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {t.photo && <img src={t.photo} alt="Issue" className="w-full h-full object-cover" />}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{t.category} <span className="text-sm text-gray-500 font-normal">- Unit {t.unit_number}</span></p>
                      <p className="text-sm text-gray-600">{t.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Reported by: {t.tenant_name}</p>
                    </div>
                    
                    {/* Badges */}
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${t.priority === 'Emergency' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                        {t.priority}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${t.status === 'Resolved' ? 'bg-success/10 text-success' : t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-3 items-center">
                    
                    {t.status !== 'Resolved' ? (
                      <>
                        <select 
                          className="border border-gray-300 rounded-lg p-2 text-sm bg-white"
                          value={t.severity || 'Routine'}
                          onChange={(e) => handleAssign(t.id, t.contractor_id || '', e.target.value)}
                        >
                          <option value="Routine">Routine (1-5 days)</option>
                          <option value="Emergency">Emergency (24h)</option>
                        </select>

                        <select 
                          className="border border-gray-300 rounded-lg p-2 text-sm bg-white flex-1 min-w-[150px]"
                          value={t.contractor_id || ''}
                          onChange={(e) => handleAssign(t.id, e.target.value, t.severity || 'Routine')}
                        >
                          <option value="">-- Assign Contractor --</option>
                          {data.contractors.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.trade})</option>
                          ))}
                        </select>

                        <button 
                          onClick={() => handleResolve(t.id)}
                          className="bg-success text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 ml-auto"
                        >
                          <CheckCircle size={16} /> Mark Resolved
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-success font-bold flex items-center gap-2 py-2">
                        <CheckCircle size={16} /> Issue has been resolved
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'contractors' && (
          <div>
            <h3 className="font-display text-lg font-bold mb-4">My Contractor Network</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.contractors.map(c => (
                <div key={c.id} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-lg">{c.name}</p>
                      <p className="text-sm text-gold font-semibold">{c.trade}</p>
                    </div>
                    <span className="bg-success/10 text-success font-bold px-2 py-1 rounded text-sm">{c.rating} ★</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Phone: {c.phone}</p>
                  <p className="text-xs text-gray-500">Callout Fee: R {c.callout_fee}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'finance' && <div className="text-center p-8 text-gray-500">Finance module coming soon (Track contractor invoices & maintenance costs).</div>}
        {activeTab === 'reports' && <div className="text-center p-8 text-gray-500">Maintenance Reports coming soon.</div>}
      </div>
    </div>
  );
}