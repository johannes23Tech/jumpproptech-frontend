import { useAuth } from '../context/AuthContext';
import { Lock, CreditCard, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Paywall() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-charcoal rounded-3xl p-8 border border-gray-800 shadow-2xl text-center">
        <div className="w-20 h-20 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-6 text-danger">
          <Lock size={32} />
        </div>
        
        <h1 className="font-display text-3xl text-ivory mb-2">Subscription Expired</h1>
        <p className="text-gray-400 mb-8">
          Hi {user?.full_name}, your Jump PropTech subscription has lapsed. To continue managing your properties and accessing your dashboard, please renew your plan.
        </p>

        <div className="bg-black p-4 rounded-xl border border-gray-800 mb-8">
          <p className="text-sm text-gray-400 mb-1">Monthly Plan</p>
          <p className="font-display text-2xl text-gold font-bold">R 199 / month</p>
          <p className="text-xs text-gray-500 mt-2">Unlimited properties, tenants, and automated rent tracking.</p>
        </div>

        <button 
          onClick={() => alert("Payment gateway (Ozow/Paystack) integration coming in the next phase!")}
          className="w-full bg-gold text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 mb-4"
        >
          <CreditCard size={18} /> Renew Subscription
        </button>

        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-danger flex items-center justify-center gap-2 w-full">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}