import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, Key, Users, Wallet, LogOut, FileText, MessageSquare, Wrench, CreditCard, UserCircle, Download } from 'lucide-react';
import InstallPWA from './InstallPWA'; 
import { usePWAInstall } from '../utils/usePWAInstall';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { promptInstall } = usePWAInstall();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isTenant = user?.role === 'tenant';

  const ownerNav = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Properties', path: '/properties', icon: Building2 },
    { name: 'Units', path: '/units', icon: Key },
    { name: 'Tenants', path: '/tenants', icon: Users },
    { name: 'Rent', path: '/rent', icon: Wallet },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
  ];

  const tenantNav = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Lease & Docs', path: '/documents', icon: FileText },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
  ];

  const navItems = isTenant ? tenantNav : ownerNav;

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-black text-ivory fixed inset-y-0 left-0 z-40 border-r border-gray-800">
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center font-display font-bold text-black">JL</div>
          <div>
            <h1 className="font-display text-lg">Jump PropTech</h1>
            <p className="text-[9px] tracking-widest text-gold uppercase">{isTenant ? 'Tenant Portal' : 'Landlord Portal'}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);

            return (
              <Link key={item.name} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gold/10 text-gold border-l-2 border-gold' : 'text-gray-400 hover:bg-gray-800 hover:text-ivory'}`}>
                <Icon size={18} /> {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-3 text-sm text-gray-400 hover:text-danger w-full px-4 py-2 mt-2">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-8 flex flex-col">
        <header className="sticky top-0 z-30 bg-ivory/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 md:px-8 md:py-4 flex justify-between items-center">
          <h1 className="font-display text-xl md:text-2xl capitalize text-black">
            {location.pathname === '/' ? (isTenant ? 'Tenant Dashboard' : 'Dashboard') : location.pathname.replace('/', '').replace('-', ' ').split('/')[0]}
          </h1>
          
          {/* Avatar Dropdown Menu */}
          <div className="relative">
            <div 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-full bg-gold text-black flex items-center justify-center font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              {user?.full_name?.split(' ').map(n => n[0]).join('')}
            </div>

            {isMenuOpen && (
              <>
                {/* Click-away overlay */}
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-12 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden fade-in">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <p className="font-bold text-black truncate">{user?.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    {isTenant ? (
                      <Link 
                        to="/profile" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 w-full p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <UserCircle size={16} /> My Profile
                      </Link>
                    ) : (
                      <Link 
                        to="/landlord-profile" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 w-full p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <UserCircle size={16} /> My Account
                      </Link>
                    )}
                    <button 
                      onClick={() => { promptInstall(); setIsMenuOpen(false); }}
                      className="flex items-center gap-3 w-full p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                    >
                      <Download size={16} /> Install App
                    </button>
                    <button 
                      onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                      className="flex items-center gap-3 w-full p-2 text-sm font-medium text-danger hover:bg-danger/10 rounded-lg transition-colors text-left"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>
        
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1">
          {/* Mobile Install Banner */}
          <InstallPWA />
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-black border-t border-gray-800 z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);

            return (
              <Link key={item.name} to={item.path} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-gold' : 'text-gray-500'}`}>
                <Icon size={20} />
                <span className="text-[10px] font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}