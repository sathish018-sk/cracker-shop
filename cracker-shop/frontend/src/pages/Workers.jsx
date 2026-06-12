import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Users, Plus, Search, Edit, Trash2, X, Upload, AlertCircle, Briefcase, Phone, CreditCard, ImageIcon, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck, Mail, ClipboardList, Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Workers = () => {
  const { isAdmin } = useAuth();

  // States
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  // Form Fields
  const [workerId, setWorkerId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [salaryType, setSalaryType] = useState('Daily');
  const [salaryRate, setSalaryRate] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Confirm delete overlay
  const [deleteWorkerItem, setDeleteWorkerItem] = useState(null);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/workers/index.php?search=${search}&status=${statusFilter}`);
      if (res.data.status === 'success') {
        setWorkers(res.data.data.workers);
      } else {
        setError(res.data.message || 'Failed to fetch workers roster.');
      }
    } catch (err) {
      setError('Error communicating with server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [statusFilter]); // Trigger on status filter toggle

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWorkers();
  };

  const handleOpenAddModal = () => {
    setEditingWorker(null);
    setWorkerId(`WRK${String(workers.length + 1).padStart(3, '0')}`); // Auto code suggestion
    setName('');
    setPhone('');
    setRole('');
    setSalaryType('Daily');
    setSalaryRate('');
    setAadhaar('');
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (wrk) => {
    setEditingWorker(wrk);
    setWorkerId(wrk.worker_id);
    setName(wrk.name);
    setPhone(wrk.phone);
    setRole(wrk.role);
    setSalaryType(wrk.salary_type);
    setSalaryRate(wrk.salary_rate);
    setAadhaar(wrk.aadhaar);
    setImageFile(null);
    setImagePreview(wrk.image_url ? `http://localhost/smcrackers/cracker-shop/backend/${wrk.image_url}` : '');
    setImageUrl(wrk.image_url || '');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveWorker = async (e) => {
    e.preventDefault();
    if (!workerId || !name || !phone || !role || !aadhaar || !salaryRate) {
      setModalError('All fields are required.');
      return;
    }

    setSaving(true);
    setModalError('');

    try {
      let finalImageUrl = imageUrl;

      // 1. Upload photo if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const uploadRes = await api.post('/products/upload_image.php', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (uploadRes.data.status === 'success') {
          finalImageUrl = uploadRes.data.data.image_url;
        } else {
          throw new Error(uploadRes.data.message || 'Failed to upload image.');
        }
      }

      // 2. Add or Edit details
      const payload = {
        worker_id: workerId,
        name,
        phone,
        role,
        salary_type: salaryType,
        salary_rate: parseFloat(salaryRate),
        aadhaar,
        image_url: finalImageUrl
      };

      if (editingWorker) {
        // Edit Mode
        const res = await api.put('/workers/index.php', { ...payload, id: editingWorker.id, status: editingWorker.status });
        if (res.data.status !== 'success') throw new Error(res.data.message);
      } else {
        // Add Mode
        const res = await api.post('/workers/index.php', payload);
        if (res.data.status !== 'success') throw new Error(res.data.message);
      }

      setIsModalOpen(false);
      fetchWorkers();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Error saving employee details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorker = async () => {
    if (!deleteWorkerItem) return;
    try {
      const res = await api.delete(`/workers/index.php?id=${deleteWorkerItem.id}`);
      if (res.data.status === 'success') {
        fetchWorkers();
      } else {
        alert(res.data.message || 'Failed to delete worker.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to the API.');
    } finally {
      setDeleteWorkerItem(null);
    }
  };

  const handleToggleWorkerStatus = async (wrk) => {
    try {
      const newStatus = wrk.status === 'Active' ? 'Inactive' : 'Active';
      const res = await api.put('/workers/index.php', {
        id: wrk.id,
        worker_id: wrk.worker_id,
        name: wrk.name,
        phone: wrk.phone,
        role: wrk.role,
        salary_type: wrk.salary_type,
        salary_rate: parseFloat(wrk.salary_rate),
        aadhaar: wrk.aadhaar,
        image_url: wrk.image_url,
        status: newStatus
      });
      if (res.data.status === 'success') {
        fetchWorkers();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination math
  const totalItems = workers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedWorkers = workers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Roster summaries calculations
  const totalRoster = workers.length;
  const activeCount = workers.filter(w => w.status === 'Active').length;
  const wageBill = workers.reduce((sum, w) => sum + (Number(w.salary_rate) * (w.salary_type === 'Daily' ? 30 : 1)), 0);

  return (
    <div className="p-6 space-y-6">
      
      {/* Header (Visual Hierarchy title description action) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-500" />
            Workers Roster
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage employee designations, wage payouts, and profile verification logs</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-btn-primary hover:opacity-95 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm shadow-indigo-500/10 transition-all duration-200 cursor-pointer btn-hover-effects"
        >
          <Plus className="w-5 h-5" /> Add Employee
        </button>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-cyan-500">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Registered</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{totalRoster} employees</h3>
          </div>
        </div>

        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Staff</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{activeCount} working</h3>
          </div>
        </div>

        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-purple-500">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Monthly Payroll</p>
            <h3 className="text-xl font-bold text-foreground mt-1">₹{wageBill.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 bg-card border border-border/80 p-5 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workers by name, role, code..."
            className="w-full pl-10 pr-10 py-2.5 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs text-foreground transition-all outline-none font-semibold"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                // Trigger refresh immediately
                setWorkers([]);
                fetchWorkers();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:bg-muted/65 hover:text-foreground transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs px-3.5 py-2.5 text-foreground transition-all outline-none font-semibold"
          >
            <option value="Active">Active Workers</option>
            <option value="Inactive">Terminated / Inactive</option>
          </select>
        </div>
        
        <button
          type="submit"
          className="px-5 py-2.5 bg-muted hover:bg-muted/70 text-foreground font-bold rounded-xl text-xs transition-colors border border-border cursor-pointer uppercase tracking-wider"
        >
          Query
        </button>
      </form>

      {/* Roster profiles deck */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Worker Directory</h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-44 skeleton-box rounded-2xl" />
            <div className="h-44 skeleton-box rounded-2xl" />
            <div className="h-44 skeleton-box rounded-2xl" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
            {error}
          </div>
        ) : paginatedWorkers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedWorkers.map((wrk) => (
              <div
                key={wrk.id}
                className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 card-hover-effects"
              >
                {/* Photo & Bio */}
                <div className="flex gap-4 items-start">
                  <div className="relative w-16 h-16 rounded-2xl bg-muted/40 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {wrk.image_url ? (
                      <img
                        src={`http://localhost/smcrackers/cracker-shop/backend/${wrk.image_url}`}
                        alt={wrk.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback Initials Avatar (accessible visual highlight) */}
                    <div className={`absolute inset-0 flex items-center justify-center bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-extrabold text-lg uppercase ${wrk.image_url ? 'hidden' : 'flex'}`}>
                      {wrk.name?.slice(0, 2)}
                    </div>

                    {/* Status Indicator Dot Overlay */}
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card ${
                      wrk.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[9px] font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-950/25 dark:text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/10">
                      {wrk.worker_id}
                    </span>
                    <h4 className="font-bold text-base mt-2 text-foreground truncate">{wrk.name}</h4>
                    <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-1 mt-0.5 uppercase tracking-wide">
                      <Briefcase className="w-3.5 h-3.5 text-cyan-500 shrink-0" /> {wrk.role}
                    </p>
                  </div>
                </div>

                {/* Data specs details */}
                <div className="my-5 border-t border-b border-border/40 py-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    <span>Phone: <span className="font-semibold text-foreground">{wrk.phone}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    <span>Aadhaar: <span className="font-semibold text-foreground font-mono">{wrk.aadhaar}</span></span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-muted-foreground">Wage Rates:</span>
                    <span className="font-bold text-foreground">
                      ₹{Number(wrk.salary_rate).toFixed(2)} / <span className="text-[10px] font-normal text-muted-foreground">{wrk.salary_type === 'Daily' ? 'day' : 'month'}</span>
                    </span>
                  </div>
                </div>

                {/* Actions (Edit / Delete) */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(wrk)}
                    className="flex-grow flex justify-center items-center gap-1.5 border border-border hover:bg-muted py-2 rounded-xl text-xs font-bold text-foreground transition-all duration-150 cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  
                  <button
                    onClick={() => handleToggleWorkerStatus(wrk)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      wrk.status === 'Active'
                        ? 'border-border text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/15'
                        : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/15'
                    }`}
                    title={wrk.status === 'Active' ? 'Deactivate Worker' : 'Activate Worker'}
                  >
                    {wrk.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setDeleteWorkerItem(wrk)}
                      className="p-2 border border-rose-100 hover:bg-rose-50 dark:hover:bg-rose-950/15 text-rose-600 rounded-xl transition-all duration-150 cursor-pointer"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card border border-border border-dashed rounded-2xl text-muted-foreground flex flex-col items-center justify-center gap-3">
            <Users className="w-12 h-12 text-muted-foreground/60" />
            <p className="font-semibold text-sm">No employee records found matching current filters.</p>
          </div>
        )}

        {/* Pagination bar */}
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

      {/* Add / Edit modal sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">
                {editingWorker ? 'Edit Employee Details' : 'Register New Employee'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSaveWorker} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Grid (Emp ID & Name) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={workerId}
                    onChange={(e) => setWorkerId(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                    placeholder="WRK001"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                    placeholder="Full Name"
                    required
                  />
                </div>
              </div>

              {/* Grid (Phone & Aadhaar) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold font-mono"
                    placeholder="1234-5678-9012"
                    required
                  />
                </div>
              </div>

              {/* Grid (Role & Salary Configuration) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Work Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                    placeholder="Packer"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Wage Structure
                  </label>
                  <select
                    value={salaryType}
                    onChange={(e) => setSalaryType(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                  >
                    <option value="Daily">Daily Wage</option>
                    <option value="Monthly">Monthly Fixed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Rate Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={salaryRate}
                    onChange={(e) => setSalaryRate(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Profile Photo
                </label>
                <div className="flex gap-4 items-center">
                  <div className="relative w-16 h-16 bg-muted/40 border border-border rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground/35" />
                    )}
                  </div>
                  
                  <label className="cursor-pointer border border-border hover:bg-muted text-foreground px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4" /> Upload Picture File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
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
                  {saving ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <ConfirmModal
        isOpen={!!deleteWorkerItem}
        title="Remove Employee?"
        message={`Are you sure you want to remove ${deleteWorkerItem?.name} from active rosters? This will delete all attendance and salary payout histories recorded under their name. This cannot be undone.`}
        onConfirm={handleDeleteWorker}
        onCancel={() => setDeleteWorkerItem(null)}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Workers;
