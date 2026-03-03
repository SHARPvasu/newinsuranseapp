import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import {
  LayoutDashboard, Users, FileText, Phone, Bell, LogOut, Menu, X, Shield,
  ChevronDown, Settings, User, Key, UserPlus, Target, Moon, Sun, Search,
  RefreshCw, BarChart2, Calculator, CheckSquare, DollarSign, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NavItem { path: string; icon: React.ElementType; label: string; badge?: number; }

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, notifications, darkMode, toggleDarkMode, customers, leads, users } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isOwner = currentUser?.role === 'owner';
  const unreadCount = notifications.filter(n => n.userId === currentUser?.id && !n.isRead).length;
  const pendingApprovals = customers.filter(c => c.status === 'pending').length;

  // CMD+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdkOpen(true); setSearchQuery(''); }
      if (e.key === 'Escape') { setCmdkOpen(false); setProfileOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Apply dark mode on mount
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const searchResults = searchQuery.trim().length >= 1 ? [
    ...customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.customerId.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4).map(c => ({ type: 'customer', label: c.name, sub: c.customerId, link: `${isOwner ? '/owner' : '/employee'}/customers/${c.id}` })),
    ...leads.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3).map(l => ({ type: 'lead', label: l.name, sub: `Lead · ${l.status}`, link: `${isOwner ? '/owner' : '/employee'}/leads` })),
    ...users.filter(u => u.role === 'employee' && u.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 2).map(u => ({ type: 'employee', label: u.name, sub: u.email, link: '/owner/agents' })),
  ] : [];

  const ownerNav: NavItem[] = [
    { path: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/owner/approvals', icon: CheckSquare, label: 'Approvals', badge: pendingApprovals },
    { path: '/owner/customers', icon: Users, label: 'Customers' },
    { path: '/owner/agents', icon: UserPlus, label: 'Employees' },
    { path: '/owner/leads', icon: Target, label: 'Leads' },
    { path: '/owner/calls', icon: Phone, label: 'Call Tracker' },
    { path: '/owner/claims', icon: AlertCircle, label: 'Claims' },
    { path: '/owner/commissions', icon: DollarSign, label: 'Commissions' },
    { path: '/owner/reports', icon: BarChart2, label: 'Reports' },
    { path: '/owner/settings', icon: Settings, label: 'Settings' },
  ];

  const employeeNav: NavItem[] = [
    { path: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/employee/customers', icon: Users, label: 'Customers' },
    { path: '/employee/policies', icon: FileText, label: 'Policies' },
    { path: '/employee/renewals', icon: RefreshCw, label: 'Renewals' },
    { path: '/employee/leads', icon: Target, label: 'Leads' },
    { path: '/employee/calls', icon: Phone, label: 'Call Tracker' },
    { path: '/employee/claims', icon: AlertCircle, label: 'Claims' },
    { path: '/employee/commissions', icon: DollarSign, label: 'Commissions' },
    { path: '/employee/calculator', icon: Calculator, label: 'Premium Calc' },
    { path: '/employee/profile', icon: User, label: 'My Profile' },
  ];

  const navItems = isOwner ? ownerNav : employeeNav;
  const handleLogout = () => { logout(); navigate('/login'); toast.success('Logged out successfully'); };
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-r`}>
        <div className={`flex items-center gap-3 px-6 py-5 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200/50">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className={`font-bold text-sm leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>UV Insurance</div>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Agency Management</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className={`px-4 py-3 mx-4 mt-4 rounded-xl border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className={`text-xs font-semibold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{currentUser?.name}</div>
              <div className={`text-xs px-1.5 py-0.5 rounded-full inline-block ${isOwner ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {isOwner ? 'Owner' : 'Employee'}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive(item.path)
                  ? darkMode ? 'bg-blue-900/50 text-blue-400 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-100'
                  : darkMode ? 'text-slate-400 hover:bg-slate-700/50 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive(item.path) ? darkMode ? 'text-blue-400' : 'text-blue-600' : darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{item.badge > 9 ? '9+' : item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className={`p-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <button onClick={handleLogout} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}>
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className={`flex-shrink-0 h-16 flex items-center px-4 gap-4 z-30 border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2 rounded-lg ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Menu className="w-5 h-5" />
          </button>

          {/* CMD+K Search bar */}
          <button onClick={() => { setCmdkOpen(true); setSearchQuery(''); }}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${darkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Search...</span>
            <kbd className={`text-xs px-1.5 py-0.5 rounded ml-4 ${darkMode ? 'bg-slate-600 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>⌘K</kbd>
          </button>

          <div className="flex-1" />

          {/* Dark mode toggle */}
          <button onClick={toggleDarkMode} className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-yellow-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <Link to={isOwner ? '/owner/notifications' : '/employee/notifications'} className={`relative p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </Link>

          {/* Profile dropdown */}
          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)} className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{currentUser?.name?.charAt(0)}</div>
              <ChevronDown className={`w-3 h-3 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
            </button>
            {profileOpen && (
              <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg py-1 z-50 border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className={`px-3 py-2 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  <div className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{currentUser?.name}</div>
                  <div className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{currentUser?.email}</div>
                </div>
                <Link to={isOwner ? '/owner/profile' : '/employee/profile'} onClick={() => setProfileOpen(false)} className={`flex items-center gap-2 px-3 py-2 text-sm ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}><User className="w-4 h-4" /> My Profile</Link>
                <Link to={isOwner ? '/owner/change-password' : '/employee/change-password'} onClick={() => setProfileOpen(false)} className={`flex items-center gap-2 px-3 py-2 text-sm ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}><Key className="w-4 h-4" /> Change Password</Link>
                <button onClick={() => { setProfileOpen(false); handleLogout(); }} className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}><LogOut className="w-4 h-4" /> Sign Out</button>
              </div>
            )}
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <div className="animate-fadeIn">{children}</div>
        </main>
      </div>

      {/* CMD+K Modal */}
      {cmdkOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60" onClick={() => setCmdkOpen(false)}>
          <div onClick={e => e.stopPropagation()} className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`flex items-center gap-3 px-4 py-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <Search className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search customers, leads, employees..." className={`flex-1 text-sm outline-none bg-transparent ${darkMode ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`} />
              <kbd className={`text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {searchQuery.trim() === '' ? (
                <div className="px-4 py-6 text-center">
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Start typing to search...</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {[{ label: 'Approvals', to: '/owner/approvals' }, { label: 'Customers', to: `${isOwner ? '/owner' : '/employee'}/customers` }, { label: 'Reports', to: '/owner/reports' }].map(q => (
                      <button key={q.label} onClick={() => { navigate(q.to); setCmdkOpen(false); }} className={`text-xs px-3 py-1.5 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{q.label}</button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>No results for "{searchQuery}"</p>
                </div>
              ) : (
                searchResults.map((r, i) => (
                  <button key={i} onClick={() => { navigate(r.link); setCmdkOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${r.type === 'customer' ? 'bg-blue-500' : r.type === 'lead' ? 'bg-purple-500' : 'bg-green-500'}`}>{r.label.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{r.label}</div>
                      <div className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{r.sub}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{r.type}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
