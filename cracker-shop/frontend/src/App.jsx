import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Invoices from './pages/Invoices';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Workers from './pages/Workers';
import Attendance from './pages/Attendance';
import Salaries from './pages/Salaries';
import Reports from './pages/Reports';
import System from './pages/System';

// Layout wrapper for authenticated routes
const ProtectedLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapsible mode state

  // If not authenticated, redirect to Login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Collapsible Sidebar */}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        toggleSidebar={toggleMobileSidebar} 
        isCollapsed={isCollapsed} 
        toggleCollapse={toggleCollapse} 
      />

      {/* Main Container */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-[280px]'}`}>
        {/* Top Navbar Header */}
        <Navbar 
          toggleSidebar={toggleMobileSidebar} 
          isCollapsed={isCollapsed} 
          toggleCollapse={toggleCollapse} 
        />
        
        {/* Main Content Area */}
        <main className="flex-1 mt-16 overflow-y-auto bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Unprotected Auth Login Route */}
            <Route path="/" element={<Login />} />

            {/* Protected App ERP Routes */}
            <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/billing" element={<ProtectedLayout><Billing /></ProtectedLayout>} />
            <Route path="/invoices" element={<ProtectedLayout><Invoices /></ProtectedLayout>} />
            <Route path="/products" element={<ProtectedLayout><Products /></ProtectedLayout>} />
            <Route path="/inventory" element={<ProtectedLayout><Inventory /></ProtectedLayout>} />
            <Route path="/customers" element={<ProtectedLayout><Customers /></ProtectedLayout>} />
            <Route path="/workers" element={<ProtectedLayout><Workers /></ProtectedLayout>} />
            <Route path="/attendance" element={<ProtectedLayout><Attendance /></ProtectedLayout>} />
            <Route path="/salaries" element={<ProtectedLayout><Salaries /></ProtectedLayout>} />
            <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
            <Route path="/system" element={<ProtectedLayout><System /></ProtectedLayout>} />

            {/* Catch-all Wildcard Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
