import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import { 
  BarChart3, Calendar, FileDown, TrendingUp, ShoppingBag, Receipt, IndianRupee, Tag, ShieldAlert, RotateCcw, Filter, Trophy, TrendingDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Reports = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st day of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Data States
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'product'

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/reports/sales.php?start_date=${startDate}&end_date=${endDate}`);
      if (res.data.status === 'success') {
        setData(res.data.data.report);
      } else {
        setError(res.data.message || 'Failed to fetch sales analytics.');
      }
    } catch (err) {
      setError('Error communicating with the database.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleApplyRange = (e) => {
    e.preventDefault();
    fetchReports();
  };

  // Export to CSV Functionality
  const handleExportCSV = () => {
    if (!data) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'daily') {
      csvContent += "Date,Orders Count,Revenue\n";
      data.daily_sales.forEach((day) => {
        csvContent += `${day.sale_date},${day.order_count},${day.daily_revenue}\n`;
      });
    } else {
      csvContent += "Product Name,Category,Quantity Sold,Revenue\n";
      data.product_sales.forEach((p) => {
        csvContent += `"${p.product_name}",${p.category_name || 'Crackers'},${p.quantity_sold},${p.total_revenue}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_sales_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Reports compilation to PDF
  const handleExportPDF = () => {
    if (!data) return;

    const doc = new jsPDF();

    // Title Block
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(29, 78, 216); // Deep Blue Primary
    doc.text('SM CRACKERS', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Sales Analytics Report (${startDate} to ${endDate})`, 14, 26);

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 32, 196, 32);

    // Summary aggregates table
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Sales Metrics Summary:', 14, 42);

    const summary = data.summary || {};
    const summaryHeaders = [['Total Orders', 'Subtotal', 'Discounts', 'GST Tax Collected', 'Convenience Fees', 'Net Revenue']];
    const summaryBody = [[
      summary.total_orders || 0,
      `INR ${Number(summary.total_subtotal).toFixed(2)}`,
      `INR ${Number(summary.total_discount).toFixed(2)}`,
      `INR ${Number(summary.total_tax).toFixed(2)}`,
      `INR ${Number(summary.total_fees).toFixed(2)}`,
      `INR ${Number(summary.total_revenue).toFixed(2)}`
    ]];

    doc.autoTable({
      startY: 46,
      head: summaryHeaders,
      body: summaryBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      margin: { left: 14, right: 14 }
    });

    // Product Sales performance table
    const productHeaders = [['Product Name', 'Category', 'Quantity Sold', 'Total Revenue']];
    const productBody = data.product_sales.map((p) => [
      p.product_name,
      p.category_name || 'Crackers',
      p.quantity_sold,
      `INR ${Number(p.total_revenue).toFixed(2)}`
    ]);

    doc.text('Product Sales Breakdown:', 14, doc.lastAutoTable.finalY + 12);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 16,
      head: productHeaders,
      body: productBody,
      theme: 'striped',
      headStyles: { fillColor: [29, 78, 216] }, // Deep Blue Primary
      margin: { left: 14, right: 14 }
    });

    // Save
    doc.save(`sales_report_${startDate}_to_${endDate}.pdf`);
  };

  const summary = data?.summary || {};

  const getOrdersTrend = () => {
    if (!data?.daily_sales || data.daily_sales.length === 0) return [0, 0];
    const arr = data.daily_sales.map(d => Number(d.order_count));
    return arr.length === 1 ? [0, arr[0]] : arr.reverse();
  };

  const getRevenueTrend = () => {
    if (!data?.daily_sales || data.daily_sales.length === 0) return [0, 0];
    const arr = data.daily_sales.map(d => Number(d.daily_revenue));
    return arr.length === 1 ? [0, arr[0]] : arr.reverse();
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header and Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Analytical Reports
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Review store performance indicators, analyze product trends, and export statements</p>
        </div>

        {/* Date Filters Form */}
        <form onSubmit={handleApplyRange} className="flex flex-wrap items-center gap-3 bg-card border border-border/80 px-4 py-2.5 rounded-2xl shadow-sm shrink-0 no-print">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>DATE RANGE:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-background border border-border rounded-xl text-xs text-foreground font-semibold px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
            required
          />
          <span className="text-xs text-muted-foreground font-bold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-background border border-border rounded-xl text-xs text-foreground font-semibold px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
            required
          />
          <button
            type="submit"
            className="btn-hover-effects bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all hover:opacity-95 shadow-sm shadow-blue-500/10 cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" /> Apply Filter
          </button>
        </form>
      </div>

      {/* Main Content Dashboard */}
      {loading ? (
        <div className="space-y-6">
          {/* Skeletons for Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border/80 rounded-2xl p-6 h-36 skeleton-box" />
            ))}
          </div>
          {/* Skeleton for Chart */}
          <div className="bg-card border border-border/80 rounded-2xl p-6 h-96 skeleton-box" />
          {/* Skeleton for Tab Table */}
          <div className="bg-card border border-border/80 rounded-2xl p-6 h-80 skeleton-box" />
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
          {error}
        </div>
      ) : data ? (
        <>
          {/* Summary aggregates row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Orders Placed"
              value={summary.total_orders || 0}
              icon={ShoppingBag}
              color="blue"
              trend={{ text: 'Orders Registry', positive: true }}
              sparklineData={getOrdersTrend()}
            />
            <StatCard
              title="Discounts Applied"
              value={`₹${Number(summary.total_discount).toLocaleString('en-IN')}`}
              icon={Tag}
              color="red"
              trend={{ text: 'Deductions', positive: false }}
            />
            <StatCard
              title="Tax Collected (GST)"
              value={`₹${Number(summary.total_tax).toLocaleString('en-IN')}`}
              icon={Receipt}
              color="amber"
              trend={{ text: 'CGST/SGST Split', positive: true }}
            />
            <StatCard
              title="Net Store Revenue"
              value={`₹${Number(summary.total_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={IndianRupee}
              color="blue"
              trend={{ text: 'Net store earnings', positive: true }}
              sparklineData={getRevenueTrend()}
            />
          </div>

          {/* Interactive Recharts Graphical Analytics Card */}
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {activeTab === 'daily' ? 'Revenue Analytics Curve' : 'Cracker Sales Performance Chart'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Interactive overview of data compiled from {startDate} to {endDate}</p>
              </div>
              <span className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-3.5 py-1.5 rounded-full font-bold border border-blue-500/10">
                {activeTab === 'daily' ? 'Sales Trendline' : 'Top Products'}
              </span>
            </div>
            
            <div className="h-80">
              {activeTab === 'daily' ? (
                data.daily_sales && data.daily_sales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...data.daily_sales].reverse()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReportSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#1E40AF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                      <XAxis 
                        dataKey="sale_date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={11} 
                        tickLine={false}
                        tickFormatter={(str) => {
                          try {
                            const date = new Date(str);
                            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                          } catch {
                            return str;
                          }
                        }}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '12px',
                          color: 'hsl(var(--foreground))'
                        }}
                        labelFormatter={(str) => new Date(str).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="daily_revenue" stroke="#1D4ED8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReportSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">No daily analytics available for the selected dates.</div>
                )
              ) : (
                data.product_sales && data.product_sales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.product_sales.slice(0, 10)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReportProduct" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1E40AF" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                      <XAxis dataKey="product_name" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '12px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Bar dataKey="total_revenue" fill="url(#colorReportProduct)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">No product ranking data available.</div>
                )
              )}
            </div>
          </div>

          {/* Breakdown Tabs and Action Toolbar */}
          <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-3">
              {/* Tab toggler */}
              <div className="flex bg-background border border-border p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('daily')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'daily'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Daily Revenue Logs
                </button>
                <button
                  onClick={() => setActiveTab('product')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'product'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Product Sales Rankings
                </button>
              </div>

              {/* Action Downloads */}
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 border border-border hover:bg-muted font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 text-foreground cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-muted-foreground" /> CSV Export
                </button>
                <button
                  onClick={handleExportPDF}
                  className="btn-hover-effects px-3.5 py-2 bg-gradient-to-r from-blue-700 to-indigo-800 hover:opacity-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/10 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" /> Full PDF Report
                </button>
              </div>
            </div>

            {/* Tab Body */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin">
              {activeTab === 'daily' ? (
                data.daily_sales.length > 0 ? (
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 bg-card z-10 border-b border-border/80 shadow-sm">
                      <tr className="text-muted-foreground font-semibold text-xs uppercase tracking-wider bg-muted/30">
                        <th className="px-6 py-4">Sale Date</th>
                        <th className="px-6 py-4 text-center">Orders Count</th>
                        <th className="px-6 py-4 text-right font-bold">Daily Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {data.daily_sales.map((day) => (
                        <tr key={day.sale_date} className="hover:bg-muted/15 transition-all duration-150">
                          <td className="px-6 py-4 font-bold text-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-muted-foreground/80" />
                              {new Date(day.sale_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-muted-foreground font-semibold">
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                              {day.order_count} transactions
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-foreground text-base">
                            ₹{Number(day.daily_revenue).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="w-8 h-8 text-muted-foreground/60" />
                    <p className="font-semibold text-sm">No transaction logs recorded in this period.</p>
                  </div>
                )
              ) : (
                data.product_sales.length > 0 ? (
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 bg-card z-10 border-b border-border/80 shadow-sm">
                      <tr className="text-muted-foreground font-semibold text-xs uppercase tracking-wider bg-muted/30">
                        <th className="px-6 py-4">Product Name</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4 text-center">Units Sold</th>
                        <th className="px-6 py-4 text-right font-bold">Product Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {data.product_sales.map((p, index) => (
                        <tr key={p.product_name} className="hover:bg-muted/15 transition-all duration-150">
                          <td className="px-6 py-4 font-bold text-foreground flex items-center gap-3">
                            {index < 3 ? (
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm ${
                                index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                                index === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300' :
                                'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                              }`}>
                                {index + 1}
                              </span>
                            ) : (
                              <span className="w-6 text-center text-muted-foreground font-semibold text-xs">{index + 1}</span>
                            )}
                            <span>{p.product_name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted rounded-full border border-border/40">
                              {p.category_name || 'Crackers'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-muted-foreground font-bold">{p.quantity_sold} units</td>
                          <td className="px-6 py-4 text-right font-extrabold text-foreground text-base">₹{Number(p.total_revenue).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="w-8 h-8 text-muted-foreground/60" />
                    <p className="font-semibold text-sm">No product sales logs recorded in this period.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Reports;
