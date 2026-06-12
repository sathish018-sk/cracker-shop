import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Menu, Sun, Moon, User, Bell, PlusCircle, Search, 
  ChevronDown, Settings, LogOut, Plus, Database, Sparkles, CheckCircle2, AlertTriangle, X, Info
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar, isCollapsed, toggleCollapse }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Dropdown States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  // Map path to screen title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Overview Dashboard';
    if (path.startsWith('/billing')) return 'POS Checkout';
    if (path.startsWith('/invoices')) return 'Invoice Registry';
    if (path.startsWith('/products')) return 'Product Catalogue';
    if (path.startsWith('/inventory')) return 'Inventory Stock Logs';
    if (path.startsWith('/customers')) return 'Customers Directory';
    if (path.startsWith('/workers')) return 'Workers Registry';
    if (path.startsWith('/attendance')) return 'Daily Attendance Log';
    if (path.startsWith('/salaries')) return 'Salaries & Payroll';
    if (path.startsWith('/reports')) return 'Analytics Reports';
    if (path.startsWith('/system')) return 'System Settings';
    return 'Crackers Manager';
  };

  const notifications = [
    { id: 1, text: "Low stock alert: Ground Chakkar (5 units left)", type: 'alert', time: '10m ago' },
    { id: 2, text: "Pending payroll: 4 employees waiting for June payout", type: 'warning', time: '1h ago' },
    { id: 3, text: "Attendance check: Worker checklist recorded with 2 absentees", type: 'info', time: '3h ago' },
    { id: 4, text: "Recent sales: Invoice #INV-1025 generated (₹4,890.00)", type: 'success', time: '4h ago' }
  ];

  return (
    <header className={`fixed top-0 right-0 transition-all duration-300 ${isCollapsed ? 'lg:left-20' : 'lg:left-[280px]'} h-16 glass-navbar z-30 flex items-center justify-between px-6 no-print`}>
      {/* Left side: Mobile Toggle & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar (Modern Search Experience) */}
        <div className="relative max-w-xs w-full hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Quick search... (⌘K)"
            className="w-full pl-9 pr-8 py-1.5 bg-muted/40 border border-border/80 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
            onKeyDown={(e) => {
              if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                alert('Search activated!');
              }
            }}
          />
          {searchVal && (
            <button
              onClick={() => setSearchVal('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:bg-muted/65 hover:text-foreground transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right side Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowQuickActions(!showQuickActions);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 flex items-center gap-1"
            title="Quick Action"
          >
            <PlusCircle className="w-5 h-5 text-indigo-500" />
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border/80 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-3 duration-200 space-y-1">
              <div className="px-3 py-1.5 text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2 mb-1">
                Quick Action Launcher
              </div>
              <Link
                to="/billing"
                onClick={() => setShowQuickActions(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-foreground hover:bg-muted/60 transition-all font-semibold"
              >
                <span className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="font-bold text-foreground">Create POS Bill</p>
                  <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Checkout customer orders</p>
                </div>
              </Link>
              <Link
                to="/products"
                onClick={() => setShowQuickActions(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-foreground hover:bg-muted/60 transition-all font-semibold"
              >
                <span className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="font-bold text-foreground">Add New Cracker</p>
                  <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Register product items</p>
                </div>
              </Link>
              <Link
                to="/workers"
                onClick={() => setShowQuickActions(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-foreground hover:bg-muted/60 transition-all font-semibold"
              >
                <span className="p-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="font-bold text-foreground">Add Employee Record</p>
                  <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Create team roster profiles</p>
                </div>
              </Link>
              <Link
                to="/system"
                onClick={() => setShowQuickActions(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-foreground hover:bg-muted/60 transition-all font-semibold border-t border-border/40 pt-2.5 mt-1"
              >
                <span className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                  <Database className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="font-bold text-foreground">Create DB Backup</p>
                  <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Backup ERP transaction databases</p>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Notifications Dropdown (low stock, pending salary, attendance, recent sales) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowQuickActions(false);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground relative transition-all duration-200"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-card rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="px-4 pb-2 border-b border-border/60 flex justify-between items-center">
                <span className="font-bold text-xs text-foreground">System Alerts</span>
                <span className="text-[10px] text-primary hover:underline cursor-pointer">Clear all</span>
              </div>
              <div className="divide-y divide-border/60 max-h-64 overflow-y-auto scrollbar-thin">
                {notifications.map((item) => (
                  <div key={item.id} className="p-3.5 hover:bg-muted/30 transition-colors flex gap-2.5 items-start">
                    {item.type === 'alert' && <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />}
                    {item.type === 'warning' && <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />}
                    {item.type === 'info' && <Info className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />}
                    {item.type === 'success' && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="text-xs text-foreground font-semibold leading-relaxed break-words">{item.text}</p>
                      <span className="text-[9px] text-muted-foreground mt-1 block font-medium">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        <span className="w-px h-6 bg-border" />

        {/* User Profile Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowQuickActions(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-muted/40 transition-all text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-600/10">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4.5 h-4.5" />}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-bold text-foreground leading-none">{user?.name}</p>
              <span className="text-[9px] font-bold text-muted-foreground mt-0.5 block uppercase">{user?.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="px-4 py-2 border-b border-border/60">
                <p className="text-xs font-bold text-foreground truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email || 'admin@smcrackers.com'}</p>
              </div>
              <Link
                to="/system"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-muted font-medium transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-500" /> Settings Panel
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 font-bold transition-colors border-t border-border/60 text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
