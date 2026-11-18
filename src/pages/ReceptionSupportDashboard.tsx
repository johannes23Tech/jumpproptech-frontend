import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import TiltCard from '../components/TiltCard';
import Skeleton from '../components/Skeleton';
import { Headphones, ClipboardList, Users, MessageSquare, Wrench, Building2, ArrowRight, CheckCircle2, Phone, Mail } from 'lucide-react';

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

  const actions = [
    { to: '/applications', label: 'Applications', desc: 'Review and assist with submitted onboarding', icon: ClipboardList, count: applications.length, tone: 'gold' },
    { to: '/tenants', label: 'Tenants', desc: 'Look up tenant details and support requests', icon: Users, count: tenants.length, tone: 'gray' },
    { to: '/messages', label: 'Messages & JUMP FLUX AI', desc: 'Respond to queries and get guided help', icon: MessageSquare, tone: 'gold' },
    { to: '/maintenance', label: 'Service Intake', desc: 'Log and follow up on maintenance requests', icon: Wrench, count: openTickets.length, tone: 'warn' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-r from-charcoal via-black to-charcoal p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold opacity-10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 text-xs text-gold tracking-widest uppercase mb-2 font-semibold"><Headphones size={14} /> Reception / Support</p>
          <h1 className="font-display text-3xl md:text-4xl text-ivory mb-2">Front Desk & Support Hub</h1>
          <p className="text-gray-400 text-sm max-w-2xl">Welcome, {user?.full_name?.split(' ')[0]}. Manage intake, assist applicants and tenants, and coordinate service requests efficiently.</p>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? <><Skeleton /><Skeleton /><Skeleton /></> : <>
          <TiltCard>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-gold"><ClipboardList size={18} /><p className="text-xs font-bold uppercase tracking-wider">Submitted Applications</p></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${applications.length ? 'bg-gold/10 text-gold' : 'bg-success/10 text-success'}`}>{applications.length ? 'Needs review' : 'Clear'}</span></div>
            <p className="font-display text-3xl font-bold text-black">{applications.length}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting review or action</p>
          </TiltCard>
          <TiltCard>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-gray-600"><Users size={18} /><p className="text-xs font-bold uppercase tracking-wider">Tenants</p></div><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Directory</span></div>
            <p className="font-display text-3xl font-bold text-black">{tenants.length}</p>
            <p className="text-xs text-gray-500 mt-1">Tenant records available to assist</p>
          </TiltCard>
          <TiltCard>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-warning"><Wrench size={18} /><p className="text-xs font-bold uppercase tracking-wider">Open Maintenance</p></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${openTickets.length ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{openTickets.length ? 'Active' : 'None'}</span></div>
            <p className="font-display text-3xl font-bold text-black">{openTickets.length}</p>
            <p className="text-xs text-gray-500 mt-1">Active service requests to follow up</p>
          </TiltCard>
        </>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-premium hover:border-gold/30 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors"><a.icon size={18} /></span>
              {typeof a.count === 'number' && <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${a.tone === 'warn' && a.count ? 'bg-warning/10 text-warning' : 'bg-gray-100 text-gray-700'}`}>{a.count}</span>}
            </div>
            <h3 className="font-bold text-black mb-1">{a.label}</h3>
            <p className="text-xs text-gray-500 mb-4">{a.desc}</p>
            <div className="flex items-center text-xs font-semibold text-gold opacity-80 group-hover:opacity-100">Open <ArrowRight size={14} className="ml-1" /></div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
          <h3 className="font-display text-xl font-bold mb-4">Intake & support checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Building2, title: 'Confirm details', desc: 'Verify property, unit, and applicant/tenant information before taking action.' },
              { icon: ClipboardList, title: 'Application status', desc: 'Check submission status, required documents, and next steps clearly.' },
              { icon: Wrench, title: 'Capture issues well', desc: 'Record location, urgency, access notes and contact details for maintenance.' },
              { icon: MessageSquare, title: 'Use JUMP FLUX AI', desc: 'Get guided, permission-aware answers and suggested responses quickly.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gold/20 transition-colors">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold shrink-0"><item.icon size={16} /></span>
                <div>
                  <p className="font-semibold text-black">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium">
          <h3 className="font-display text-xl font-bold mb-4">Quick guidance</h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3"><span className="mt-0.5 text-success"><CheckCircle2 size={16} /></span><span>Be clear, polite, and confirm key details back to the tenant/applicant.</span></li>
            <li className="flex items-start gap-3"><span className="mt-0.5 text-gold"><Phone size={16} /></span><span>For urgent issues, capture a reachable contact and escalate per process.</span></li>
            <li className="flex items-start gap-3"><span className="mt-0.5 text-gold"><Mail size={16} /></span><span>Keep records accurate; actions and communications may be audited.</span></li>
            <li className="flex items-start gap-3"><span className="mt-0.5 text-gold"><Headphones size={16} /></span><span>Use authorized areas only — menus and data shown are role/permission-based.</span></li>
          </ul>
          <div className="mt-5 rounded-xl border border-gold/20 bg-gold/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gold mb-1">Tip</p>
            <p className="text-sm text-gray-700">Start with Applications or Messages for most front-desk queries, then route to Maintenance or Tenants as needed.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
