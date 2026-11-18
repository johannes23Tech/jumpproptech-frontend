import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import TiltCard from '../components/TiltCard';
import { Headphones, ClipboardList, Users, MessageSquare, Wrench, Building2 } from 'lucide-react';

export default function ReceptionSupportDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [appsRes, tenantsRes, maintRes] = await Promise.allSettled([
          api.getApplications('submitted'),
          api.getTenants(),
          api.getMaintenanceData(),
        ]);
        if (!active) return;
        if (appsRes.status === 'fulfilled') setApplications(Array.isArray(appsRes.value) ? appsRes.value : []);
        if (tenantsRes.status === 'fulfilled') setTenants(Array.isArray(tenantsRes.value) ? tenantsRes.value : []);
        if (maintRes.status === 'fulfilled') {
          const d = maintRes.value;
          setTickets(Array.isArray(d) ? d : (Array.isArray(d?.tickets) ? d.tickets : []));
        }
        if (appsRes.status === 'rejected' && tenantsRes.status === 'rejected' && maintRes.status === 'rejected') {
          setError('Could not load dashboard data for your role.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const openTickets = useMemo(() => tickets.filter((t) => /open|pending|progress|assigned/i.test(String(t.status || ''))), [tickets]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal to-black p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold opacity-10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <p className="text-xs text-gold tracking-widest uppercase mb-2 font-semibold">Reception / Support</p>
        <h1 className="font-display text-3xl text-ivory mb-2">Support Dashboard</h1>
        <p className="text-gray-400 text-sm">Welcome, {user?.full_name?.split(' ')[0]}. Handle applications, tenant queries, and service intake.</p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-gold"><ClipboardList size={18} /><p className="text-xs font-bold uppercase tracking-wider">Submitted Applications</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : applications.length}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting review/action</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-gray-600"><Users size={18} /><p className="text-xs font-bold uppercase tracking-wider">Tenants</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : tenants.length}</p>
          <p className="text-xs text-gray-500 mt-1">Tenant records in view</p>
        </TiltCard>
        <TiltCard>
          <div className="flex items-center gap-2 mb-2 text-warning"><Wrench size={18} /><p className="text-xs font-bold uppercase tracking-wider">Open Maintenance</p></div>
          <p className="font-display text-3xl font-bold text-black">{loading ? '…' : openTickets.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active service requests</p>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/applications" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><ClipboardList size={20} className="text-gold" /><h3 className="font-bold">Applications</h3></div>
          <p className="text-sm text-gray-500">Review submitted onboarding applications.</p>
        </Link>
        <Link to="/tenants" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><Users size={20} className="text-gold" /><h3 className="font-bold">Tenants</h3></div>
          <p className="text-sm text-gray-500">Assist tenants and view account details.</p>
        </Link>
        <Link to="/messages" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><MessageSquare size={20} className="text-gold" /><h3 className="font-bold">JUMP FLUX AI / Messages</h3></div>
          <p className="text-sm text-gray-500">Respond to queries and get assistance.</p>
        </Link>
        <Link to="/maintenance" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium transition-shadow">
          <div className="flex items-center gap-3 mb-2"><Headphones size={20} className="text-gold" /><h3 className="font-bold">Service Intake</h3></div>
          <p className="text-sm text-gray-500">Log and follow up on maintenance requests.</p>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
        <h3 className="font-display text-xl font-bold mb-4">Quick support actions</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
          <li className="flex items-start gap-2"><Building2 size={16} className="text-gold mt-0.5" /> Confirm property/unit details for applicants and tenants.</li>
          <li className="flex items-start gap-2"><ClipboardList size={16} className="text-gold mt-0.5" /> Check application status and required documents.</li>
          <li className="flex items-start gap-2"><Wrench size={16} className="text-gold mt-0.5" /> Capture maintenance issues clearly (location, urgency, access).</li>
          <li className="flex items-start gap-2"><MessageSquare size={16} className="text-gold mt-0.5" /> Use JUMP FLUX AI for guided answers within your permissions.</li>
        </ul>
      </div>
    </div>
  );
}
