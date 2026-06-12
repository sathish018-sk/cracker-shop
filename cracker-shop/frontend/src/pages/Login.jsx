import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Sparkles, Lock, User, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login.php', { username, password });
      
      if (response.data.status === 'success') {
        const { token, user } = response.data.data;
        login(token, user);
        
        // Remember me logic
        if (rememberMe) {
          localStorage.setItem('remembered_username', username);
        } else {
          localStorage.removeItem('remembered_username');
        }

        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Invalid username or password.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Unable to connect to the server. Please check your XAMPP Apache/MySQL services.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Populate remembered username if available
  React.useEffect(() => {
    const remembered = localStorage.getItem('remembered_username');
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-background select-none">
      
      {/* 1. Left Brand Illustration Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-gradient p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Subtle grid background overlay */}
        <div className="absolute inset-0 bg-slate-950/10 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Sparkles className="w-5 h-5 text-indigo-200" />
          </div>
          <span className="font-extrabold tracking-widest text-sm uppercase">SM CRACKERS</span>
        </div>

        {/* Narrative / Features */}
        <div className="space-y-6 z-10 my-auto">
          <span className="px-3.5 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">
            Enterprise ERP Dashboard
          </span>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight max-w-lg">
            Manage your crackers trade with speed & security.
          </h1>
          <p className="text-blue-100/80 max-w-md text-sm leading-relaxed font-medium">
            A corporate billing solution providing automated POS checkout, real-time stock notifications, attendance check-ins, monthly salary payments, and database backups.
          </p>

          <div className="grid grid-cols-2 gap-6 pt-4 max-w-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
              <span>JWT Auth & Audits</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
              <span>GST & Tax Invoicing</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-blue-200/60 z-10 flex justify-between font-mono">
          <span>© 2026 SM Crackers ERP Solutions.</span>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* 2. Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md bg-card border border-border/80 p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-100/40 dark:shadow-none flex flex-col justify-between">
          
          <div>
            {/* Header */}
            <div className="mb-8 text-center lg:text-left">
              <div className="lg:hidden w-12 h-12 bg-btn-primary rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Sign In</h2>
              <p className="text-muted-foreground text-xs mt-1.5 font-medium">Enter credentials to access the crackers management dashboard</p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center leading-normal">
                {error}
              </div>
            )}

            {/* Inputs Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary focus:ring-offset-0 rounded-xl text-sm text-foreground transition-all duration-200 outline-none font-medium placeholder-muted-foreground/40"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-background border border-border hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary focus:ring-offset-0 rounded-xl text-sm text-foreground transition-all duration-200 outline-none font-medium placeholder-muted-foreground/40"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password link */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-primary border-border focus:ring-primary bg-background rounded"
                  />
                  <span className="text-xs text-muted-foreground font-semibold">Remember me</span>
                </label>
                
                <span className="text-xs text-primary hover:underline cursor-pointer font-bold">
                  Forgot Password?
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-2.5 bg-btn-primary hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 cursor-pointer btn-hover-effects"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-t border-border/60 pt-4">
            Security Certified Connection.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
