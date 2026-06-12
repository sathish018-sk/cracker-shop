import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import {
  IndianRupee,
  Users,
  Package,
  AlertTriangle,
  Receipt,
  ArrowRight,
  TrendingUp,
  Boxes,
  Sparkles,
  Plus,
  PlusCircle,
  ClipboardList,
  Wallet,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/dashboard/stats.php');
      if (response.data.status === 'success') {
        setData(response.data.data.stats);
      } else {
        setError(response.data.message || 'Failed to fetch dashboard stats.');
      }
    } catch (err) {
      setError('Error communicating with the database.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return <Loader size="lg" className="min-h-[60vh]" />;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl p-6 inline-block max-w-md border border-red-100 dark:border-red-900/30">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-600 dark:text-red-400" />
          <h3 className="font-bold text-lg">Error</h3>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    total_products = 0,
    low_stock_count = 0,
    total_sales = 0,
    monthly_sales = 0,
    total_workers = 0,
    workers_present_today = 0,
    recent_invoices = [],
    sales_chart = [],
    category_chart = []
  } = data || {};

  const COLORS = ['#2563EB', '#4F46E5', '#3B82F6', '#6366F1', '#1D4ED8', '#4338CA'];

  // Current Date string formatting
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* 1. Premium Welcome Banner */}
      <div className="bg-brand-gradient rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-500/10">
        <div className="absolute inset-0 bg-grid-white/[0.04] pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="z-10 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/15 w-fit rounded-full text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Enterprise ERP System
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
              Welcome back, {user?.name || 'Admin'}
            </h2>
            <p className="text-blue-100/90 text-xs md:text-sm max-w-xl leading-relaxed">
              Manage cracker inventory listings, POS counter collections, staff check-ins, and analytics reports.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 bg-slate-950/20 border border-white/15 px-4 py-3 rounded-2xl backdrop-blur-sm">
            <Calendar className="w-4.5 h-4.5 text-indigo-300" />
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">System Date</p>
              <p className="text-xs font-bold text-white mt-0.5">{getFormattedDate()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Standardized Quick Actions Panel (Page Title quick actions requirements) */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3.5">Quick Actions Launcher</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            to="/products"
            className="bg-card border border-border/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group"
          >
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Add Product</span>
          </Link>
          <Link
            to="/billing"
            className="bg-card border border-border/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group"
          >
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Create POS Bill</span>
          </Link>
          <Link
            to="/attendance"
            className="bg-card border border-border/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group"
          >
            <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-xl group-hover:scale-110 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Mark Attendance</span>
          </Link>
          <Link
            to="/salaries"
            className="bg-card border border-border/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group"
          >
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Generate Salary</span>
          </Link>
          <Link
            to="/reports"
            className="bg-card border border-border/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer col-span-2 sm:col-span-1 group"
          >
            <div className="p-3 bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 rounded-xl group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-foreground">View Reports</span>
          </Link>
        </div>
      </div>

      {/* 3. Redesigned Premium Gradient Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Store Sales"
          value={`₹${Number(total_sales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={IndianRupee}
          color="blue"
          trend={{ text: 'Aggregate revenue', positive: true }}
          sparklineData={[12000, 19000, 15000, 24000, 32000, 28000, total_sales > 0 ? total_sales / 20 : 42000]}
        />
        <StatCard
          title="This Month's Sales"
          value={`₹${Number(monthly_sales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="indigo"
          trend={{ text: 'Current billing month', positive: true }}
          sparklineData={[8000, 11000, 9500, 14000, 18000, 16000, monthly_sales > 0 ? monthly_sales / 15 : 22000]}
        />
        <StatCard
          title="Workers Today"
          value={`${workers_present_today} / ${total_workers}`}
          icon={Users}
          color="amber"
          trend={{ text: 'Active roster check' }}
          sparklineData={[10, 12, 11, 14, 13, 14, workers_present_today]}
        />
        <StatCard
          title="Low Stock Alerts"
          value={`${low_stock_count} / ${total_products} items`}
          icon={Package}
          color="green"
          trend={{ text: 'Inventory flags' }}
          sparklineData={[8, 6, 9, 5, 4, 3, low_stock_count]}
        />
      </div>

      {/* 4. Charts Section (Consistent heights) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-96">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-base text-foreground">Sales Revenue Trend</h3>
              <p className="text-[10px] text-muted-foreground">Monthly shop transaction history logs</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-semibold border border-border/40">6 Months Overview</span>
          </div>
          <div className="h-64 flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-96">
          <div>
            <h3 className="font-bold text-base text-foreground">Sales by Category</h3>
            <p className="text-[10px] text-muted-foreground">Revenue breakdown by cracker type</p>
          </div>
          <div className="h-64 flex-grow flex flex-col justify-center">
            {category_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={category_chart}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="category"
                  >
                    {category_chart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <Boxes className="w-10 h-10 text-muted-foreground/40" />
                <span>No checkout sales recorded yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Recent Invoices (Premium Table component) */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Transactions Registry</h3>
        
        <div className="overflow-hidden border border-border/80 rounded-2xl shadow-sm bg-card">
          <div className="overflow-x-auto">
            {recent_invoices.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/80 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Invoice No</th>
                    <th className="px-6 py-4">Customer Details</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4 text-right">Grand Total</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recent_invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/15 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/invoices?search=${inv.invoice_no}`} className="font-mono text-xs text-primary bg-primary/5 dark:bg-primary/20 px-2.5 py-1 rounded-lg border border-primary/10 hover:underline">
                          {inv.invoice_no}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {inv.customer_name || 'Walk-in Customer'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs font-semibold">
                        {new Date(inv.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground text-right text-base">
                        ₹{Number(inv.grand_total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                          inv.status === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                            : inv.status === 'Pending'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            inv.status === 'Paid' ? 'bg-emerald-500' : inv.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Receipt className="w-10 h-10 text-muted-foreground/40" />
                <span className="font-semibold">No invoices generated yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
