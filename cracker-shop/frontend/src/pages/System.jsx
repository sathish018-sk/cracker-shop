import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, Settings, Database, Download, RefreshCw, Clock, Terminal, AlertTriangle, CheckCircle2, Save, Server, ShieldCheck, DatabaseBackup, Activity, UserCheck
} from 'lucide-react';

const System = () => {
  const { user, isAdmin } = useAuth();

  // Page Sections: 'logs', 'backups', 'settings'
  const [activeSection, setActiveSection] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  
  // Load statuses
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [errorLogs, setErrorLogs] = useState('');
  const [errorBackups, setErrorBackups] = useState('');

  // Operations statuses
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoreConfirmItem, setRestoreConfirmItem] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [sysSuccess, setSysSuccess] = useState('');
  const [sysError, setSysError] = useState('');

  // Settings states (backed by LocalStorage)
  const [shopName, setShopName] = useState(() => localStorage.getItem('sm_shop_name') || 'SM CRACKERS');
  const [shopPhone, setShopPhone] = useState(() => localStorage.getItem('sm_shop_phone') || '+91 9876543210');
  const [shopAddress, setShopAddress] = useState(() => localStorage.getItem('sm_shop_address') || 'Sivakasi, Tamil Nadu, India');
  const [defaultTax, setDefaultTax] = useState(() => localStorage.getItem('sm_default_tax') || '18');
  const [lowStockLimit, setLowStockLimit] = useState(() => localStorage.getItem('sm_low_stock') || '10');
  const [savingSettings, setSavingSettings] = useState(false);

  // Enforce security
  if (!isAdmin) {
    return (
      <div className="p-6 min-h-[60vh] flex items-center justify-center">
        <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 p-8 rounded-2xl max-w-md text-center shadow">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-amber-500 animate-bounce" />
          <h3 className="text-lg font-bold">Access Denied</h3>
          <p className="text-sm mt-2 leading-relaxed">
            You do not have administrative permissions to access the system audit logs or database backup tools.
          </p>
        </div>
      </div>
    );
  }

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      setErrorLogs('');
      const res = await api.get('/system/logs.php');
      if (res.data.status === 'success') {
        setLogs(res.data.data.logs);
      } else {
        setErrorLogs(res.data.message || 'Failed to load system logs.');
      }
    } catch (err) {
      setErrorLogs('Error loading activity logs.');
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchBackups = async () => {
    try {
      setLoadingBackups(true);
      setErrorBackups('');
      const res = await api.get('/system/backup.php');
      if (res.data.status === 'success') {
        setBackups(res.data.data.backups);
      } else {
        setErrorBackups(res.data.message || 'Failed to load backup list.');
      }
    } catch (err) {
      setErrorBackups('Error loading backups history.');
      console.error(err);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchBackups();
  }, []);

  const handleRefreshActiveSection = () => {
    if (activeSection === 'logs') fetchLogs();
    if (activeSection === 'backups') fetchBackups();
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    setSysSuccess('');
    setSysError('');
    try {
      const res = await api.post('/system/backup.php');
      if (res.data.status === 'success') {
        setSysSuccess(`Successfully created backup file: ${res.data.data.file_name}`);
        fetchBackups();
        setTimeout(() => setSysSuccess(''), 5000);
      } else {
        setSysError(res.data.message || 'Backup failed.');
      }
    } catch (err) {
      setSysError('Error connecting to database to perform backup.');
      console.error(err);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreConfirmItem) return;
    setRestoring(true);
    setSysSuccess('');
    setSysError('');
    try {
      const res = await api.put('/system/backup.php', { id: restoreConfirmItem.id });
      if (res.data.status === 'success') {
        setSysSuccess(`Database successfully restored to state of ${restoreConfirmItem.file_name}.`);
        fetchBackups();
        fetchLogs();
        setTimeout(() => setSysSuccess(''), 5000);
      } else {
        setSysError(res.data.message || 'Restore failed.');
      }
    } catch (err) {
      setSysError('Error running SQL restore commands.');
      console.error(err);
    } finally {
      setRestoring(false);
      setRestoreConfirmItem(null);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSysSuccess('');
    setSysError('');
    
    try {
      localStorage.setItem('sm_shop_name', shopName);
      localStorage.setItem('sm_shop_phone', shopPhone);
      localStorage.setItem('sm_shop_address', shopAddress);
      localStorage.setItem('sm_default_tax', defaultTax);
      localStorage.setItem('sm_low_stock', lowStockLimit);
      
      setSysSuccess('System parameters successfully updated and saved locally.');
      setTimeout(() => setSysSuccess(''), 4000);
    } catch (err) {
      setSysError('Failed to write changes to local storage.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Computations for KPI cards
  const totalLogsCount = logs.length;
  const totalBackupsCount = backups.length;
  const lastBackupFile = backups.length > 0 ? backups[0].file_name : 'No backups found';

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            System Administration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage ERP database backups, configurations, and review activity audit logs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshActiveSection}
            className="btn-hover-effects px-3.5 py-2.5 border border-border hover:bg-muted font-bold text-xs rounded-xl flex items-center gap-1.5 text-foreground cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Data
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Audit Log Buffer" 
          value={totalLogsCount} 
          icon={Activity} 
          color="slate"
          trend={{ text: 'Action records logged', positive: true }}
        />
        <StatCard 
          title="Database Backups" 
          value={totalBackupsCount} 
          icon={Database} 
          color="slate"
          trend={{ text: 'Recovery points logged', positive: true }}
        />
        <StatCard 
          title="Active Operator" 
          value={user?.name || 'Administrator'} 
          icon={UserCheck} 
          color="slate"
          trend={{ text: `Role: ${user?.role || 'Admin'}`, positive: true }}
        />
        <StatCard 
          title="Tax & Stock Limits" 
          value={`${defaultTax}% GST`} 
          icon={Settings} 
          color="slate"
          trend={{ text: `Stock Alert: <${lowStockLimit} units`, positive: true }}
        />
      </div>

      {/* Operation Feedbacks */}
      {sysSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{sysSuccess}</span>
        </div>
      )}
      {sysError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{sysError}</span>
        </div>
      )}

      {/* Tab Select & Controls */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-3">
          {/* Section toggler */}
          <div className="flex bg-background border border-border p-1 rounded-xl">
            <button
              onClick={() => setActiveSection('logs')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'logs'
                  ? 'bg-slate-700 text-white shadow-sm shadow-slate-500/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Terminal className="w-4 h-4" /> Activity Audits
            </button>
            <button
              onClick={() => setActiveSection('backups')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'backups'
                  ? 'bg-slate-700 text-white shadow-sm shadow-slate-500/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Database className="w-4 h-4" /> Backups Registry
            </button>
            <button
              onClick={() => setActiveSection('settings')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'settings'
                  ? 'bg-slate-700 text-white shadow-sm shadow-slate-500/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="w-4 h-4" /> Store Settings
            </button>
          </div>

          {/* Contextual Action Button */}
          {activeSection === 'backups' ? (
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="btn-hover-effects px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-slate-500/10 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {creatingBackup ? 'Creating SQL Backup...' : 'Create Backup'}
            </button>
          ) : activeSection === 'logs' ? (
            <button
              onClick={fetchLogs}
              className="px-3.5 py-2 border border-border hover:bg-muted font-bold text-xs rounded-xl flex items-center gap-1.5 text-foreground cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh logs
            </button>
          ) : null}
        </div>

        {/* Tab Body */}
        <div>
          {/* 1. Activity Logs Tab (Dark Console Grid Redesign) */}
          {activeSection === 'logs' && (
            <div className="bg-slate-950 text-slate-300 font-mono text-xs border border-slate-900 overflow-hidden flex flex-col">
              
              {/* Terminal Controls Bar */}
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono ml-2">system_audit_daemon.sh --stream</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">online</span>
                </div>
              </div>

              {/* Terminal Logs Grid */}
              <div className="p-5 max-h-[60vh] overflow-y-auto scrollbar-thin space-y-2.5 min-h-[35vh]">
                {loadingLogs ? (
                  <div className="space-y-3.5 animate-pulse">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-5 bg-slate-900 rounded w-full flex items-center justify-between px-3">
                        <div className="w-1/4 h-2.5 bg-slate-800 rounded" />
                        <div className="w-2/3 h-2.5 bg-slate-800 rounded" />
                      </div>
                    ))}
                  </div>
                ) : errorLogs ? (
                  <div className="text-rose-500 py-6 text-center">{errorLogs}</div>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="py-2 border-b border-slate-900/60 hover:bg-slate-900/40 px-2.5 rounded transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 font-mono">
                      <div className="flex items-start lg:items-center gap-2 flex-wrap text-[11px] leading-relaxed">
                        <span className="text-slate-500 font-semibold">[{new Date(log.created_at).toLocaleString('en-IN')}]</span>
                        <span className="text-emerald-400 font-extrabold">[{log.user_name || 'System'}]</span>
                        <span className="text-purple-400 uppercase text-[9px] bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 font-bold tracking-wide">{log.user_role || 'system'}</span>
                        <span className="text-blue-400 font-bold uppercase tracking-wider">{log.action}:</span>
                        <span className="text-slate-100 font-sans">{log.details}</span>
                      </div>
                      <div className="text-slate-500 text-[10px] font-mono shrink-0 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/40 self-end lg:self-auto">IP: {log.ip_address}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500">Log buffers cleared. No activities recorded.</div>
                )}
                {/* Simulated Blinking Cursor */}
                {!loadingLogs && (
                  <div className="flex items-center gap-1.5 text-slate-400 pt-2 border-t border-slate-900/40 font-mono">
                    <span className="text-emerald-500 font-bold">$</span>
                    <span className="text-xs">listening for incoming activity events...</span>
                    <span className="w-2 h-4 bg-slate-400 animate-pulse inline-block" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Database Backups & Restore Tab */}
          {activeSection === 'backups' && (
            <div className="p-6 space-y-6">
              {/* Info panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border border-border bg-muted/10 rounded-2xl flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-xl">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Server Status</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">Active Connection</p>
                  </div>
                </div>
                <div className="p-4 border border-border bg-muted/10 rounded-2xl flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Database Lock</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">Secure Transaction Mode</p>
                  </div>
                </div>
                <div className="p-4 border border-border bg-muted/10 rounded-2xl flex items-center gap-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-xl">
                    <DatabaseBackup className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Restore Safety</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">Rollbacks Configured</p>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="border border-border/80 bg-card rounded-2xl overflow-hidden shadow-sm">
                {loadingBackups ? (
                  <div className="animate-pulse space-y-4 p-4">
                    <div className="h-10 bg-muted rounded w-full" />
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted/40 rounded w-full" />
                    ))}
                  </div>
                ) : errorBackups ? (
                  <p className="text-center text-red-500 py-6">{errorBackups}</p>
                ) : backups.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border/80 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                          <th className="px-6 py-4">Backup File Name</th>
                          <th className="px-6 py-4">Creation Date</th>
                          <th className="px-6 py-4">Disk Path</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {backups.map((bak) => (
                          <tr key={bak.id} className="hover:bg-muted/15 transition-all duration-150">
                            <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                              <Database className="w-4 h-4 text-slate-500" />
                              {bak.file_name}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground text-xs font-semibold">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground/80" />
                                {new Date(bak.created_at).toLocaleString('en-IN')}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{bak.file_path}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setRestoreConfirmItem(bak)}
                                className="px-3.5 py-2 border border-amber-200 hover:bg-amber-500/10 text-amber-600 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" /> Restore State
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-12 text-muted-foreground">No backup files logged on this server.</p>
                )}
              </div>
            </div>
          )}

          {/* 3. System Configurations Settings Tab */}
          {activeSection === 'settings' && (
            <form onSubmit={handleSaveSettings} className="p-6 space-y-6 max-w-3xl">
              
              {/* Profile Block */}
              <div className="bg-muted/30 border border-border p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-xl shadow-md uppercase">
                  {user?.name?.slice(0, 2) || 'AD'}
                </div>
                <div className="text-center sm:text-left space-y-0.5">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h4 className="font-bold text-foreground text-lg">{user?.name || 'Administrator'}</h4>
                    <span className="px-2.5 py-0.5 bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full uppercase">
                      {user?.role || 'Admin'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Logged in via Secure JWT Provider | ID: {user?.id || 'N/A'}</p>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">ERP System Parameters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shop Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Business / Shop Name</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. SM Crackers"
                      className="w-full bg-background border border-border hover:border-slate-500/30 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold text-foreground"
                      required
                    />
                  </div>

                  {/* Shop Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Contact Phone</label>
                    <input
                      type="text"
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-background border border-border hover:border-slate-500/30 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold text-foreground"
                      required
                    />
                  </div>
                </div>

                {/* Shop Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Shop Address Location</label>
                  <textarea
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="Sivakasi, Tamil Nadu, India"
                    rows="2"
                    className="w-full bg-background border border-border hover:border-slate-500/30 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold text-foreground"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tax GST Rate */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Default Tax Rate (GST %)</label>
                    <input
                      type="number"
                      value={defaultTax}
                      onChange={(e) => setDefaultTax(e.target.value)}
                      min="0"
                      max="100"
                      className="w-full bg-background border border-border hover:border-slate-500/30 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold text-foreground"
                      required
                    />
                  </div>

                  {/* Low stock threshold */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Low Stock Threshold Limit</label>
                    <input
                      type="number"
                      value={lowStockLimit}
                      onChange={(e) => setLowStockLimit(e.target.value)}
                      min="1"
                      className="w-full bg-background border border-border hover:border-slate-500/30 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold text-foreground"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit settings button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-hover-effects bg-gradient-to-r from-slate-600 to-slate-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-sm shadow-slate-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {savingSettings ? 'Saving Configurations...' : 'Save Configuration Profile'}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>

      {/* Database Restore Confirmation modal (Amber warning) */}
      <ConfirmModal
        isOpen={!!restoreConfirmItem}
        title="Restore Database?"
        message={`Are you sure you want to restore the database to the state of ${restoreConfirmItem?.file_name}? WARNING: This replaces all current products, orders, attendance, and worker tables with the data from this backup file. This cannot be undone.`}
        onConfirm={handleRestoreBackup}
        onCancel={() => setRestoreConfirmItem(null)}
        confirmText={restoring ? "Restoring SQL..." : "Yes, Restore Now"}
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default System;
