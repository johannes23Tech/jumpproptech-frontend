import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_properties: 0, total_units: 0, occupied: 0, vacant: 0, collected: 0, pending: 0 });

  useEffect(() => {
    api.getDashboardStats().then(data => {
      if (data) setStats({
        total_properties: data.total_properties || 0,
        total_units: data.total_units || 0,
        occupied: data.occupied || 0,
        vacant: data.vacant || 0,
        collected: data.collected || 0,
        pending: data.pending || 0
      });
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-charcoal to-black p-6 rounded-2xl border border-gray-800 relative overflow-hidden text-ivory shadow-lg">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Welcome back</p>
        <p className="font-display text-3xl font-semibold text-gold-light mb-2">{user?.full_name}</p>
        <p className="text-sm text-gray-400">Manage your properties and track rent effortlessly.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Properties', value: stats.total_properties },
          { label: 'Total Units', value: stats.total_units },
          { label: 'Occupied', value: stats.occupied },
          { label: 'Vacant', value: stats.vacant }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="font-display text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rent Collected</p>
          <p className="font-display text-3xl font-bold text-success">R {stats.collected}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Outstanding Rent</p>
          <p className="font-display text-3xl font-bold text-warning">R {stats.pending}</p>
        </div>
      </div>
    </div>
  );
}