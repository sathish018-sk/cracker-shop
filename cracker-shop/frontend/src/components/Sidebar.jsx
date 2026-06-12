import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Package,
  Database,
  Users,
  Briefcase,
  ClipboardList,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'], accent: 'text-blue-400' },
    { name: 'Billing POS', path: '/billing', icon: Receipt, roles: ['admin', 'staff'], accent: 'text-indigo-400' },
    { name: 'Invoices', path: '/invoices', icon: FileText, roles: ['admin', 'staff'], accent: 'text-violet-400' },
    { name: 'Products', path: '/products', icon: Package, roles: ['admin', 'staff'], accent: 'text-emerald-400' },
    { name: 'Inventory', path: '/inventory', icon: Database, roles: ['admin', 'staff'], accent: 'text-amber-400' },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'staff'], accent: 'text-orange-400' },
    { name: 'Workers Roster', path: '/workers', icon: Briefcase, roles: ['admin', 'staff'], accent: 'text-cyan-400' },
    { name: 'Attendance', path: '/attendance', icon: ClipboardList, roles: ['admin', 'staff'], accent: 'text-green-400' },
    { name: 'Salaries Payroll', path: '/salaries', icon: Wallet, roles: ['admin', 'staff'], accent: 'text-fuchsia-400' },
    { name: 'Analytics Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'staff'], accent: 'text-sky-400' },
    { name: 'System Settings', path: '/system', icon: Settings, roles: ['admin'], accent: 'text-slate-400' },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  // Premium glass overlay navigation active states
  const activeLink = `flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white font-bold border-l-4 border-accent shadow-lg shadow-black/10 transition-all duration-200 scale-[1.02] ${isCollapsed ? 'justify-center border-l-0 bg-white/15' : ''}`;
  const inactiveLink = `flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-semibold transition-all duration-200 hover:scale-[1.01] ${isCollapsed ? 'justify-center' : ''}`;

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-sidebar-gradient border-r border-slate-800/40 flex flex-col transition-all duration-300 lg:translate-x-0 ${
          isCollapsed ? 'w-20' : 'w-[280px]'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className={`h-16 border-b border-slate-800/40 flex items-center gap-3 px-6 shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-btn-primary flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-in fade-in duration-200 uppercase">
              SM Crackers
            </span>
          )}
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : ''}
              onClick={() => {
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={({ isActive }) => (isActive ? activeLink : inactiveLink)}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform ${isActive ? 'scale-110 ' + item.accent : 'text-slate-400 group-hover:text-white'}`} />
                  {!isCollapsed && (
                    <span className="text-xs tracking-wider uppercase animate-in fade-in duration-200">{item.name}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Section */}
        <div className="p-4 border-t border-slate-800/40 space-y-2 shrink-0">
          {/* Collapse Button for desktop */}
          <button
            onClick={toggleCollapse}
            className={`hidden lg:flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white font-semibold transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-xs uppercase tracking-wider">Collapse Menu</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-950/20 font-semibold transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="text-xs uppercase tracking-wider">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
