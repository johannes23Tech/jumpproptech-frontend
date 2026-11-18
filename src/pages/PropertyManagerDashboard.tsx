import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import BarChart from '../components/BarChart';
import TiltCard from '../components/TiltCard';
import { Building2, TrendingUp, AlertCircle, Key, Users, ClipboardList, Home } from 'lucide-react';

export default function PropertyManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then((data) => { if (data) setStats(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
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
        title="Property / Project Manager Dashboard"
        description="No properties in the portfolio yet. Add properties and units to start tracking occupancy, rent, and operations."
        action={
          <Link to="/properties" className="inline-block bg-gold text-black px-6 py-3 rounded-xl font-bold shadow-gold hover:opacity-90 transition-opacity">
            Add Property
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal to-black p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold opacity-10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <p className="text-xs text-gold tracking-widest uppercase mb-2 font-semibold">Property / Project Management</p>
        <h1 className="font-display text-3xl text-ivory mb-2">Welcome, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-gray-400 text-sm">Portfolio, occupancy, tenants, and operational performance at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TiltCard>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Building2 size={14} /> Properties</p>
          <p className="font-display text-3xl font-bold text-black">{stats?.total_properties || 0}</p>
        </TiltCard>
        <TiltCard>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Key size={14} /> Units</p>
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

      {stats?.chart_data && <BarChart data={stats.chart_data} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TiltCard className="relative overflow-hidden bg-gradient-to-br from-white to-ivory">
          <div className="flex items-center gap-2 mb-2 text-success">
            <TrendingUp size={18} /> <p className="text-xs font-bold uppercase tracking-wider">Collected</p>
          </div>
          <p className="font-display text-4xl font-bold text-black">R {stats?.collected || 0}</p>
        </TiltCard>
        <TiltCard className="relative overflow-hidden bg-gradient-to-br from-white to-ivory">
          <div className="flex items-center gap-2 mb-2 text-warning">
            <AlertCircle size={18} /> <p className="text-xs font-bold uppercase tracking-wider">Outstanding</p>
          </div>
          <p className="font-display text-4xl font-bold text-black">R {stats?.pending || 0}</p>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/properties" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><Home size={20} className="text-gold" /><h3 className="font-bold">Properties & Units</h3></div>
          <p className="text-sm text-gray-500">Manage portfolio, buildings, units, pricing and availability.</p>
        </Link>
        <Link to="/tenants" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><Users size={20} className="text-gold" /><h3 className="font-bold">Tenants & Tenancies</h3></div>
          <p className="text-sm text-gray-500">Oversee tenants, leases, onboarding and occupancy.</p>
        </Link>
        <Link to="/applications" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><ClipboardList size={20} className="text-gold" /><h3 className="font-bold">Applications</h3></div>
          <p className="text-sm text-gray-500">Review and progress unit-scoped applications.</p>
        </Link>
      </div>
    </div>
  );
}
