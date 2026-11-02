import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, Key, Users, Wallet, LogOut, FileText, MessageSquare, Wrench, CreditCard, UserCircle } from 'lucide-react';
import InstallPWA from './InstallPWA'; 

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    { name: 'My Profile', path: '/profile', icon: UserCircle },
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

        {/* Cleaned up sidebar footer */}
        <div className="p-4 border-t border-gray-800">
          <InstallPWA />
          
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
          <div className="w-10 h-10 rounded-full bg-gold text-black flex items-center justify-center font-bold text-sm cursor-pointer">
            {user?.full_name?.split(' ').map(n => n[0]).join('')}
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