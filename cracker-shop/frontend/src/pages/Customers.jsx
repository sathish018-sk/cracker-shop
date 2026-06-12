import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserPlus, Search, Edit, Eye, X, Receipt, ShoppingBag, Calendar, IndianRupee, Trash2, Award, ArrowUpRight, TrendingUp, Sparkles, MapPin, Phone, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Customers = () => {
  const { isAdmin } = useAuth();

  // States
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Add/Edit Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Deletion Modal
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/customers/index.php?search=${search}`);
      if (res.data.status === 'success') {
        setCustomers(res.data.data.customers);
      } else {
        setError(res.data.message || 'Failed to fetch customer logs.');
      }
    } catch (err) {
      setError('Error communicating with backend database.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setEmail(cust.email || '');
    setAddress(cust.address || '');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      setModalError('Customer Name and Phone are required.');
      return;
    }

    setSaving(true);
    setModalError('');

    try {
      const payload = {
        name,
        phone,
        email: email || null,
        address: address || null
      };

      if (editingCustomer) {
        const res = await api.put('/customers/index.php', { ...payload, id: editingCustomer.id });
        if (res.data.status !== 'success') throw new Error(res.data.message);
      } else {
        const res = await api.post('/customers/index.php', payload);
        if (res.data.status !== 'success') throw new Error(res.data.message);
      }

      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Error saving customer.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenHistory = async (cust) => {
    setHistoryCustomer(cust);
    setPurchaseHistory([]);
    setLoadingHistory(true);
    setIsHistoryOpen(true);
    
    try {
      const res = await api.get(`/customers/history.php?customer_id=${cust.id}`);
      if (res.data.status === 'success') {
        setPurchaseHistory(res.data.data.orders);
      } else {
        alert(res.data.message || 'Failed to load purchase logs.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching customer purchase logs.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteConfirmItem) return;
    try {
      const res = await api.delete(`/customers/index.php?id=${deleteConfirmItem.id}`);
      if (res.data.status === 'success') {
        fetchCustomers();
      } else {
        alert(res.data.message || 'Failed to delete customer.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting customer record.');
    } finally {
      setDeleteConfirmItem(null);
    }
  };

  // Loyalty Program Config helper
  const getLoyaltyDetails = (spent) => {
    const total = Number(spent || 0);
    if (total >= 15000) {
      return {
        tier: 'Gold Elite',
        color: 'from-amber-500 to-yellow-600',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        points: Math.floor(total / 100)
      };
    } else if (total >= 5000) {
      return {
        tier: 'Silver Pro',
        color: 'from-slate-400 to-slate-600',
        badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        points: Math.floor(total / 100)
      };
    } else {
      return {
        tier: 'Bronze Member',
        color: 'from-orange-400 to-amber-600',
        badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        points: Math.floor(total / 100)
      };
    }
  };

  // Statistics Computations
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((acc, c) => acc + Number(c.total_spent || 0), 0);
  const totalOrdersCount = customers.reduce((acc, c) => acc + Number(c.total_orders || 0), 0);
  
  const goldCustomersCount = customers.filter(c => Number(c.total_spent || 0) >= 15000).length;
  const silverCustomersCount = customers.filter(c => {
    const spent = Number(c.total_spent || 0);
    return spent >= 5000 && spent < 15000;
  }).length;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Customer Relationship Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor loyalty tiers, inspect order histories, and manage store clients</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="btn-hover-effects bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm shadow-orange-500/15"
          >
            <UserPlus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Clients" 
          value={totalCustomers} 
          icon={Users} 
          color="amber"
          trend={{ text: 'Total in database', positive: true }}
        />
        <StatCard 
          title="Total Sales Value" 
          value={`₹${totalRevenue.toLocaleString('en-IN')}`} 
          icon={IndianRupee} 
          color="amber"
          trend={{ text: `${totalOrdersCount} Total Invoices`, positive: true }}
        />
        <StatCard 
          title="Gold Elite Tier" 
          value={goldCustomersCount} 
          icon={Award} 
          color="amber"
          trend={{ text: 'Spent ≥ ₹15,000', positive: true }}
        />
        <StatCard 
          title="Silver Pro Tier" 
          value={silverCustomersCount} 
          icon={Sparkles} 
          color="amber"
          trend={{ text: 'Spent ₹5k - ₹15k', positive: true }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h3 className="text-lg font-bold text-foreground self-start md:self-center">Customer Insights</h3>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name or phone number..."
            className="w-full pl-10 pr-9 py-2.5 bg-card border border-border/80 hover:border-orange-500/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-sm transition-all outline-none font-medium text-foreground"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid / Database Listing */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border/80 rounded-2xl p-6 h-56 space-y-4 skeleton-box" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
          {error}
        </div>
      ) : customers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {customers.map((cust) => {
            const loyalty = getLoyaltyDetails(cust.total_spent);
            return (
              <div 
                key={cust.id} 
                className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between space-y-4"
              >
                {/* Header Profile Initials & Tier */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${loyalty.color} text-white font-extrabold flex items-center justify-center shadow-md shadow-orange-500/10`}>
                      {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-foreground leading-tight">{cust.name}</h4>
                      <span className="text-[10px] text-muted-foreground mt-1 block">Member since: {new Date(cust.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${loyalty.badge}`}>
                    {loyalty.tier}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-xs border-t border-b border-border/40 py-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    <span className="font-semibold text-foreground">{cust.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    <span className="truncate font-medium text-foreground">{cust.email || 'No email associated'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    <span className="truncate font-medium text-foreground">{cust.address || 'No address logged'}</span>
                  </div>
                </div>

                {/* Spending aggregate specs */}
                <div className="grid grid-cols-2 gap-4 bg-muted/20 border border-border/40 rounded-xl p-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Orders</p>
                    <p className="font-extrabold text-sm text-foreground mt-0.5">{cust.total_orders}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Spent</p>
                    <p className="font-extrabold text-sm text-foreground mt-0.5">₹{Number(cust.total_spent).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleOpenHistory(cust)}
                    className="flex-1 py-2 px-3 border border-border hover:border-orange-500/20 hover:bg-orange-500/5 rounded-xl text-orange-600 dark:text-orange-400 font-bold text-xs flex justify-center items-center gap-1.5 transition-all"
                  >
                    <Eye className="w-4 h-4" /> Purchase History
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(cust)}
                    className="px-3 py-2 border border-border hover:bg-muted rounded-xl text-foreground font-semibold text-xs flex justify-center items-center transition-colors"
                    title="Edit Customer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteConfirmItem(cust)}
                      className="px-3 py-2 border border-border hover:border-red-500/20 hover:bg-red-500/5 rounded-xl text-red-500 font-semibold text-xs flex justify-center items-center transition-colors"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-2xl text-muted-foreground flex flex-col items-center justify-center gap-3">
          <Users className="w-10 h-10 text-muted-foreground/30" />
          <div>
            <p className="font-bold text-foreground">No customer records found</p>
            <p className="text-xs text-muted-foreground mt-1">Try refining your search keyword or register a new customer</p>
          </div>
        </div>
      )}

      {/* Add / Edit Modal Sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">
                {editingCustomer ? 'Edit Customer Details' : 'Register New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold leading-normal animate-shake">
                  {modalError}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border hover:border-orange-500/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-medium text-foreground"
                  placeholder="e.g. Ramesh Patel"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-background border border-border hover:border-orange-500/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-medium text-foreground"
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border hover:border-orange-500/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-medium text-foreground"
                  placeholder="e.g. ramesh@yahoo.com"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Billing Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="3"
                  className="w-full bg-background border border-border hover:border-orange-500/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-medium text-foreground"
                  placeholder="Street name, City, State..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-border rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm shadow-orange-500/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal Sheet (Visual Purchase Timeline Graphics) */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10 shrink-0">
              <div>
                <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-500" /> Purchase Timeline
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Chronological invoice timeline for <b>{historyCustomer?.name}</b></p>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Timeline Wrapper) */}
            <div className="p-6 overflow-y-auto scrollbar-thin flex-1 bg-muted/5">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader size="lg" />
                  <p className="text-xs text-muted-foreground font-semibold">Retrieving purchase logs...</p>
                </div>
              ) : purchaseHistory.length > 0 ? (
                <div className="relative border-l border-border/80 dark:border-zinc-800 ml-4 pl-6 space-y-6 pb-2">
                  {purchaseHistory.map((order) => (
                    <div key={order.id} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-card border-2 border-orange-500 group-hover:bg-orange-500 group-hover:scale-110 transition-all duration-200" />
                      
                      {/* Timeline Card */}
                      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-orange-500/25 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="font-extrabold text-sm text-foreground">{order.invoice_no}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'Paid' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : order.status === 'Pending'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground/60" /> {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-muted-foreground/60" /> {order.payment_method}</span>
                          </div>
                        </div>

                        {/* Amount & Direct view */}
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-border/40 pt-3 sm:pt-0">
                          <div className="sm:text-right">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Value</p>
                            <p className="font-extrabold text-sm text-foreground mt-0.5">₹{Number(order.grand_total).toFixed(2)}</p>
                          </div>
                          
                          <Link
                            to={`/invoices?search=${order.invoice_no}`}
                            className="py-1.5 px-3 border border-border hover:border-orange-500/30 hover:bg-orange-500/5 font-extrabold text-xs text-orange-600 dark:text-orange-400 rounded-lg flex items-center gap-1 transition-all"
                          >
                            View Receipt <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/35" />
                  <div>
                    <p className="font-bold text-foreground">No Purchases Yet</p>
                    <p className="text-xs text-muted-foreground mt-1">This customer hasn't checked out any orders yet</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end shrink-0">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-2 bg-card hover:bg-muted text-foreground border border-border rounded-xl text-sm font-semibold transition-all"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmItem}
        title="Delete Customer Profile?"
        message={`Are you sure you want to delete the records of ${deleteConfirmItem?.name}? All loyalty statistics will be purged from the database permanently.`}
        onConfirm={handleDeleteCustomer}
        onCancel={() => setDeleteConfirmItem(null)}
        confirmText="Delete Profile"
        cancelText="Keep Profile"
        type="danger"
      />
    </div>
  );
};

export default Customers;
