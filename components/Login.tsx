
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useTenant } from '../contexts/TenantContext';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';
import LegalPolicyViewer, { PolicyType } from './LegalPolicyViewer';

interface LoginProps {
  onLoginSuccess: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setTenant, tenants } = useTenant();
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalType, setLegalModalType] = useState<PolicyType>('privacy');

  const isOfflineMode = !supabase;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate Network Delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // 0. Superuser Check (Hardcoded for demo bypass)
      if ((email === 'super@invoiceflow.com' && password === 'root') || 
          (email === 'dmitry@smplsinnovation.com.au' && password === 'Dnns2011368@')) {
          onLoginSuccess('superuser');
          setIsLoading(false);
          return;
      }

      // 1. Try Actual Supabase Auth (If configured)
      if (supabase) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (authError) {
             // If Auth fails, check if it's a known Demo Account. 
             // If so, suppress the error to allow the demo to proceed locally.
             const isDemoAccount = email.includes('agency-') && password === 'demo123';
             if (!isDemoAccount) {
                 throw authError;
             }
        }
      }

      // 2. Tenant Resolution
      const foundTenant = tenants.find(t => email.toLowerCase().includes(t.name.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '')));
      
      if (foundTenant) {
          setTenant(foundTenant);
          onLoginSuccess('admin');
      } else if (email.includes('agency-a')) { 
          const t = tenants.find(t => t.id === 't-001');
          if (t) setTenant(t);
          onLoginSuccess('admin');
      } else if (email.includes('agency-b')) {
          const t = tenants.find(t => t.id === 't-002');
          if (t) setTenant(t);
          onLoginSuccess('admin');
      } else if (email.includes('agency-c')) {
          const t = tenants.find(t => t.id === 't-003');
          if (t) setTenant(t);
          onLoginSuccess('admin');
      } else {
          setTenant(tenants[0]);
          onLoginSuccess('admin');
      }
      
    } catch (err: any) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openLegal = (type: PolicyType) => {
      setLegalModalType(type);
      setShowLegalModal(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden font-sans">
      {/* Abstract Calm Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/80 rounded-full blur-[120px] opacity-60 mix-blend-multiply"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50/80 rounded-full blur-[120px] opacity-60 mix-blend-multiply"></div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[400px] flex flex-col z-10 border border-white/60">
        
        {/* Header Section */}
        <div className="pt-10 pb-6 px-8 text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-slate-200 mb-5">
             <ShieldCheck className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Secure access to your Support at Home dashboard.
          </p>
        </div>

        {/* Login Form */}
        <div className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg text-xs font-medium text-rose-600 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-rose-500 shrink-0"></div>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          {/* Connection Status Indicator */}
          <div className="mt-8 flex justify-center">
             {isOfflineMode ? (
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium border border-slate-200">
                     <WifiOff size={10} /> Local Demo Mode
                 </div>
             ) : (
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-medium border border-emerald-100/50">
                     <Wifi size={10} /> Secure Connection
                 </div>
             )}
          </div>
        </div>
      </div>
      
      {/* Footer with Legal Links */}
      <div className="absolute bottom-6 text-center w-full space-y-2">
         <p className="text-xs text-slate-400">
             By signing in, you agree to our{' '}
             <button onClick={() => openLegal('tos')} className="hover:text-slate-600 underline">Terms of Service</button>
             {' '}&{' '}
             <button onClick={() => openLegal('privacy')} className="hover:text-slate-600 underline">Privacy Policy</button>.
         </p>
         <p className="text-[10px] text-slate-300">&copy; 2025 SMPLS INNOVATION PTY LTD. All rights reserved.</p>
      </div>

      <LegalPolicyViewer 
          isOpen={showLegalModal} 
          onClose={() => setShowLegalModal(false)} 
          type={legalModalType} 
      />
    </div>
  );
};

export default Login;
