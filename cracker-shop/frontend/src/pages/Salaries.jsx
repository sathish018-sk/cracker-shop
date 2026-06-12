import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import { 
  Wallet, Landmark, Calendar, DollarSign, CheckCircle2, AlertCircle, X, Banknote, Users, RefreshCw, Sparkles, Filter, Edit, Search
} from 'lucide-react';

const Salaries = () => {
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1));
  const [year, setYear] = useState(() => String(new Date().getFullYear()));

  // Data States
  const [payroll, setPayroll] = useState([]);
  const [summary, setSummary] = useState({ total_paid: 0, total_pending: 0, total_expenditure: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [bonus, setBonus] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [transactionId, setTransactionId] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch calculated salaries
      const calcRes = await api.get(`/salary/calculate.php?month=${month}&year=${year}`);
      if (calcRes.data.status === 'success') {
        setPayroll(calcRes.data.data.payroll);
      } else {
        setError(calcRes.data.message || 'Failed to calculate payroll.');
        return;
      }

      // 2. Fetch salary payments summary
      const repRes = await api.get(`/salary/report.php?month=${month}&year=${year}`);
      if (repRes.data.status === 'success') {
        setSummary(repRes.data.data.summary);
      }

    } catch (err) {
      setError('Error communicating with payroll database.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [month, year]);

  const handleOpenPaymentModal = (record) => {
    setSelectedRecord(record);
    setBonus(String(record.bonus || 0));
    setDeductions(String(record.deductions || 0));
    setTransactionId(record.transaction_id || '');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setSaving(true);
    setModalError('');

    const calculatedBase = parseFloat(selectedRecord.calculated_salary);
    const bonusVal = parseFloat(bonus) || 0;
    const deductVal = parseFloat(deductions) || 0;
    const net = Math.max(0, calculatedBase + bonusVal - deductVal);

    try {
      const payload = {
        worker_id: selectedRecord.worker_id,
        month: parseInt(month),
        year: parseInt(year),
        present_days: selectedRecord.present_days,
        absent_days: selectedRecord.absent_days,
        salary_amount: calculatedBase,
        bonus: bonusVal,
        deductions: deductVal,
        net_salary: net,
        payment_status: 'Paid',
        transaction_id: transactionId
      };

      const res = await api.post('/salary/pay.php', payload);
      if (res.data.status === 'success') {
        setIsModalOpen(false);
        fetchPayrollData();
      } else {
        setModalError(res.data.message || 'Payment submission failed.');
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error recording salary payment.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const monthsList = [
    { value: '1', name: 'January' },
    { value: '2', name: 'February' },
    { value: '3', name: 'March' },
    { value: '4', name: 'April' },
    { value: '5', name: 'May' },
    { value: '6', name: 'June' },
    { value: '7', name: 'July' },
    { value: '8', name: 'August' },
    { value: '9', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' }
  ];

  const yearsList = ['2025', '2026', '2027', '2028'];

  // Calculations for net salary dynamically inside modal
  const calcNetSalary = () => {
    if (!selectedRecord) return 0;
    const base = parseFloat(selectedRecord.calculated_salary) || 0;
    const b = parseFloat(bonus) || 0;
    const d = parseFloat(deductions) || 0;
    return Math.max(0, base + b - d);
  };

  // Pagination calculations
  const totalItems = payroll.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedPayroll = payroll.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [month, year]);

  return (
    <div className="p-6 space-y-6">
      
      {/* Header & Date Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6 text-purple-500" />
            Salaries & Payroll ERP
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Calculate attendance-based salaries, record disbursements, and monitor payouts</p>
        </div>

        {/* Filters Select boxes */}
        <div className="flex items-center gap-2 bg-card border border-border/80 px-3.5 py-2.5 rounded-xl shadow-sm shrink-0">
          <Calendar className="w-4 h-4 text-purple-500" />
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-transparent border-0 text-xs text-foreground font-bold focus:outline-none"
          >
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>{m.name}</option>
            ))}
          </select>
          <span className="text-border">|</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-transparent border-0 text-xs text-foreground font-bold focus:outline-none"
          >
            {yearsList.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregates Dashboard Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Salaries Disbursed (Paid)"
          value={`₹${Number(summary.total_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={CheckCircle2}
          color="green"
          trend={{ text: 'Disbursed payroll', positive: true }}
          sparklineData={[4000, 7000, 5000, 9000, 11000, 8000, Number(summary.total_paid) > 0 ? Number(summary.total_paid) / 10 : 14000]}
        />
        <StatCard
          title="Salaries Outstanding (Pending)"
          value={`₹${Number(summary.total_pending).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={AlertCircle}
          color="amber"
          trend={{ text: 'Pending payroll disbursements' }}
          sparklineData={[1500, 3000, 2000, 1800, 1200, 1000, Number(summary.total_pending) > 0 ? Number(summary.total_pending) / 10 : 800]}
        />
        <StatCard
          title="Total Payroll Budget"
          value={`₹${Number(summary.total_expenditure).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          color="purple"
          trend={{ text: 'Aggregate budget check', positive: true }}
          sparklineData={[5500, 10000, 7000, 10800, 12200, 9000, Number(summary.total_expenditure) > 0 ? Number(summary.total_expenditure) / 10 : 14800]}
        />
      </div>

      {/* Main Grid table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Employee Payroll Ledger</h3>
          <button
            onClick={fetchPayrollData}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer no-print"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Revert/Sync Ledger
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-12 skeleton-box rounded-xl" />
            <div className="h-44 skeleton-box rounded-2xl" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
            {error}
          </div>
        ) : paginatedPayroll.length > 0 ? (
          <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/80 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Structure</th>
                    <th className="px-6 py-4 text-center">Days Worked</th>
                    <th className="px-6 py-4 text-right">Calculated Base</th>
                    <th className="px-6 py-4 text-right">Bonus</th>
                    <th className="px-6 py-4 text-right">Deductions</th>
                    <th className="px-6 py-4 text-right font-bold">Net Salary</th>
                    <th className="px-6 py-4 text-center">Disbursement</th>
                    <th className="px-6 py-4 text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedPayroll.map((rec) => {
                    const isPaid = rec.payment_status === 'Paid';
                    return (
                      <tr key={rec.worker_id} className="hover:bg-muted/15 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{rec.name}</div>
                          <div className="text-[10px] font-mono text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20 dark:text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/10 w-fit mt-1">{rec.worker_code}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border/40">
                            {rec.salary_type} (₹{rec.salary_rate})
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-muted-foreground font-semibold font-mono">
                          {rec.worked_days} / {rec.present_days + rec.absent_days + rec.half_days > 0 ? rec.present_days + rec.absent_days + rec.half_days : '30'} days
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground font-semibold font-mono">₹{Number(rec.calculated_salary).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold font-mono">+₹{Number(rec.bonus).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-rose-500 font-bold font-mono">-₹{Number(rec.deductions).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-extrabold text-foreground font-mono text-base">₹{Number(rec.net_salary).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                              : 'bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {rec.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right no-print">
                          <button
                            onClick={() => handleOpenPaymentModal(rec)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isPaid
                                ? 'border border-border text-muted-foreground hover:bg-muted'
                                : 'bg-btn-primary hover:opacity-95 text-white shadow-sm shadow-indigo-500/10'
                            }`}
                          >
                            {isPaid ? 'Edit Payout' : 'Pay Salary'}
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
            <Wallet className="w-12 h-12 text-muted-foreground/60" />
            <p className="font-semibold text-sm">No employee logs recorded for payroll calculations.</p>
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

      {/* Disbursal payment Modal Sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">Record Salary Payout</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Summary metadata */}
              <div className="bg-muted/40 p-4 rounded-xl space-y-1.5 text-xs text-muted-foreground">
                <p>Employee: <span className="font-bold text-foreground">{selectedRecord?.name} ({selectedRecord?.worker_code})</span></p>
                <p>Role: <span className="font-semibold text-foreground">{selectedRecord?.role}</span></p>
                <p>Calculated Days: <span className="font-semibold text-foreground">{selectedRecord?.worked_days} worked days</span></p>
                <div className="flex justify-between items-baseline pt-2 border-t border-border/60 mt-2">
                  <span>Calculated Base:</span>
                  <span className="font-bold text-foreground">₹{Number(selectedRecord?.calculated_salary).toFixed(2)}</span>
                </div>
              </div>

              {/* Bonus */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Add Festive Bonus (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Deductions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Salary Deductions (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Transaction ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Transaction / Ref ID (Optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                  placeholder="e.g. Bank Transfer ID / UPI Ref"
                />
              </div>

              {/* Calculation Breakdown */}
              <div className="flex justify-between items-baseline pt-3 border-t border-border font-extrabold text-sm text-foreground">
                <span>Net Payout:</span>
                <span className="text-indigo-600 text-lg">₹{calcNetSalary().toFixed(2)}</span>
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
                  className="bg-btn-secondary hover:opacity-95 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm shadow-indigo-500/10 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Banknote className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salaries;
