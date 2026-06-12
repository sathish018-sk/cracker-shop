import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { 
  Database, RefreshCw, AlertTriangle, Plus, X, AlertCircle, CheckCircle2, Search, Filter, Layers, ArrowUpRight, ArrowDownRight, Edit3
} from 'lucide-react';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering
  const [filterType, setFilterType] = useState('all'); // 'all', 'low'
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add', 'subtract'
  const [reason, setReason] = useState('Manual audit count');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/inventory/index.php');
      if (res.data.status === 'success') {
        setInventory(res.data.data.inventory);
      } else {
        setError(res.data.message || 'Failed to fetch inventory.');
      }
    } catch (err) {
      setError('Error communicating with the server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdjustmentModal = (prodId = '') => {
    setSelectedProductId(prodId);
    setAdjustmentQuantity('');
    setAdjustmentType('add');
    setReason('Manual count adjustment');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !adjustmentQuantity) {
      setModalError('Product and adjustment quantity are required.');
      return;
    }

    const qty = parseInt(adjustmentQuantity);
    if (qty <= 0) {
      setModalError('Quantity must be greater than zero.');
      return;
    }

    setSaving(true);
    setModalError('');

    try {
      const finalAdjustment = adjustmentType === 'add' ? qty : -qty;

      const res = await api.post('/inventory/index.php', {
        product_id: parseInt(selectedProductId),
        adjustment: finalAdjustment,
        reason
      });

      if (res.data.status === 'success') {
        setIsModalOpen(false);
        fetchInventory();
      } else {
        setModalError(res.data.message || 'Stock adjustment failed.');
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error saving stock adjustment.');
    } finally {
      setSaving(false);
    }
  };

  // Filter list
  const filteredInventory = inventory.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        (item.category_name && item.category_name.toLowerCase().includes(search.toLowerCase()));
    
    const isLow = Number(item.stock) <= Number(item.min_stock);
    const matchFilter = filterType === 'all' || (filterType === 'low' && isLow);

    return matchSearch && matchFilter;
  });

  // Pagination calculations
  const totalItems = filteredInventory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  // Compute products stock statistics
  const totalItemsCount = inventory.length;
  const criticalItemsCount = inventory.filter(item => Number(item.stock) <= Number(item.min_stock)).length;
  const healthyItemsCount = totalItemsCount - criticalItemsCount;

  return (
    <div className="p-6 space-y-6">
      
      {/* Header (Page Title Quick Actions) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Database className="w-6 h-6 text-amber-500" />
            Inventory & Stock Alerts
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor low stock thresholds, perform manual stock counts, and restock alerts</p>
        </div>
        <button
          onClick={() => handleOpenAdjustmentModal()}
          className="bg-btn-secondary hover:opacity-95 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm shadow-indigo-500/10 transition-all duration-200 cursor-pointer btn-hover-effects"
        >
          <Plus className="w-4 h-4" /> Quick Stock Adjust
        </button>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-blue-500">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Items Logged</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{totalItemsCount} crackers</h3>
          </div>
        </div>

        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Healthy Stock Levels</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{healthyItemsCount} products</h3>
          </div>
        </div>

        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-amber-500">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Critical Alerts</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{criticalItemsCount} low stock alerts</h3>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card border border-border/80 p-5 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or category..."
            className="w-full pl-10 pr-10 py-2.5 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs text-foreground transition-all outline-none font-semibold"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:bg-muted/65 hover:text-foreground transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Stock Level Filter */}
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs px-3.5 py-2.5 text-foreground transition-all outline-none font-semibold"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock Alerts Only</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchInventory}
          className="w-full border border-border hover:bg-muted font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all text-foreground cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Inventory Overview Block */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inventory Overview</h3>

        {loading ? (
          <div className="space-y-4">
            <div className="h-12 skeleton-box rounded-xl" />
            <div className="h-40 skeleton-box rounded-2xl" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
            {error}
          </div>
        ) : paginatedInventory.length > 0 ? (
          <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/80 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Cracker Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-center">Min Threshold</th>
                    <th className="px-6 py-4 text-center">Current Stock</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedInventory.map((item) => {
                    const isLow = Number(item.stock) <= Number(item.min_stock);
                    return (
                      <tr key={item.id} className="hover:bg-muted/15 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">{item.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted rounded-full border border-border/40">
                            {item.category_name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-muted-foreground font-mono font-semibold">{item.min_stock} units</td>
                        <td className={`px-6 py-4 text-center font-extrabold font-mono ${isLow ? 'text-rose-500' : 'text-foreground'}`}>
                          {item.stock} units
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                              <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Available
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right no-print">
                          <button
                            onClick={() => handleOpenAdjustmentModal(item.id)}
                            className="px-3.5 py-2 border border-border hover:bg-muted text-foreground rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" /> Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-card border border-border border-dashed rounded-2xl text-muted-foreground flex flex-col items-center justify-center gap-3">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/60 animate-bounce" />
            <p className="font-semibold text-sm">No inventory stock logs matching filters.</p>
          </div>
        )}

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center bg-card border border-border/80 px-5 py-4 rounded-2xl shadow-sm no-print">
            <span className="text-xs text-muted-foreground font-semibold">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-all disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-all disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjustment Modal Sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">Manual Stock Adjustment</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Product Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Select Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Current: {item.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Adjustment Operation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('add')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      adjustmentType === 'add'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Add Stock (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('subtract')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      adjustmentType === 'subtract'
                        ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Subtract Stock (-)
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                  placeholder="0"
                  required
                />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                  placeholder="e.g. Audit correction / Damaged items"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-border rounded-xl transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-btn-primary hover:opacity-95 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm shadow-indigo-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Adjusting...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
