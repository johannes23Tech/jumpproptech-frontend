import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, CreditCard, Wrench, MessageSquare, AlertCircle, UserCircle, X } from 'lucide-react';

export default function TenantDashboard() {
  const [data, setData] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getTenantData().then(res => {
      // SAFETY CHECK: Ensure the response has the expected structure
      if (res) {
        setData(res);
      }
      const isNew = localStorage.getItem('just_registered');
      if (isNew === 'true') {
        setShowPrompt(true);
      }
    }).catch(err => {
      console.error("Dashboard error:", err);
    });
  }, []);

  const handleDismissPrompt = () => {
    localStorage.removeItem('just_registered');
    setShowPrompt(false);
  };

  const goToProfile = () => {
    localStorage.removeItem('just_registered');
    setShowPrompt(false);
    navigate('/profile', { state: { editProfile: true } });
  };

  if (!data) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  // SAFETY CHECK: Ensure tenant object exists
  const tenant = data.tenant || {};
  const pendingRent = data.rent?.find((r: any) => r.status !== 'Paid');
  const openMaint = data.maintenance?.filter((m: any) => m.status !== 'Resolved').length || 0;

  return (
    <div className="space-y-6 relative">
      
      {/* FIRST TIME USER OVERLAY */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative text-center animate-slide-up">
            <button onClick={handleDismissPrompt} className="absolute top-4 right-4 text-gray-400 hover:text-black">
              <X size={24} />
            </button>
            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-gold">
              <UserCircle size={40} />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Welcome to Jump PropTech!</h2>
            <p className="text-gray-500 mb-8 text-sm">
              Your account is ready. Before you explore, please take a moment to complete your profile. This helps your landlord manage your lease and emergency contacts securely.
            </p>
            <button 
              onClick={goToProfile} 
              className="w-full bg-gold text-black font-bold py-3 rounded-xl shadow-gold hover:opacity-90 transition-opacity mb-3"
            >
              Complete My Profile
            </button>
            <button 
              onClick={handleDismissPrompt} 
              className="text-sm text-gray-400 hover:text-black font-semibold"
            >
              I'll do this later
            </button>
          </div>
        </div>
      )}

      {/* Rest of the Dashboard */}
      <div className="bg-gradient-to-br from-charcoal to-black p-6 rounded-2xl border border-gray-800 relative overflow-hidden text-ivory shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold opacity-10 rounded-full -mr-10 -mt-10"></div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">My Home</p>
        <p className="font-display text-3xl font-semibold text-gold-light mb-2">{tenant.property_name || 'Pending Assignment'}</p>
        <p className="text-sm text-gray-300">Unit: <span className="font-bold text-white">{tenant.unit_number || 'N/A'}</span> | Rent: <span className="font-bold text-white">R {tenant.monthly_rent || 0}</span></p>
      </div>

      {pendingRent && (
        <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-warning">Rent Due</p>
            <p className="text-sm text-gray-600">You have an outstanding balance of R {pendingRent.amount} for {pendingRent.month_for}.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/documents" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md text-center transition-shadow">
          <FileText size={28} className="mx-auto text-gold mb-2" />
          <p className="font-bold text-sm">Lease & Docs</p>
        </Link>
        <Link to="/payments" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md text-center transition-shadow">
          <CreditCard size={28} className="mx-auto text-gold mb-2" />
          <p className="font-bold text-sm">Payments</p>
        </Link>
        <Link to="/maintenance" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md text-center transition-shadow">
          <Wrench size={28} className="mx-auto text-gold mb-2" />
          <p className="font-bold text-sm">Maintenance</p>
          {openMaint > 0 && <span className="inline-block mt-2 bg-warning text-white text-xs px-2 py-1 rounded-full">{openMaint} Open</span>}
        </Link>
        <Link to="/messages" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md text-center transition-shadow">
          <MessageSquare size={28} className="mx-auto text-gold mb-2" />
          <p className="font-bold text-sm">Messages</p>
        </Link>
      </div>
    </div>
  );
}