import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';
import { 
  FileText, Search, Calendar, Filter, Printer, Download, Trash2, Ban, Eye, X, AlertCircle, RotateCcw, CreditCard, Banknote, Landmark, CheckCircle2, ArrowUpRight, Plus, Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Invoices = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  // URL search query helper
  const queryParams = new URLSearchParams(location.search);
  const searchParam = queryParams.get('search') || '';

  // States
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState(searchParam);
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Active Selected Invoice Details
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [activeItems, setActiveItems] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Cancellation / Deletion overlays
  const [cancelInvoiceItem, setCancelInvoiceItem] = useState(null);
  const [deleteInvoiceItem, setDeleteInvoiceItem] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (paymentMethod) params.append('payment_method', paymentMethod);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await api.get(`/billing/invoices.php?${params.toString()}`);
      if (res.data.status === 'success') {
        setInvoices(res.data.data.invoices);
      } else {
        setError(res.data.message || 'Failed to fetch invoices.');
      }
    } catch (err) {
      setError('Error communicating with server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [status, paymentMethod, startDate, endDate]); // Auto trigger on filter changes

  // Trigger search on enter or button click
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleOpenDetails = async (invoiceId) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/billing/get_invoice.php?id=${invoiceId}`);
      if (res.data.status === 'success') {
        setActiveInvoice(res.data.data.invoice);
        setActiveItems(res.data.data.items);
      } else {
        alert(res.data.message || 'Failed to load details.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching invoice details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!cancelInvoiceItem) return;
    try {
      const res = await api.delete(`/billing/invoices.php?id=${cancelInvoiceItem.id}&action=cancel`);
      if (res.data.status === 'success') {
        fetchInvoices();
        if (activeInvoice && activeInvoice.id === cancelInvoiceItem.id) {
          setActiveInvoice({ ...activeInvoice, status: 'Cancelled' });
        }
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error cancelling invoice.');
    } finally {
      setCancelInvoiceItem(null);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceItem) return;
    try {
      const res = await api.delete(`/billing/invoices.php?id=${deleteInvoiceItem.id}&action=delete`);
      if (res.data.status === 'success') {
        fetchInvoices();
        if (activeInvoice && activeInvoice.id === deleteInvoiceItem.id) {
          setActiveInvoice(null);
          setActiveItems([]);
        }
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting invoice.');
    } finally {
      setDeleteInvoiceItem(null);
    }
  };

  // PDF Generator using jsPDF and AutoTable
  const handleDownloadPDF = (invoice, items) => {
    const doc = new jsPDF();

    // 1. Header Details
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue Primary
    doc.text('SM CRACKERS', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Premium Crackers & Fireworks Shop', 14, 25);
    doc.text('Sivakasi, Tamil Nadu, India | Phone: +91 9876543210', 14, 30);

    // Separator Line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 34, 196, 34);

    // 2. Invoice Meta data
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('TAX INVOICE', 14, 43);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Invoice No: ${invoice.invoice_no}`, 14, 49);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleString('en-IN')}`, 14, 54);
    doc.text(`Status: ${invoice.status}`, 14, 59);

    // Billed To Info
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Billed To:', 130, 43);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(invoice.customer_name || 'Walk-in Customer', 130, 49);
    if (invoice.customer_phone) doc.text(`Phone: ${invoice.customer_phone}`, 130, 54);
    if (invoice.customer_address) doc.text(`Address: ${invoice.customer_address}`, 130, 59);

    // 3. Items Table
    const tableHeaders = [['Item Description', 'Category', 'Unit Price', 'Qty', 'Total']];
    const tableBody = items.map((item) => [
      item.product_name,
      item.category_name || 'Crackers',
      `INR ${Number(item.price).toFixed(2)}`,
      item.quantity,
      `INR ${Number(item.total).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 67,
      head: tableHeaders,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 14, right: 14 }
    });

    // 4. Calculations Summary (CGST/SGST split breakdown)
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('Helvetica', 'normal');
    
    // Subtotal, tax, discounts positioning
    doc.text('Subtotal:', 130, finalY);
    doc.text(`INR ${Number(invoice.subtotal).toFixed(2)}`, 168, finalY, { align: 'right' });

    doc.text('Discount:', 130, finalY + 5);
    doc.text(`- INR ${Number(invoice.discount).toFixed(2)}`, 168, finalY + 5, { align: 'right' });

    const halfTaxRate = Number(invoice.tax_rate) / 2;
    const halfTaxAmt = Number(invoice.tax_amount) / 2;

    doc.text(`CGST (${halfTaxRate}%):`, 130, finalY + 10);
    doc.text(`INR ${halfTaxAmt.toFixed(2)}`, 168, finalY + 10, { align: 'right' });

    doc.text(`SGST (${halfTaxRate}%):`, 130, finalY + 15);
    doc.text(`INR ${halfTaxAmt.toFixed(2)}`, 168, finalY + 15, { align: 'right' });

    doc.text('Convenience Fee:', 130, finalY + 20);
    doc.text(`INR ${Number(invoice.convenience_fee).toFixed(2)}`, 168, finalY + 20, { align: 'right' });

    // Grand total draw line & bold text
    doc.setDrawColor(226, 232, 240);
    doc.line(130, finalY + 23, 196, finalY + 23);
    
    doc.setFont('Helvetica', 'bold');
    doc.text('Grand Total:', 130, finalY + 29);
    doc.text(`INR ${Number(invoice.grand_total).toFixed(2)}`, 168, finalY + 29, { align: 'right' });

    // Footer
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for shopping at SM Crackers! Happy Diwali & Safe Celebrations!', 14, finalY + 50);

    // Save
    doc.save(`invoice_${invoice.invoice_no}.pdf`);
  };

  // Compute stats indicators
  const totalInvoices = invoices.length;
  const activeInvoices = invoices.filter(inv => inv.status !== 'Cancelled');
  const totalRevenue = activeInvoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0);
  const cancelledCount = invoices.filter(inv => inv.status === 'Cancelled').length;

  const getPaymentIcon = (method) => {
    switch (method?.toUpperCase()) {
      case 'CASH':
        return <Banknote className="w-4 h-4 text-emerald-500 animate-pulse" />;
      case 'UPI':
        return <Landmark className="w-4 h-4 text-purple-500" />;
      case 'CARD':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Invoices Registry
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Audit order calculations, download PDF invoices, and manage billing records</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/billing"
            className="btn-hover-effects bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm shadow-indigo-500/15"
          >
            <Plus className="w-4 h-4" /> Create Bill
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <StatCard 
          title="Total Invoices" 
          value={totalInvoices} 
          icon={FileText} 
          color="purple"
          trend={{ text: `${activeInvoices.length} Active Records`, positive: true }}
        />
        <StatCard 
          title="Total Sales Revenue" 
          value={`₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          icon={Banknote} 
          color="purple"
          trend={{ text: 'Excluding Cancelled', positive: true }}
        />
        <StatCard 
          title="Cancelled / Voided" 
          value={cancelledCount} 
          icon={AlertCircle} 
          color="red"
          trend={{ text: 'Stock Levels Restored', positive: false }}
        />
      </div>

      {/* Filter / Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm no-print space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Search Registry</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Invoice No / Customer name..."
                className="w-full pl-10 pr-9 py-2.5 bg-background border border-border hover:border-purple-500/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm text-foreground transition-all duration-200 outline-none font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Date range filters */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-background border border-border hover:border-purple-500/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm px-3.5 py-2.5 text-foreground transition-all duration-200 outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-background border border-border hover:border-purple-500/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm px-3.5 py-2.5 text-foreground transition-all duration-200 outline-none font-medium"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-background border border-border hover:border-purple-500/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm px-3 py-2.5 text-foreground transition-all duration-200 outline-none font-medium"
              >
                <option value="">All</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Payment</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-background border border-border hover:border-purple-500/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm px-3 py-2.5 text-foreground transition-all duration-200 outline-none font-medium"
              >
                <option value="">All</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end items-center gap-2 pt-2 border-t border-border/40">
          {(search || startDate || endDate || status || paymentMethod) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
                setStatus('');
                setPaymentMethod('');
              }}
              className="px-4 py-2 border border-border hover:bg-muted text-muted-foreground rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Clear Filters
            </button>
          )}
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-95 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-indigo-500/10 hover:shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Filter className="w-4 h-4" /> Apply Filters
          </button>
        </div>
      </form>

      {/* Registry Table Section */}
      <h3 className="text-lg font-bold text-foreground no-print">Invoice Registry logs</h3>

      {loading ? (
        <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden animate-pulse">
          <div className="h-12 bg-muted/40 border-b border-border/80" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-border/60 flex items-center justify-between px-6 space-x-4">
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-40 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
          {error}
        </div>
      ) : invoices.length > 0 ? (
        <div className="overflow-hidden border border-border/80 rounded-2xl shadow-sm bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/80 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Grand Total</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/15 transition-all duration-150">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <span className="font-mono text-xs text-primary bg-primary/5 dark:bg-primary/20 px-2.5 py-1 rounded-lg border border-primary/10">
                        {inv.invoice_no}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{inv.customer_name || 'Walk-in Customer'}</div>
                      {inv.customer_phone && <div className="text-[11px] text-muted-foreground mt-0.5">{inv.customer_phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
                        {new Date(inv.created_at).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground text-sm">
                      ₹{Number(inv.grand_total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/30 px-3 py-1 rounded-full w-fit">
                        {getPaymentIcon(inv.payment_method)}
                        {inv.payment_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        inv.status === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/10' 
                          : inv.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10'
                          : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-500/10'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          inv.status === 'Paid' ? 'bg-emerald-500' : inv.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right no-print">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetails(inv.id)}
                          className="p-2 border border-border hover:bg-muted hover:text-primary rounded-xl text-foreground transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {isAdmin && inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => setCancelInvoiceItem(inv)}
                            className="p-2 border border-amber-200 hover:bg-amber-500/10 rounded-xl text-amber-600 transition-all cursor-pointer"
                            title="Cancel Invoice & Restore Stock"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => setDeleteInvoiceItem(inv)}
                            className="p-2 border border-red-200 hover:bg-red-500/10 rounded-xl text-red-600 transition-all cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-2xl text-muted-foreground flex flex-col items-center justify-center gap-3">
          <FileText className="w-12 h-12 text-muted-foreground/40" />
          <p className="font-semibold text-sm">No invoices recorded matching filters.</p>
        </div>
      )}

      {/* Invoice Details Overlay Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:bg-white print:p-0 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none print:h-full flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border print:hidden shrink-0 bg-muted/10">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-foreground">Tax Invoice Details</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Invoice No: {activeInvoice.invoice_no}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveInvoice(null);
                  setActiveItems([]);
                }}
                className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Invoice Preview) */}
            <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin print-content flex-grow print:max-h-none print:overflow-visible print:p-0">
              
              {/* Premium Document Border Accent for Screen */}
              <div className="h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 -mx-6 -mt-6 print:hidden shrink-0" />

              {/* Billing Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-primary text-xl font-black tracking-wider">
                    SM CRACKERS
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground mt-1">Premium Crackers & Fireworks Shop</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">Sivakasi, Tamil Nadu, India | Phone: +91 9876543210</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest px-2.5 py-1 bg-purple-500/5 dark:bg-purple-500/20 rounded-md border border-purple-500/10">
                    TAX INVOICE
                  </span>
                  <div className="mt-3.5 space-y-0.5 text-xs">
                    <p className="text-muted-foreground">Invoice No: <span className="font-mono font-bold text-foreground">{activeInvoice.invoice_no}</span></p>
                    <p className="text-muted-foreground">Date: <span className="font-semibold text-foreground">{new Date(activeInvoice.created_at).toLocaleString('en-IN')}</span></p>
                    <p className="text-muted-foreground">Status: <span className={`font-bold ${
                      activeInvoice.status === 'Paid' ? 'text-emerald-500' : activeInvoice.status === 'Pending' ? 'text-amber-500' : 'text-rose-500'
                    }`}>{activeInvoice.status}</span></p>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-border/80" />

              {/* Billed info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs bg-muted/20 dark:bg-muted/5 p-4 rounded-2xl border border-border/40">
                <div>
                  <h5 className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] mb-2">Billed To</h5>
                  <p className="font-bold text-foreground text-sm">{activeInvoice.customer_name || 'Walk-in Customer'}</p>
                  {activeInvoice.customer_phone && <p className="text-muted-foreground mt-1">Phone: <span className="font-medium text-foreground">{activeInvoice.customer_phone}</span></p>}
                  {activeInvoice.customer_address && <p className="text-muted-foreground mt-0.5">Address: <span className="font-medium text-foreground">{activeInvoice.customer_address}</span></p>}
                </div>
                <div>
                  <h5 className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] mb-2">Billing Information</h5>
                  <p className="text-muted-foreground">Payment Method: <span className="font-semibold text-foreground">{activeInvoice.payment_method}</span></p>
                  <p className="text-muted-foreground mt-1">Billing Operator: <span className="font-semibold text-foreground">{activeInvoice.billing_staff || 'System'}</span></p>
                </div>
              </div>

              {/* Items List */}
              <div className="overflow-hidden border border-border/80 rounded-2xl shadow-sm bg-card">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/80">
                      <th className="px-4 py-3">Item Description</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {activeItems.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {item.product_name}
                          <span className="block text-[9px] text-muted-foreground font-normal mt-0.5">
                            {item.category_name || 'Crackers'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground font-mono">₹{Number(item.price).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center font-semibold text-foreground">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-bold text-foreground font-mono">₹{Number(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Breakdown (CGST / SGST displays) */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="text-[11px] text-muted-foreground/80 border border-border/60 p-3.5 rounded-xl max-w-sm sm:mt-0 mt-2">
                  <h6 className="font-bold text-foreground uppercase tracking-widest text-[9px] mb-1">Declarations & Notes</h6>
                  <p>1. Certified that the products listed above are manufactured & stored according to safety specifications.</p>
                  <p className="mt-1">2. This is a computer generated document, no physical signature required.</p>
                </div>
                
                <div className="w-full sm:w-72 text-xs space-y-2.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{Number(activeInvoice.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(activeInvoice.discount) > 0 && (
                    <div className="flex justify-between text-rose-500 font-medium">
                      <span>Discount:</span>
                      <span className="font-mono">-₹{Number(activeInvoice.discount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(activeInvoice.tax_amount) > 0 && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>CGST ({(Number(activeInvoice.tax_rate) / 2).toFixed(1)}%):</span>
                        <span className="font-mono">₹{(Number(activeInvoice.tax_amount) / 2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>SGST ({(Number(activeInvoice.tax_rate) / 2).toFixed(1)}%):</span>
                        <span className="font-mono">₹{(Number(activeInvoice.tax_amount) / 2).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {Number(activeInvoice.convenience_fee) > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Convenience Fee:</span>
                      <span className="font-mono">₹{Number(activeInvoice.convenience_fee).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-base text-foreground pt-3 border-t border-dashed border-border/80">
                    <span>Grand Total:</span>
                    <span className="font-mono text-lg text-primary">₹{Number(activeInvoice.grand_total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-border/80" />

              {/* Thank You Note */}
              <div className="text-center py-2 space-y-1">
                <p className="text-xs font-semibold text-foreground">Thank you for shopping at SM Crackers!</p>
                <p className="text-[10px] text-muted-foreground">Wish you a Happy Diwali & Safe Celebrations!</p>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-muted/20 border-t border-border print:hidden shrink-0">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 text-sm font-semibold border border-border hover:bg-muted text-foreground rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => handleDownloadPDF(activeInvoice, activeItems)}
                className="px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-95 text-white rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-indigo-500/10 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Overlays */}
      <ConfirmModal
        isOpen={!!cancelInvoiceItem}
        title="Cancel Invoice?"
        message={`Are you sure you want to cancel Invoice ${cancelInvoiceItem?.invoice_no}? This will mark it as Cancelled and return all item quantities back to product stock levels.`}
        onConfirm={handleCancelInvoice}
        onCancel={() => setCancelInvoiceItem(null)}
        confirmText="Cancel Invoice"
        cancelText="Keep Invoice"
        type="danger"
      />

      <ConfirmModal
        isOpen={!!deleteInvoiceItem}
        title="Delete Invoice permanently?"
        message={`Are you sure you want to permanently delete Invoice ${deleteInvoiceItem?.invoice_no}? This deletes the invoice history from the system and restores product stock levels. This cannot be undone.`}
        onConfirm={handleDeleteInvoice}
        onCancel={() => setDeleteInvoiceItem(null)}
        confirmText="Delete Permanently"
        cancelText="Keep Invoice"
        type="danger"
      />
    </div>
  );
};

export default Invoices;
