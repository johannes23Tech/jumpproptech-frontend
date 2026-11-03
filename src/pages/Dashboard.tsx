import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { Building2, TrendingUp, AlertCircle } from 'lucide-react';
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

  // 1. Premium Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton /><Skeleton /><Skeleton /><Skeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton /><Skeleton />
        </div>
      </div>
    );
  }

  // 2. Premium Empty State
  if (stats?.total_properties === 0) {
    return (
      <EmptyState 
        icon={<Building2 size={32} />}
        title="Welcome to Jump PropTech"
        description="You haven't added any properties yet. Start by adding your first property to unlock your dashboard analytics and rent tracking."
        action={
          <Link to="/properties" className="inline-block bg-gold text-black px-6 py-3 rounded-xl font-bold shadow-gold hover:opacity-90 transition-opacity">
            Add Your First Property
          </Link>
        }
      />
    );
  }

  // 3. The Dashboard
  return (
    <div className="space-y-6 animate-slide-up">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-charcoal to-black p-8 rounded-3xl relative overflow-hidden shadow-premium border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold opacity-10 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none"></div>
        <p className="text-xs text-gold tracking-widest uppercase mb-2 font-semibold">Portfolio Overview</p>
        <h1 className="font-display text-3xl text-ivory mb-2">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-gray-400 text-sm">Here is what is happening with your properties today.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-premium hover:shadow-premium-hover transition-shadow duration-300">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Properties</p>
          <p className="font-display text-3xl font-bold text-black">{stats?.total_properties || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-premium hover:shadow-premium-hover transition-shadow duration-300">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Units</p>
          <p className="font-display text-3xl font-bold text-black">{stats?.total_units || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-premium hover:shadow-premium-hover transition-shadow duration-300">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Occupied</p>
          <p className="font-display text-3xl font-bold text-black">{stats?.occupied || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-premium hover:shadow-premium-hover transition-shadow duration-300">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vacant</p>
          <p className="font-display text-3xl font-bold text-black">{stats?.vacant || 0}</p>
        </div>
      </div>

      {/* Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium hover:shadow-premium-hover transition-shadow duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success opacity-5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-2 text-success">
            <TrendingUp size={18} /> <p className="text-xs font-bold uppercase tracking-wider">Collected</p>
          </div>
          <p className="font-display text-4xl font-bold text-black">R {stats?.collected || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium hover:shadow-premium-hover transition-shadow duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-warning opacity-5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-2 text-warning">
            <AlertCircle size={18} /> <p className="text-xs font-bold uppercase tracking-wider">Outstanding</p>
          </div>
          <p className="font-display text-4xl font-bold text-black">R {stats?.pending || 0}</p>
        </div>
      </div>
    </div>
  );
}