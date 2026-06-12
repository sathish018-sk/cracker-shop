import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { 
  Calendar, ClipboardCheck, AlertCircle, RefreshCw, CheckCircle2, Users, AlertTriangle, HelpCircle, ArrowRight
} from 'lucide-react';

const Attendance = () => {
  const [date, setDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Active Month calendar calculations
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchAttendanceSheet = async () => {
    try {
      setLoading(true);
      setError('');
      setSubmitSuccess('');
      setSubmitError('');
      
      const res = await api.get(`/attendance/index.php?date=${date}`);
      if (res.data.status === 'success') {
        const mapped = res.data.data.records.map((r) => ({
          worker_id: r.worker_id,
          worker_code: r.worker_code,
          name: r.name,
          role: r.role,
          status: r.status || 'Present'
        }));
        setRecords(mapped);
      } else {
        setError(res.data.message || 'Failed to load attendance sheet.');
      }
    } catch (err) {
      setError('Error communicating with the database.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceSheet();
  }, [date]); // Re-fetch when date changes

  const handleStatusChange = (workerId, newStatus) => {
    setRecords((prevRecords) =>
      prevRecords.map((rec) =>
        rec.worker_id === workerId ? { ...rec, status: newStatus } : rec
      )
    );
  };

  const handleMarkAll = (status) => {
    setRecords((prevRecords) =>
      prevRecords.map((rec) => ({ ...rec, status }))
    );
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess('');
    setSubmitError('');

    try {
      const payload = {
        date,
        records: records.map((rec) => ({
          worker_id: rec.worker_id,
          status: rec.status
        }))
      };

      const res = await api.post('/attendance/mark.php', payload);

      if (res.data.status === 'success') {
        setSubmitSuccess(`Attendance sheet successfully saved for ${new Date(date).toLocaleDateString('en-IN')}.`);
        setTimeout(() => setSubmitSuccess(''), 4000);
      } else {
        setSubmitError(res.data.message || 'Failed to save attendance.');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Error saving attendance sheet.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate heatmap calendar cells for current Month
  const getDaysInMonth = (month, year) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const monthDays = getDaysInMonth(currentMonth, currentYear);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Deterministic mock attendance rates for heatmap (green, yellow, red, grey)
  const getDayHeatColor = (dayDate) => {
    const day = dayDate.getDate();
    const dayOfWeek = dayDate.getDay();
    
    // Grey out weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'bg-slate-100 dark:bg-slate-900 border-slate-200 text-slate-400';
    
    // Future dates
    if (dayDate > new Date()) return 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 text-slate-300';
    
    // Mock values based on day number
    if (day % 7 === 0) return 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'; // Low attendance
    if (day % 4 === 0) return 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'; // Partial attendance
    return 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'; // High attendance
  };

  // Summaries
  const presentCount = records.filter(r => r.status === 'Present').length;
  const halfDayCount = records.filter(r => r.status === 'HalfDay').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;

  return (
    <div className="p-6 space-y-6">
      
      {/* Header (Page Title, subtitle & Date selector) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-500" />
            Daily Attendance Log
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Record daily shifts check-ins, view roster rates, and track monthly heatmaps</p>
        </div>
        
        {/* Date Selector input */}
        <div className="flex items-center gap-2 bg-card border border-border/80 px-3.5 py-2.5 rounded-xl shadow-sm shrink-0">
          <Calendar className="w-4 h-4 text-green-500" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent border-0 text-xs text-foreground focus:outline-none focus:ring-0 font-bold"
          />
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Present Roster</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{presentCount} workers</h3>
          </div>
        </div>

        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-amber-500">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Half Day Entries</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{halfDayCount} workers</h3>
          </div>
        </div>

        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-rose-500">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Absent Listings</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{absentCount} workers</h3>
          </div>
        </div>
      </div>

      {/* Monthly Heatmap Calendar View Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Monthly Attendance Heatmap</h3>
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <span className="font-bold text-sm text-foreground">
              {monthNames[currentMonth]} {currentYear}
            </span>
            
            {/* Heatmap Legend */}
            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded" /> High
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded" /> Partial
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded" /> Low
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" /> Off
              </div>
            </div>
          </div>

          {/* Heatmap Day Blocks */}
          <div className="flex flex-wrap gap-2 justify-start md:justify-between">
            {monthDays.map((dayDate) => {
              const dayStr = dayDate.toISOString().split('T')[0];
              const isSelected = dayStr === date;
              const heatColor = getDayHeatColor(dayDate);
              
              return (
                <button
                  key={dayStr}
                  onClick={() => setDate(dayStr)}
                  className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center border text-[11px] font-extrabold cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 ${heatColor} ${
                    isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-card scale-110' : ''
                  }`}
                  title={`Select Date: ${dayDate.toLocaleDateString()}`}
                >
                  <span>{dayDate.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-card border border-border/80 p-4 rounded-2xl shadow-sm no-print">
        <div className="flex gap-2">
          <button
            onClick={() => handleMarkAll('Present')}
            className="px-3.5 py-1.5 border border-emerald-200 hover:bg-emerald-50 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Mark All Present
          </button>
          <button
            onClick={() => handleMarkAll('Absent')}
            className="px-3.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Mark All Absent
          </button>
        </div>

        <button
          onClick={fetchAttendanceSheet}
          className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Revert/Sync
        </button>
      </div>

      {/* Operation Feedbacks */}
      {submitSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}
      {submitError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Attendance Sheet Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Worker Attendance Sheet</h3>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-28 skeleton-box rounded-2xl" />
            <div className="h-28 skeleton-box rounded-2xl" />
            <div className="h-28 skeleton-box rounded-2xl" />
            <div className="h-28 skeleton-box rounded-2xl" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
            {error}
          </div>
        ) : records.length > 0 ? (
          <form onSubmit={handleSubmitAttendance} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {records.map((rec) => (
                <div key={rec.worker_id} className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all duration-300 card-hover-effects">
                  <div>
                    <span className="font-mono text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 px-2.5 py-0.5 rounded border border-green-500/10">
                      {rec.worker_code}
                    </span>
                    <h4 className="font-bold text-base mt-2 text-foreground truncate">{rec.name}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{rec.role}</p>
                  </div>

                  {/* Mark status options cards */}
                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-border/50">
                    {/* Present Option */}
                    <label className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold cursor-pointer select-none transition-all ${
                      rec.status === 'Present'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}>
                      <input
                        type="radio"
                        name={`attendance-${rec.worker_id}`}
                        checked={rec.status === 'Present'}
                        onChange={() => handleStatusChange(rec.worker_id, 'Present')}
                        className="hidden"
                      />
                      <span>Present</span>
                    </label>

                    {/* HalfDay Option */}
                    <label className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold cursor-pointer select-none transition-all ${
                      rec.status === 'HalfDay'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}>
                      <input
                        type="radio"
                        name={`attendance-${rec.worker_id}`}
                        checked={rec.status === 'HalfDay'}
                        onChange={() => handleStatusChange(rec.worker_id, 'HalfDay')}
                        className="hidden"
                      />
                      <span>Half Day</span>
                    </label>

                    {/* Absent Option */}
                    <label className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold cursor-pointer select-none transition-all ${
                      rec.status === 'Absent'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}>
                      <input
                        type="radio"
                        name={`attendance-${rec.worker_id}`}
                        checked={rec.status === 'Absent'}
                        onChange={() => handleStatusChange(rec.worker_id, 'Absent')}
                        className="hidden"
                      />
                      <span>Absent</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Tray */}
            <div className="flex justify-end gap-4 border-t border-border/60 pt-4 no-print">
              <button
                type="submit"
                disabled={submitting}
                className="bg-btn-success hover:opacity-95 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm shadow-emerald-500/10 flex items-center gap-2 disabled:opacity-50 cursor-pointer btn-hover-effects"
              >
                <ClipboardCheck className="w-4.5 h-4.5" />
                {submitting ? 'Saving changes...' : 'Save Daily Attendance'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-16 bg-card border border-border border-dashed rounded-2xl text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Users className="w-12 h-12 text-muted-foreground/60" />
            <p className="font-semibold text-sm">No active employees registered in the system.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Attendance;
