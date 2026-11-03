import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ShieldCheck, Building2, Key, Users, TrendingUp, Ban, CheckCircle } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    api.getSuperAdminStats()
      .then(data => setStats(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggle = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'expired' ? 'active' : 'expired';
    try {
      await api.toggleSubscription({ landlord_id: id, status: newStatus });
      fetchStats(); // Refresh the list
    } catch (err) {
      alert("Failed to update subscription");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading global metrics...</div>;
  if (!stats) return <div className="p-8 text-center text-danger">Access Denied or Error Loading Stats.</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-charcoal to-black p-6 rounded-2xl border border-gold/30 shadow-2xl flex items-center gap-4">
        <div className="bg-gold p-3 rounded-xl">
          <ShieldCheck size={32} className="text-black" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-ivory">Super Admin Portal</h1>
          <p className="text-gold-light text-sm">Global platform overview for Jump Living.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2"><Users size={18} /> Landlords</div>
          <p className="font-display text-3xl font-bold text-black">{stats.total_landlords}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2"><Building2 size={18} /> Properties</div>
          <p className="font-display text-3xl font-bold text-black">{stats.total_properties}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2"><Key size={18} /> Total Units</div>
          <p className="font-display text-3xl font-bold text-black">{stats.total_units}</p>
        </div>
        <div className="bg-gold/10 p-5 rounded-xl border border-gold/30 shadow-sm">
          <div className="flex items-center gap-2 text-gold-dark mb-2"><TrendingUp size={18} /> Rent Processed</div>
          <p className="font-display text-2xl font-bold text-gold-dark">R {stats.total_rent_processed}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="font-display text-xl font-bold mb-4">Landlord Accounts & Subscriptions</h3>
        <div className="space-y-3">
          {stats.recent_signups.map((user: any, i: number) => (
            <div key={i} className="flex flex-col md:flex-row justify-between md:items-center p-4 bg-ivory rounded-lg border border-gray-100 gap-4">
              <div>
                <p className="font-bold text-black">{user.full_name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${user.subscription_status === 'expired' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                  {user.subscription_status || 'active'}
                </span>
                <button 
                  onClick={() => handleToggle(user.id, user.subscription_status || 'active')}
                  className={`text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                    user.subscription_status === 'expired' 
                      ? 'bg-success text-white hover:bg-success/80' 
                      : 'bg-danger/10 text-danger hover:bg-danger/20'
                  }`}
                >
                  {user.subscription_status === 'expired' ? <><CheckCircle size={14}/> Activate</> : <><Ban size={14}/> Suspend</>}
                </button>
              </div>
            </div>
          ))}
          {stats.recent_signups.length === 0 && <p className="text-gray-500">No signups yet.</p>}
        </div>
      </div>
    </div>
  );
}