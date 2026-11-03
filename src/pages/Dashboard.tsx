import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import BarChart from '../components/BarChart';
import TiltCard from '../components/TiltCard';
import { Building2, TrendingUp, AlertCircle, Wrench, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats().then(data => {
      if (data) setStats(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton /><Skeleton /><Skeleton /><Skeleton />
        </div>
      </div>
    );
  }

  if (stats?.total_properties === 0) {
    return (
      <EmptyState 
        icon={<Building2 size={32} />}
        title="Welcome to Jump PropTech"
        description="You haven't added any properties yet. Start by adding your first property to unlock your dashboard analytics."
        action={
          <Link to="/properties" className="inline-block bg-gold text-black px-6 py-3 rounded-xl font-bold shadow-gold hover:opacity-90 transition-opacity">
            Add Your First Property
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-charcoal to-black p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold opacity-10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
        <p className="text-xs text-gold tracking-widest uppercase mb-2 font-semibold">Portfolio Overview</p>
        <h1 className="font-display text-3xl text-ivory mb-2">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-gray-400 text-sm">Here is what is happening with your properties today.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TiltCard>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Properties</p>
          <p className="font-display text-3xl font-bold text-black">{stats?.total_properties || 0}</p>
        </TiltCard>
        <TiltCard>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Units</p>
          <p className="font-display text-3xl font-bold text-black">{stats?.total_units || 0}</p>
        </TiltCard>
        <TiltCard>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Occupied</p>
          <p className="font-display text-3xl font-bold text-black">{stats?.occupied || 0}</p>
        </TiltCard>
        <TiltCard>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vacant</p>
          <p className="font-display text-3xl font-bold text-black">{stats?.vacant || 0}</p>
        </TiltCard>
      </div>

      {/* Analytics Chart */}
      {stats?.chart_data && <BarChart data={stats.chart_data} />}

      {/* Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TiltCard className="relative overflow-hidden bg-gradient-to-br from-white to-ivory">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success opacity-5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-2 text-success">
            <TrendingUp size={18} /> <p className="text-xs font-bold uppercase tracking-wider">Collected</p>
          </div>
          <p className="font-display text-4xl font-bold text-black">R {stats?.collected || 0}</p>
        </TiltCard>
        
        <TiltCard className="relative overflow-hidden bg-gradient-to-br from-white to-ivory">
          <div className="absolute top-0 right-0 w-32 h-32 bg-warning opacity-5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-2 text-warning">
            <AlertCircle size={18} /> <p className="text-xs font-bold uppercase tracking-wider">Outstanding</p>
          </div>
          <p className="font-display text-4xl font-bold text-black">R {stats?.pending || 0}</p>
        </TiltCard>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
        <h3 className="font-display text-xl font-bold mb-6">Recent Activity</h3>
        
        {stats?.recent_activity?.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No recent activity yet.</p>
        ) : (
          <div className="space-y-6">
            {stats?.recent_activity?.map((act: any, index: number) => (
              <div key={index} className="flex items-start gap-4 relative">
                {index !== stats.recent_activity.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-[-24px] w-0.5 bg-gray-100"></div>
                )}
                <div className={`z-10 p-2.5 rounded-full shrink-0 flex items-center justify-center ${
                  act.type === 'payment' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  {act.type === 'payment' ? <CheckCircle size={18} /> : <Wrench size={18} />}
                </div>
                <div className="pt-1">
                  <p className="text-sm text-black font-semibold leading-tight">{act.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(act.activity_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}