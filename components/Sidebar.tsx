
import React, { useState } from 'react';
import { LayoutDashboard, FileText, AlertCircle, CheckSquare, BarChart3, Settings, PlusCircle, Mail, LogOut, ShieldCheck, Users, HelpCircle, Bot, LogIn, ArrowLeftCircle, Activity, TestTube, Terminal, Scale } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import LegalPolicyViewer, { PolicyType } from './LegalPolicyViewer';
import NotificationCenter from './NotificationCenter';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onScanClick: () => void;
  onSimulateEmailClick: () => void;
  onLogout: () => void;
  onToggleDevTools?: () => void;
  isSuperuser?: boolean;
  onNavigateToInvoice?: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onScanClick, onSimulateEmailClick, onLogout, onToggleDevTools, isSuperuser, onNavigateToInvoice }) => {
  const { tenant } = useTenant();
  const [showLegalModal, setShowLegalModal] = useState(false);

  // Detect modes
  const isBeta = tenant?.status === 'BETA';
  // Check if we are "impersonating" or just "using the app" as a Superuser.
  // We consider it "Impersonating/Using App" if the view is NOT one of the Superuser specific views.
  const isAppView = currentView !== 'superuser' && currentView !== 'superuser_audit' && currentView !== 'superuser_settings';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'All Invoices', icon: FileText },
    { id: 'reviews', label: 'Needs Review', icon: AlertCircle },
    { id: 'approved', label: 'Approved', icon: CheckSquare },
    { id: 'clients', label: 'Clients & Plans', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'ai-support', label: 'AI Support', icon: Bot },
    { id: 'settings', label: 'Configuration', icon: Settings },
  ];

  // Dynamic Styles
  // Priority: Beta -> Impersonation/App Mode -> Superuser Default
  let primaryColor = tenant?.primaryColor || '#334155';
  let secondaryColor = tenant?.secondaryColor || '#0f172a';

  if (isBeta) {
      primaryColor = '#7c3aed'; // Violet
      secondaryColor = '#2e1065'; // Deep Violet
  } else if (isAppView && isSuperuser) {
      // Keep tenant colors if set, otherwise default app colors
  } else if (isSuperuser) {
      primaryColor = '#4f46e5';
      secondaryColor = '#312e81';
  }

  const handleNotificationNavigate = (view: string, id?: string) => {
      setCurrentView(view);
      if (view === 'detail' && id && onNavigateToInvoice) {
          onNavigateToInvoice(id);
      }
  };

  return (
    <div className="w-64 text-white h-screen flex flex-col shadow-xl fixed left-0 top-0 z-20 transition-all duration-300 relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${secondaryColor} 0%, #020617 100%)` }}>
      
      {/* Beta / Impersonation Warning Banner */}
      {isBeta ? (
        <div className="bg-fuchsia-500 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider flex items-center justify-center gap-1 animate-pulse">
            <TestTube size={12} /> BETA LAB ENVIRONMENT
        </div>
      ) : isAppView && isSuperuser && (
        <div className="bg-amber-500 text-amber-950 text-[10px] font-bold text-center py-1 uppercase tracking-wider flex items-center justify-center gap-1">
            <ShieldCheck size={12} /> Superuser Mode
        </div>
      )}

      <div className="p-6 border-b border-white/5 relative">
        <h1 className="text-xl font-bold text-white flex items-center gap-3">
           {isSuperuser && !isAppView && !isBeta ? (
               <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">SU</div>
           ) : tenant?.logoUrl ? (
             <img src={tenant.logoUrl} alt="Logo" className="h-8 w-8" />
           ) : (
             <div className={`h-8 w-8 rounded-lg backdrop-blur-sm flex items-center justify-center font-bold text-white border border-white/10 ${isBeta ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-white/10'}`}>
               {tenant?.name.substring(0,2).toUpperCase() || 'IF'}
             </div>
           )}
           <span className="truncate tracking-tight">
             {isAppView ? (tenant?.name || 'InvoiceFlow') : (isSuperuser ? 'Super Admin' : (tenant?.name || 'InvoiceFlow'))}
           </span>
        </h1>
        <p className="text-[10px] text-white/40 mt-1.5 uppercase tracking-widest font-semibold ml-1">
            {isBeta ? 'Development Sandbox' : isSuperuser && !isAppView ? 'System Control' : 'Support at Home'}
        </p>
      </div>
      
      {/* Return Button for Superuser in App Mode */}
      {isAppView && isSuperuser && (
          <div className="px-4 pt-4 pb-2">
              <button 
                onClick={() => setCurrentView('superuser')}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all shadow-lg ${
                    isBeta 
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30 border border-fuchsia-500/50'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/50 animate-pulse-slow shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                }`}
              >
                  <ArrowLeftCircle size={16} />
                  {isBeta ? 'EXIT BETA LAB' : 'RETURN TO ADMIN'}
              </button>
          </div>
      )}
      
      {/* Standard Actions (Visible in App Mode) */}
      {(isAppView) && (
          <div className="p-4 space-y-3">
            <button 
              onClick={onScanClick}
              className="w-full text-white py-3 rounded-xl shadow-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] border border-white/10 relative overflow-hidden group"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <PlusCircle size={20} className="relative z-10" />
              <span className="relative z-10">Scan Invoice</span>
            </button>

            {isBeta && onToggleDevTools && (
                <button 
                  onClick={onToggleDevTools}
                  className="w-full bg-slate-900 text-fuchsia-400 hover:text-white hover:bg-slate-800 py-2 rounded-xl border border-fuchsia-500/30 font-medium flex items-center justify-center gap-2 text-sm transition-all"
                >
                  <Terminal size={16} />
                  Open DevTools
                </button>
            )}

            {!isBeta && (
                <button 
                onClick={onSimulateEmailClick}
                className="w-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white py-2 rounded-xl border border-white/5 font-medium flex items-center justify-center gap-2 text-sm transition-all"
                >
                <Mail size={16} />
                Simulate Email
                </button>
            )}
          </div>
      )}

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {/* Global Admin Navigation */}
        {isSuperuser && !isAppView ? (
            <div className="space-y-1">
                <button
                onClick={() => setCurrentView('superuser')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === 'superuser' ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                <ShieldCheck size={20} className={currentView === 'superuser' ? "text-emerald-400" : ""} />
                <span className="font-medium">Global Admin</span>
                </button>
                
                <button 
                    onClick={() => setCurrentView('superuser_audit')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${currentView === 'superuser_audit' ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Activity size={20} className={currentView === 'superuser_audit' ? "text-blue-400" : ""} />
                    <span className="font-medium">Audit Logs</span>
                </button>
                 <button 
                    onClick={() => setCurrentView('superuser_settings')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${currentView === 'superuser_settings' ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Settings size={20} className={currentView === 'superuser_settings' ? "text-purple-400" : ""} />
                    <span className="font-medium">Global Settings</span>
                </button>
            </div>
        ) : (
            // Standard Tenant Navigation
            menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-white/10 text-white shadow-md border border-white/5' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={20} className={`transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })
        )}
      </nav>

      <div className="p-4">
          <button 
             onClick={() => setCurrentView('help')}
             className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors mb-2 ${currentView === 'help' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
             <HelpCircle size={18} />
             <span className="text-sm font-medium">Help & Support</span>
          </button>

          {/* Quick Legal Link */}
          <button 
             onClick={() => setShowLegalModal(true)}
             className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors mb-4 text-slate-400 hover:text-white hover:bg-white/5"
          >
             <Scale size={18} />
             <span className="text-sm font-medium">Privacy & Legal</span>
          </button>

          <div className="border-t border-white/5 pt-4 bg-black/20 backdrop-blur-sm -mx-4 px-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border border-white/10 shadow-lg ${isSuperuser ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                  {isSuperuser ? 'SU' : 'JS'}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{isSuperuser ? 'Super User' : 'Jane Smith'}</p>
                  <p className="text-xs text-white/30">{isSuperuser ? 'Root Admin' : 'Administrator'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                  <NotificationCenter onNavigate={handleNotificationNavigate} />
                  <button onClick={onLogout} className="text-white/30 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full" title="Logout">
                     <LogOut size={16} />
                  </button>
              </div>
            </div>
          </div>
      </div>

      <LegalPolicyViewer 
          isOpen={showLegalModal} 
          onClose={() => setShowLegalModal(false)} 
          type="privacy" 
      />
    </div>
  );
};

export default Sidebar;
