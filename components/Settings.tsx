
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, AuditPromptConfig, PolicyDocument, DocumentSettings, AccountingConfig, NotificationRule, NotificationTrigger } from '../types';
import { Save, Server, Shield, BrainCircuit, FileText, CheckCircle, Database, ToggleLeft, ToggleRight, Cloud, Key, Eye, EyeOff, Loader2, X, Check, DollarSign, AlertTriangle, Briefcase, Calculator, Activity, Lock, Globe, Mail, Copy, Folder, ChevronRight, Filter, ExternalLink, ShieldCheck, Stethoscope, Palette, Image as ImageIcon, Sparkles, Scale, AlertOctagon, HardDrive, Search, LayoutTemplate, Briefcase as BriefcaseIcon, Bell, Send, Link, Unlink, RefreshCw, ChevronDown, ChevronUp, Cpu, Network, Zap, Laptop, Building2, WifiOff, LogIn } from 'lucide-react';
import PolicyUploader from './PolicyUploader';
import LegalPolicyViewer, { PolicyType } from './LegalPolicyViewer';
import { authenticateAlayaCare } from '../services/alayaCareService';
import { authenticateLookout } from '../services/lookoutService';
import { useTenant } from '../contexts/TenantContext';
import { generateBrandingProfile } from '../services/geminiService';
import { sendRealEmail } from '../services/emailService';

const LIVE_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const PROMPT_SECTIONS: { key: keyof AuditPromptConfig; label: string; icon: React.ElementType; color: string; placeholder: string; height: string }[] = [
    { key: 'priceReasonableness', label: 'Price Reasonableness', icon: DollarSign, color: 'text-emerald-600', placeholder: 'Instructions for checking unit prices...', height: 'h-24' },
    { key: 'fraudIndicators', label: 'Fraud Indicators', icon: AlertTriangle, color: 'text-amber-600', placeholder: 'Rules for detecting suspicious patterns...', height: 'h-28' },
    { key: 'contractorCompliance', label: 'Contractor Compliance', icon: Briefcase, color: 'text-blue-600', placeholder: 'Instructions for checking company list and legal compliance...', height: 'h-28' },
    { key: 'consistencyCheck', label: 'Consistency Check', icon: Calculator, color: 'text-slate-600', placeholder: 'Instructions for validating totals...', height: 'h-24' },
    { key: 'riskAssessment', label: 'Risk Assessment', icon: Activity, color: 'text-rose-600', placeholder: 'How the AI should score risk...', height: 'h-24' },
];

const NOTIFICATION_TRIGGERS: { key: NotificationTrigger; label: string; description: string }[] = [
    { key: 'AUDIT_FAILED', label: 'Audit Failed', description: 'When validation rules fail or exceptions occur.' },
    { key: 'HIGH_RISK_DETECTED', label: 'High Risk Invoice', description: 'When AI assigns a risk score > 70.' },
    { key: 'INVOICE_APPROVED', label: 'Invoice Approved', description: 'When an invoice is approved for payment.' },
    { key: 'INVOICE_REJECTED', label: 'Invoice Rejected', description: 'When an invoice is rejected.' },
];

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const { tenant, updateTenantDetails } = useTenant();
  
  // Safe Initialization with Default Values
  const [localSettings, setLocalSettings] = useState<AppSettings>(() => {
       const d = { ...settings };
       // Ensure deep objects exist
       if (!d.alayaCare) d.alayaCare = { connected: false, tenantUrl: '', clientId: '', clientSecret: '' };
       if (!d.lookout) d.lookout = { connected: false, apiEndpoint: 'https://api.thelookoutway.com/v1', apiKey: '' };
       if (!d.emailConfig) d.emailConfig = { enabled: false, mode: 'forwarding', forwardingAddress: '' };
       if (!d.compliance) d.compliance = { orgPrivacyPolicyUrl: '', orgTermsOfServiceUrl: '', dataBreachContactEmail: '', dataSovereigntyRegion: 'AU-SYD', auditLogRetentionDays: 90 };
       if (!d.llmKeys) d.llmKeys = { gemini: '', openai: '', anthropic: '', grok: '', perplexity: '' };
       
       // Ensure Accounting Configs exist
       if (!d.xero) d.xero = { connected: false, clientId: '', clientSecret: '' };
       if (!d.myob) d.myob = { connected: false, clientId: '', clientSecret: '' };
       if (!d.quickbooks) d.quickbooks = { connected: false, clientId: '', clientSecret: '' };
       if (!d.epicor) d.epicor = { connected: false, clientId: '', clientSecret: '' };
       if (!d.sap) d.sap = { connected: false, clientId: '', clientSecret: '' };

       // Ensure Notifications exist
       if (!d.notificationRules) d.notificationRules = [];
       if (!d.emailServiceConfig) d.emailServiceConfig = { provider: 'emailjs', serviceId: '', templateId: '', publicKey: '' };

       return d;
  });
  
  const [activeTab, setActiveTab] = useState<'integrations' | 'notifications' | 'ai-prompts' | 'knowledge' | 'branding' | 'compliance'>('integrations');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isTestEmailSending, setIsTestEmailSending] = useState(false);
  
  // Expanded card state for integrations
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  
  // UI State for AI Execution Mode
  const [aiExecutionMode, setAiExecutionMode] = useState<'cloud' | 'private' | 'device'>('cloud');
  
  // UI State for Router Toggle
  const [enableRouter, setEnableRouter] = useState(true);

  // Compliance / Legal Modal State
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalType, setLegalModalType] = useState<PolicyType>('privacy');

  // Branding State
  const [brandingForm, setBrandingForm] = useState({
      website: '',
      primaryColor: tenant?.primaryColor || '#3b82f6',
      logoUrl: tenant?.logoUrl || '',
      documentSettings: tenant?.documentSettings || {
          headerText: tenant?.name || 'Organization Name',
          subHeaderText: '',
          footerText: 'Confidential | Generated by InvoiceFlow',
          showLogo: true
      }
  });
  const [isGeneratingBrand, setIsGeneratingBrand] = useState(false);
  const brandingFileRef = useRef<HTMLInputElement>(null);

  // Storage Setup State
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  
  // Email Config State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailAuthStep, setEmailAuthStep] = useState<'provider' | 'config'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<'microsoft' | 'google' | null>(null);
  const [oauthConfig, setOauthConfig] = useState({
      clientId: '',
      redirectUri: window.location.origin // Default to current domain
  });
  
  // Notification Email Source Choice
  const [emailSource, setEmailSource] = useState<'integrated' | 'custom'>(
      localSettings.emailServiceConfig.serviceId ? 'custom' : 'integrated'
  );

  // Sync tenant branding to form on load
  useEffect(() => {
      if (tenant) {
          setBrandingForm(prev => ({
              ...prev,
              primaryColor: tenant.primaryColor,
              logoUrl: tenant.logoUrl || '',
              documentSettings: tenant.documentSettings || {
                  headerText: tenant.name,
                  subHeaderText: '',
                  footerText: `${tenant.name} | Confidential`,
                  showLogo: true
              }
          }));
      }
  }, [tenant]);

  // OAUTH LISTENER
  useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'OAUTH_SUCCESS') {
              // The App.tsx handles 'OAUTH_SUCCESS' generically, but we can also listen here if needed
              // or handle it via App.tsx logic. 
              // However, typically App.tsx will handle the popup callback and post message to *its* window.
              // We'll rely on the standard listener we added in App.tsx to catch it, or add a specific one here.
              // For simplicity, we assume App.tsx catches it and we can just listen for the same message if we want to update local state immediately.
          }
          
          if (event.data?.type === 'OAUTH_SUCCESS' || event.data?.type === 'OAUTH_SUCCESS_SETTINGS') {
              setLocalSettings(prev => ({
                  ...prev,
                  emailConfig: {
                      ...prev.emailConfig,
                      connectedAccount: {
                          provider: event.data.provider,
                          email: `authenticated-user@${event.data.provider}.com`, // In real flow we'd fetch profile
                          monitoredFolder: 'Inbox',
                          lastSync: new Date().toISOString()
                      }
                  },
                  emailServiceConfig: {
                      ...prev.emailServiceConfig,
                      provider: event.data.provider,
                      accessToken: event.data.token,
                      clientId: oauthConfig.clientId
                  }
              }));
              setIsEmailModalOpen(false);
              alert(`Successfully connected ${event.data.provider === 'microsoft' ? 'Microsoft 365' : 'Google Workspace'}!`);
          }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, [oauthConfig.clientId]);

  const handleSave = () => {
    setSaveStatus('saving');
    
    // Save Tenant Specific Branding and Document Settings
    if (tenant) {
        updateTenantDetails(tenant.id, {
            primaryColor: brandingForm.primaryColor,
            logoUrl: brandingForm.logoUrl,
            documentSettings: brandingForm.documentSettings
        });
    }

    setTimeout(() => {
        onSave(localSettings);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const handleTestEmail = async () => {
      setIsTestEmailSending(true);
      
      const success = await sendRealEmail(
          localSettings.emailServiceConfig, 
          'test-admin@example.com', // In real life this would be the user's email
          'Test Notification from InvoiceFlow',
          'This is a confirmation that your email service configuration is working correctly.'
      );
      
      if (success) {
          alert('Test email sent successfully! Check your inbox.');
      } else {
          alert('Failed to send test email. Check your configuration keys.');
      }
      setIsTestEmailSending(false);
  };

  const updateNotificationRule = (key: NotificationTrigger, field: keyof NotificationRule, value: any) => {
      setLocalSettings(prev => {
          const rules = [...prev.notificationRules];
          const index = rules.findIndex(r => r.trigger === key);
          
          if (index >= 0) {
              rules[index] = { ...rules[index], [field]: value };
          } else {
              // Create if not exists
              const newRule: NotificationRule = {
                  id: `rule-${Date.now()}`,
                  trigger: key,
                  emailEnabled: field === 'emailEnabled' ? value : false,
                  inAppEnabled: field === 'inAppEnabled' ? value : true,
                  recipients: field === 'recipients' ? value : ''
              };
              rules.push(newRule);
          }
          return { ...prev, notificationRules: rules };
      });
  };

  const getRule = (key: NotificationTrigger) => {
      return localSettings.notificationRules.find(r => r.trigger === key) || { emailEnabled: false, inAppEnabled: true, recipients: '' };
  };

  const openLegalModal = (type: PolicyType) => { setLegalModalType(type); setShowLegalModal(true); };
  
  // Branding Helpers
  const handleGenerateBranding = async (type: 'create' | 'edit', website: string, logoUrl: string) => {
      setIsGeneratingBrand(true);
      try {
          const palette = await generateBrandingProfile(website, logoUrl);
          setBrandingForm(p => ({...p, primaryColor: palette.primaryColor}));
      } catch(e) { console.error(e); } 
      finally { setIsGeneratingBrand(false); }
  };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => setBrandingForm(p => ({...p, logoUrl: ev.target?.result as string}));
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  // Integration Handlers
  const handleToggleEmailConfig = () => {
      if (localSettings.emailConfig.connectedAccount) {
          // Disconnect
          setLocalSettings(prev => ({
              ...prev,
              emailConfig: { ...prev.emailConfig, connectedAccount: undefined, enabled: false }
          }));
      } else {
          // Connect Flow
          setEmailAuthStep('provider');
          setOauthConfig({ clientId: '', redirectUri: window.location.origin }); // Reset config
          setIsEmailModalOpen(true);
      }
  };

  const selectProvider = (provider: 'microsoft' | 'google') => {
      setSelectedProvider(provider);
      setEmailAuthStep('config');
      // Pre-fill Google ID if selected
      if (provider === 'google') {
          setOauthConfig(prev => ({ ...prev, clientId: LIVE_GOOGLE_CLIENT_ID }));
      } else {
          setOauthConfig(prev => ({ ...prev, clientId: '' }));
      }
  }

  const initiateRealOAuth = () => {
      if (!selectedProvider) return;
      if (!oauthConfig.clientId) {
          alert("Please enter a Client ID");
          return;
      }
      
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const redirectUri = window.location.origin;
      let authUrl = '';

      if (selectedProvider === 'microsoft') {
          // Azure AD v2.0 endpoint - Implicit Grant
          const scope = encodeURIComponent('User.Read Mail.Send');
          authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${oauthConfig.clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${selectedProvider}`;
      } else {
          // Google OAuth 2.0 endpoint - Implicit Grant
          // Use 'https://www.googleapis.com/auth/gmail.send' scope for sending emails
          const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.send');
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${oauthConfig.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&state=${selectedProvider}`;
      }

      const popup = window.open(authUrl, 'oauth_popup_settings', `width=${width},height=${height},left=${left},top=${top}`);
      
      if (!popup) {
          alert("Popup blocked. Please allow popups.");
      }
  };

  const toggleIntegration = (key: 'xero' | 'myob' | 'quickbooks' | 'epicor' | 'sap' | 'alayaCare' | 'lookout') => {
      setLocalSettings(prev => {
          const current = prev[key];
          return {
              ...prev,
              [key]: { ...current, connected: !current.connected }
          };
      });
  };

  // Helper to render Integration Card
  const renderIntegrationCard = (
      key: 'xero' | 'myob' | 'quickbooks' | 'epicor' | 'sap',
      name: string,
      description: string,
      colorClass: string,
      iconLetter: string
  ) => {
      const config = localSettings[key];
      const isExpanded = expandedIntegration === key;

      return (
          <div className={`bg-white rounded-xl border transition-all overflow-hidden ${config.connected ? 'border-emerald-200 shadow-sm' : 'border-slate-200 shadow-sm opacity-90'}`}>
              <div className="p-6 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg ${colorClass}`}>
                          {iconLetter}
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                              {name}
                              {config.connected && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Active</span>}
                          </h4>
                          <p className="text-xs text-slate-500">{description}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button 
                          onClick={() => setExpandedIntegration(isExpanded ? null : key)}
                          className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center gap-1"
                      >
                          Configure {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button 
                          onClick={() => toggleIntegration(key)}
                          className={`text-xs px-3 py-1.5 rounded font-bold transition-all ${
                              config.connected 
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600' 
                                  : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                      >
                          {config.connected ? 'Disconnect' : 'Connect'}
                      </button>
                  </div>
              </div>
              
              {isExpanded && (
                  <div className="bg-slate-50 p-6 border-t border-slate-100 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client ID</label>
                              <input 
                                  type="text" 
                                  value={config.clientId || ''}
                                  onChange={(e) => setLocalSettings(p => ({ ...p, [key]: { ...p[key], clientId: e.target.value } }))}
                                  className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
                                  placeholder="Enter Client ID"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Secret</label>
                              <input 
                                  type="password" 
                                  value={config.clientSecret || ''}
                                  onChange={(e) => setLocalSettings(p => ({ ...p, [key]: { ...p[key], clientSecret: e.target.value } }))}
                                  className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
                                  placeholder="Enter Secret"
                              />
                          </div>
                          {(key === 'epicor' || key === 'sap') && (
                              <div className="col-span-2">
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Endpoint URL</label>
                                  <input 
                                      type="text" 
                                      value={config.apiEndpoint || ''}
                                      onChange={(e) => setLocalSettings(p => ({ ...p, [key]: { ...p[key], apiEndpoint: e.target.value } }))}
                                      className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
                                      placeholder="https://api.example.com/v1"
                                  />
                              </div>
                          )}
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>Last Synced: {config.lastSync ? new Date(config.lastSync).toLocaleString() : 'Never'}</span>
                          <button className="text-indigo-600 hover:underline">Test Connection</button>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto relative h-screen flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configuration</h2>
          <p className="text-slate-500">Manage system connections, API keys, and fine-tune AI behavior.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all active:scale-95"
        >
          {saveStatus === 'saving' ? <span className="animate-pulse">Saving...</span> : saveStatus === 'saved' ? <><CheckCircle size={18} /><span>Saved</span></> : <><Save size={18} /><span>Save Changes</span></>}
        </button>
      </div>

      <div className="flex space-x-6 flex-1 min-h-0">
        <div className="w-64 space-y-2 shrink-0">
            {[
                { id: 'integrations', label: 'Integrations', icon: Server },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'compliance', label: 'Compliance & Legal', icon: Scale },
                { id: 'branding', label: 'Look & Feel', icon: Palette },
                { id: 'ai-prompts', label: 'AI Prompt Tuning', icon: BrainCircuit },
                { id: 'knowledge', label: 'Security & Policy', icon: Shield }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium flex items-center justify-between transition-colors ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                >
                    <div className="flex items-center space-x-3">
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                    </div>
                </button>
            ))}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-8 overflow-y-auto">
            
            {activeTab === 'notifications' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* ... (Previous Notification Code) ... */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Mail className="text-blue-500" size={20} /> Email Delivery Channel
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Choose how InvoiceFlow sends notifications to staff and vendors.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Option 1: Integrated Account */}
                            <div 
                                onClick={() => setEmailSource('integrated')}
                                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${emailSource === 'integrated' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 font-bold text-slate-800">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${emailSource === 'integrated' ? 'border-blue-600' : 'border-slate-300'}`}>
                                            {emailSource === 'integrated' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                        </div>
                                        Use Integrated Account
                                    </div>
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">Recommended</span>
                                </div>
                                <p className="text-sm text-slate-600 mb-3 pl-6">
                                    Send emails using the account connected in Integrations. No extra setup required.
                                </p>
                                <div className="pl-6">
                                    {localSettings.emailConfig.connectedAccount ? (
                                        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-white/50 px-3 py-2 rounded border border-emerald-200">
                                            <CheckCircle size={16} />
                                            Connected: <strong>{localSettings.emailConfig.connectedAccount.email}</strong>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-amber-700 bg-white/50 px-3 py-2 rounded border border-amber-200">
                                            <AlertTriangle size={16} />
                                            <span>Not connected. <button onClick={() => setActiveTab('integrations')} className="underline font-bold hover:text-amber-800">Setup now</button></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Option 2: Custom Gateway */}
                            <div 
                                onClick={() => setEmailSource('custom')}
                                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${emailSource === 'custom' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 font-bold text-slate-800">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${emailSource === 'custom' ? 'border-blue-600' : 'border-slate-300'}`}>
                                            {emailSource === 'custom' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                        </div>
                                        Custom Gateway
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-3 pl-6">
                                    Configure specific EmailJS credentials or SMTP settings manually.
                                </p>
                            </div>
                        </div>

                        {/* Config Area */}
                        {emailSource === 'custom' && (
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 animate-in slide-in-from-top-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">EmailJS Configuration</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service ID</label>
                                        <input 
                                            type="text" 
                                            placeholder="service_xxxxx"
                                            value={localSettings.emailServiceConfig.serviceId}
                                            onChange={(e) => setLocalSettings(p => ({...p, emailServiceConfig: {...p.emailServiceConfig, serviceId: e.target.value}}))}
                                            className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Template ID</label>
                                        <input 
                                            type="text" 
                                            placeholder="template_xxxxx"
                                            value={localSettings.emailServiceConfig.templateId}
                                            onChange={(e) => setLocalSettings(p => ({...p, emailServiceConfig: {...p.emailServiceConfig, templateId: e.target.value}}))}
                                            className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Public Key</label>
                                        <input 
                                            type="password" 
                                            placeholder="user_xxxxx"
                                            value={localSettings.emailServiceConfig.publicKey}
                                            onChange={(e) => setLocalSettings(p => ({...p, emailServiceConfig: {...p.emailServiceConfig, publicKey: e.target.value}}))}
                                            className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button 
                                onClick={handleTestEmail}
                                disabled={isTestEmailSending}
                                className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-300 px-3 py-2 rounded hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-50"
                            >
                                {isTestEmailSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Send Test Email
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 w-full" />

                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Bell className="text-amber-500" size={20} /> Notification Rules
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Define who receives alerts when specific system events occur.
                        </p>

                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                    <tr>
                                        <th className="p-4">Trigger Event</th>
                                        <th className="p-4 w-24 text-center">In-App</th>
                                        <th className="p-4 w-24 text-center">Email</th>
                                        <th className="p-4">Recipients (Staff)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {NOTIFICATION_TRIGGERS.map((trigger) => {
                                        const rule = getRule(trigger.key);
                                        return (
                                            <tr key={trigger.key} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-bold text-sm text-slate-800">{trigger.label}</p>
                                                    <p className="text-xs text-slate-500">{trigger.description}</p>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={rule.inAppEnabled} 
                                                        onChange={(e) => updateNotificationRule(trigger.key, 'inAppEnabled', e.target.checked)}
                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="p-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={rule.emailEnabled} 
                                                        onChange={(e) => updateNotificationRule(trigger.key, 'emailEnabled', e.target.checked)}
                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input 
                                                        type="text" 
                                                        placeholder="admin@org.com, finance@org.com"
                                                        value={rule.recipients}
                                                        onChange={(e) => updateNotificationRule(trigger.key, 'recipients', e.target.value)}
                                                        className={`w-full p-2 border rounded text-sm transition-colors ${rule.emailEnabled ? 'border-slate-300 bg-white' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                                                        disabled={!rule.emailEnabled}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'integrations' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* EMAIL INTEGRATION */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Mail className="text-indigo-600" size={20} /> Email Communication
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Connect your Outlook or Gmail to ingest invoices and send notifications.</p>
                            </div>
                            <button 
                                onClick={handleToggleEmailConfig}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                    localSettings.emailConfig.connectedAccount 
                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                            >
                                {localSettings.emailConfig.connectedAccount ? <Unlink size={16} /> : <Link size={16} />}
                                {localSettings.emailConfig.connectedAccount ? 'Disconnect' : 'Connect Account'}
                            </button>
                        </div>
                        
                        {localSettings.emailConfig.connectedAccount ? (
                            <div className="p-6 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                                        {localSettings.emailConfig.connectedAccount.provider === 'microsoft' 
                                            ? <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-6 h-6" alt="Microsoft" />
                                            : <span className="font-bold text-xl text-slate-700">G</span>
                                        }
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{localSettings.emailConfig.connectedAccount.email}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <RefreshCw size={10} /> Last synced: {new Date(localSettings.emailConfig.connectedAccount.lastSync).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded border border-emerald-200 flex items-center gap-1">
                                        <CheckCircle size={12} /> Active
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-slate-50/50">
                                <p className="text-slate-400 text-sm italic">No email account connected. Connect to enable automation.</p>
                            </div>
                        )}
                    </div>

                    {/* AI EXECUTION & PRIVACY CONFIGURATION */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <BrainCircuit className="text-purple-600" size={20} /> AI Engine & Privacy
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Configure where and how your data is processed.</p>
                        </div>
                        
                        <div className="p-6 bg-slate-50 border-b border-slate-200">
                            
                            {/* Execution Environment Selector */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div 
                                    onClick={() => setAiExecutionMode('cloud')}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${aiExecutionMode === 'cloud' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-2 rounded-lg ${aiExecutionMode === 'cloud' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            <Cloud size={18} />
                                        </div>
                                        <span className={`font-bold text-sm ${aiExecutionMode === 'cloud' ? 'text-purple-900' : 'text-slate-700'}`}>Public Cloud (SaaS)</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Use managed enterprise APIs (Gemini, OpenAI). Best performance and reasoning capabilities.
                                    </p>
                                </div>

                                <div 
                                    onClick={() => setAiExecutionMode('private')}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${aiExecutionMode === 'private' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-2 rounded-lg ${aiExecutionMode === 'private' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            <Building2 size={18} />
                                        </div>
                                        <span className={`font-bold text-sm ${aiExecutionMode === 'private' ? 'text-blue-900' : 'text-slate-700'}`}>Private Cloud / On-Prem</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Connect to internal corporate models (Ollama, vLLM, Azure). Data stays within your network.
                                    </p>
                                </div>

                                <div 
                                    onClick={() => setAiExecutionMode('device')}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${aiExecutionMode === 'device' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-2 rounded-lg ${aiExecutionMode === 'device' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            <Laptop size={18} />
                                        </div>
                                        <span className={`font-bold text-sm ${aiExecutionMode === 'device' ? 'text-emerald-900' : 'text-slate-700'}`}>Secure On-Device</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Run locally on user hardware (Gemini Nano). Zero data egress. Offline capable.
                                    </p>
                                </div>
                            </div>

                            {/* Mode Specific Configurations */}
                            
                            {/* 1. PUBLIC CLOUD CONFIG */}
                            {aiExecutionMode === 'cloud' && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    {/* Explanation */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 mb-6">
                                        <div className="p-2 bg-blue-100 rounded-lg h-fit text-blue-600"><Network size={20} /></div>
                                        <div>
                                            <h4 className="font-bold text-blue-900 text-sm">Multi-Model Routing Active</h4>
                                            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                                                InvoiceFlow uses an <strong>Intelligent Router</strong> to automatically assign tasks based on complexity:
                                            </p>
                                            <ul className="mt-2 space-y-1 text-xs text-blue-800 list-disc pl-4">
                                                <li><strong>Nano Banana Pro / Gemini 3:</strong> High-speed tasks like UI chat, OCR.</li>
                                                <li><strong>Gemini 3 / ChatGPT 5.2 / Claude 4.5:</strong> Complex reasoning tasks like "Deep Audit".</li>
                                                <li><strong>Perplexity Sonar / Grok 4.1:</strong> Real-time web grounding.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Router Toggle */}
                                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${enableRouter ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <Zap size={20} />
                                            </div>
                                            <div>
                                                <span className="block font-bold text-slate-700 text-sm">Enable Dynamic Routing</span>
                                                <span className="text-xs text-slate-500">Automatically switch models based on task complexity.</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setEnableRouter(!enableRouter)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enableRouter ? 'bg-purple-600' : 'bg-slate-300'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableRouter ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {/* API Keys Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-2">
                                                Google Gemini <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">Primary</span>
                                            </label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                                <input 
                                                    type="password" 
                                                    value={localSettings.llmKeys.gemini} 
                                                    onChange={(e) => setLocalSettings(p => ({ ...p, llmKeys: { ...p.llmKeys, gemini: e.target.value } }))}
                                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                    placeholder="AIza..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">OpenAI (Chat GPT)</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                                <input 
                                                    type="password" 
                                                    value={localSettings.llmKeys.openai} 
                                                    onChange={(e) => setLocalSettings(p => ({ ...p, llmKeys: { ...p.llmKeys, openai: e.target.value } }))}
                                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                    placeholder="sk-..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Anthropic (Claude)</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                                <input 
                                                    type="password" 
                                                    value={localSettings.llmKeys.anthropic} 
                                                    onChange={(e) => setLocalSettings(p => ({ ...p, llmKeys: { ...p.llmKeys, anthropic: e.target.value } }))}
                                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                    placeholder="sk-ant-..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">xAI (Grok)</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                                <input 
                                                    type="password" 
                                                    value={localSettings.llmKeys.grok} 
                                                    onChange={(e) => setLocalSettings(p => ({ ...p, llmKeys: { ...p.llmKeys, grok: e.target.value } }))}
                                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                    placeholder="xai-..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Perplexity AI</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                                <input 
                                                    type="password" 
                                                    value={localSettings.llmKeys.perplexity} 
                                                    onChange={(e) => setLocalSettings(p => ({ ...p, llmKeys: { ...p.llmKeys, perplexity: e.target.value } }))}
                                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                    placeholder="pplx-..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. PRIVATE CLOUD CONFIG */}
                            {aiExecutionMode === 'private' && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                        <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                                            <ShieldCheck size={16} /> Enterprise Gateway
                                        </h4>
                                        <p className="text-xs text-blue-800 mt-2">
                                            Configure connection to your organization's internal model inference endpoint (e.g., Azure OpenAI, Ollama, vLLM).
                                            Ensure the endpoint is accessible from this client network.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Inference Endpoint URL</label>
                                            <div className="relative">
                                                <Server className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                                <input 
                                                    type="text" 
                                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                    placeholder="https://ai-internal.corp.com/v1"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Model Name</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                placeholder="llama3:70b-instruct"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Auth Token (Optional)</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                                <input 
                                                    type="password" 
                                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                    placeholder="Bearer token..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. ON-DEVICE CONFIG */}
                            {aiExecutionMode === 'device' && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                                        <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                                            <WifiOff size={16} /> Offline & Secure Processing
                                        </h4>
                                        <p className="text-xs text-emerald-800 mt-2">
                                            Utilizes the browser's built-in AI (Gemini Nano) or WebLLM. 
                                            <strong>Zero data leaves this device.</strong> Ideal for highly sensitive PII.
                                        </p>
                                    </div>
                                    
                                    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                            <Cpu size={32} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-800">Browser Compatibility Check</h5>
                                            <p className="text-xs text-slate-500 mt-1">Checking for <code>window.ai</code> availability...</p>
                                        </div>
                                        <button className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">
                                            Run Compatibility Test
                                        </button>
                                        <p className="text-[10px] text-slate-400 italic max-w-sm">
                                            Note: On-device models usually have lower reasoning capabilities compared to Cloud models. Recommended for extraction and basic summarization only.
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* ACCOUNTING INTEGRATIONS */}
                    <div className="grid grid-cols-1 gap-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Calculator className="text-blue-600" size={20} /> Accounting & ERP Systems
                        </h3>
                        {renderIntegrationCard('xero', 'Xero', 'Accounting & Payroll', 'bg-blue-500', 'X')}
                        {renderIntegrationCard('myob', 'MYOB', 'Business Management', 'bg-purple-600', 'M')}
                        {renderIntegrationCard('quickbooks', 'QuickBooks', 'Intuit Accounting', 'bg-green-600', 'Q')}
                        {renderIntegrationCard('epicor', 'Epicor', 'ERP System', 'bg-orange-600', 'E')}
                        {renderIntegrationCard('sap', 'SAP', 'Enterprise ERP', 'bg-slate-700', 'S')}
                    </div>

                    {/* CARE MANAGEMENT SYSTEMS */}
                    <div className="grid grid-cols-1 gap-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Stethoscope className="text-rose-600" size={20} /> Care Management Systems
                        </h3>
                        
                        {/* AlayaCare */}
                        <div className={`bg-white rounded-xl border transition-all overflow-hidden ${localSettings.alayaCare.connected ? 'border-emerald-200 shadow-sm' : 'border-slate-200 shadow-sm opacity-90'}`}>
                            <div className="p-6 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">A</div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">AlayaCare {localSettings.alayaCare.connected && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Active</span>}</h4>
                                        <p className="text-xs text-slate-500">Client & Visit Data Sync</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setExpandedIntegration(expandedIntegration === 'alaya' ? null : 'alaya')} className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center gap-1">Configure {expandedIntegration === 'alaya' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
                                    <button onClick={() => toggleIntegration('alayaCare')} className={`text-xs px-3 py-1.5 rounded font-bold transition-all ${localSettings.alayaCare.connected ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{localSettings.alayaCare.connected ? 'Disconnect' : 'Connect'}</button>
                                </div>
                            </div>
                            {expandedIntegration === 'alaya' && (
                                <div className="bg-slate-50 p-6 border-t border-slate-100 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tenant URL</label>
                                            <input type="text" value={localSettings.alayaCare.tenantUrl} onChange={(e) => setLocalSettings(p => ({ ...p, alayaCare: { ...p.alayaCare, tenantUrl: e.target.value } }))} className="w-full p-2 border border-slate-300 rounded text-sm bg-white" placeholder="https://acme.alayacare.com" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client ID</label>
                                            <input type="text" value={localSettings.alayaCare.clientId} onChange={(e) => setLocalSettings(p => ({ ...p, alayaCare: { ...p.alayaCare, clientId: e.target.value } }))} className="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Secret</label>
                                            <input type="password" value={localSettings.alayaCare.clientSecret} onChange={(e) => setLocalSettings(p => ({ ...p, alayaCare: { ...p.alayaCare, clientSecret: e.target.value } }))} className="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Lookout */}
                        <div className={`bg-white rounded-xl border transition-all overflow-hidden ${localSettings.lookout.connected ? 'border-emerald-200 shadow-sm' : 'border-slate-200 shadow-sm opacity-90'}`}>
                            <div className="p-6 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">L</div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">The Lookout Way {localSettings.lookout.connected && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Active</span>}</h4>
                                        <p className="text-xs text-slate-500">Purchase Order Validation</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setExpandedIntegration(expandedIntegration === 'lookout' ? null : 'lookout')} className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center gap-1">Configure {expandedIntegration === 'lookout' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
                                    <button onClick={() => toggleIntegration('lookout')} className={`text-xs px-3 py-1.5 rounded font-bold transition-all ${localSettings.lookout.connected ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{localSettings.lookout.connected ? 'Disconnect' : 'Connect'}</button>
                                </div>
                            </div>
                            {expandedIntegration === 'lookout' && (
                                <div className="bg-slate-50 p-6 border-t border-slate-100 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Endpoint</label>
                                            <input type="text" value={localSettings.lookout.apiEndpoint} onChange={(e) => setLocalSettings(p => ({ ...p, lookout: { ...p.lookout, apiEndpoint: e.target.value } }))} className="w-full p-2 border border-slate-300 rounded text-sm bg-white" placeholder="https://api.thelookoutway.com/v1" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key</label>
                                            <input type="password" value={localSettings.lookout.apiKey} onChange={(e) => setLocalSettings(p => ({ ...p, lookout: { ...p.lookout, apiKey: e.target.value } }))} className="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ... (Rest of components: Branding, Compliance, AI Prompts, Knowledge, Legal Modal) ... */}
            {activeTab === 'compliance' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="text-indigo-600" size={20} /> Compliance Settings
                    </h3>
                    <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Privacy Policy URL</label>
                            <input type="text" className="w-full border border-slate-300 bg-white text-black p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={localSettings.compliance.orgPrivacyPolicyUrl} onChange={e => setLocalSettings(p => ({...p, compliance: {...p.compliance, orgPrivacyPolicyUrl: e.target.value}}))} placeholder="https://your-org.com/privacy" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Terms of Service URL</label>
                            <input type="text" className="w-full border border-slate-300 bg-white text-black p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={localSettings.compliance.orgTermsOfServiceUrl} onChange={e => setLocalSettings(p => ({...p, compliance: {...p.compliance, orgTermsOfServiceUrl: e.target.value}}))} placeholder="https://your-org.com/terms" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Data Breach Contact Email</label><input type="email" className="w-full border border-slate-300 bg-white text-black p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={localSettings.compliance.dataBreachContactEmail} onChange={e => setLocalSettings(p => ({...p, compliance: {...p.compliance, dataBreachContactEmail: e.target.value}}))} placeholder="dpo@your-org.com" /></div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Data Sovereignty Region</label>
                                <select className="w-full border border-slate-300 bg-white text-black p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={localSettings.compliance.dataSovereigntyRegion} onChange={e => setLocalSettings(p => ({...p, compliance: {...p.compliance, dataSovereigntyRegion: e.target.value as any}}))}>
                                    <option value="AU-SYD">Australia (Sydney) - Recommended</option>
                                    <option value="GLOBAL">Global (US/EU)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'branding' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Palette className="text-purple-600" size={20} /> Look & Feel</h3>
                    <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Primary Brand Color</label><div className="flex gap-4 items-center"><input type="color" value={brandingForm.primaryColor} onChange={e => setBrandingForm(p => ({...p, primaryColor: e.target.value}))} className="h-10 w-20 p-0 border-0 rounded cursor-pointer" /><span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">{brandingForm.primaryColor}</span></div></div>
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Logo URL</label><div className="flex gap-2"><input type="text" value={brandingForm.logoUrl} onChange={e => setBrandingForm(p => ({...p, logoUrl: e.target.value}))} className="flex-1 border border-slate-300 bg-white text-black p-2 rounded-lg text-sm" placeholder="https://example.com/logo.png" /><button onClick={() => brandingFileRef.current?.click()} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg text-slate-600"><ImageIcon size={20} /></button><input type="file" ref={brandingFileRef} className="hidden" accept="image/*" onChange={handleLogoUpload} /></div></div>
                        </div>
                        <div className="border-t border-slate-100 pt-6">
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                                <div><h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2"><Sparkles size={14} /> AI Theme Generator</h4><p className="text-xs text-indigo-700 mt-1">Enter your website to automatically generate a matching color palette.</p></div>
                                <div className="flex gap-2"><input type="text" value={brandingForm.website} onChange={e => setBrandingForm(p => ({...p, website: e.target.value}))} className="border border-indigo-200 rounded px-2 py-1 text-xs w-48" placeholder="your-website.com" /><button onClick={() => handleGenerateBranding('edit', brandingForm.website, brandingForm.logoUrl)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700 disabled:opacity-50" disabled={isGeneratingBrand}>{isGeneratingBrand ? 'Generating...' : 'Auto-Generate'}</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ai-prompts' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><BrainCircuit className="text-emerald-600" size={20} /> AI Prompt Tuning</h3>
                    <div className="space-y-4">{PROMPT_SECTIONS.map(section => { const Icon = section.icon; return ( <div key={section.key} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"> <div className="flex items-center gap-2 mb-3"> <Icon size={18} className={section.color} /> <label className="block text-sm font-bold text-slate-800">{section.label}</label> </div> <textarea className={`w-full p-3 border border-slate-300 rounded-lg text-xs bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${section.height}`} value={localSettings.auditPrompt[section.key]} onChange={e => setLocalSettings(p => ({...p, auditPrompt: {...p.auditPrompt, [section.key]: e.target.value}}))} placeholder={section.placeholder} /> </div> ); })}</div>
                </div>
            )}

            {activeTab === 'knowledge' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Shield className="text-indigo-600" size={20} /> Knowledge Base & Policies</h3>
                    <div className="bg-white p-6 border border-slate-200 rounded-xl">
                        <p className="text-sm text-slate-500 mb-4">Upload PDF policy documents (e.g. Procurement Policy, Delegations of Authority). The AI will read these to validate invoices against your internal rules.</p>
                        <PolicyUploader files={localSettings.policyFiles || []} onUpload={files => setLocalSettings(p => ({...p, policyFiles: [...(p.policyFiles||[]), ...files]}))} onRemove={id => setLocalSettings(p => ({...p, policyFiles: p.policyFiles.filter(f => f.id !== id)}))} />
                    </div>
                </div>
            )}
        </div>
      </div>

      <LegalPolicyViewer isOpen={showLegalModal} onClose={() => setShowLegalModal(false)} type={legalModalType} />
      
      {/* Email Setup Modal */}
      {isEmailModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Connect Account</h3>
                      <button onClick={() => setIsEmailModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                  </div>
                  
                  {emailAuthStep === 'provider' ? (
                      <div className="p-6 space-y-4">
                          <button onClick={() => selectProvider('microsoft')} className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                              <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-6 h-6" alt="Microsoft" />
                              <div className="text-left">
                                  <span className="block font-bold text-slate-700 group-hover:text-blue-700">Microsoft Outlook / 365</span>
                                  <span className="text-xs text-slate-500">Corporate & Personal</span>
                              </div>
                          </button>
                          <button onClick={() => selectProvider('google')} className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                              <div className="w-6 h-6 flex items-center justify-center font-bold text-slate-700 border border-slate-300 rounded bg-white">G</div>
                              <div className="text-left">
                                  <span className="block font-bold text-slate-700 group-hover:text-blue-700">Google Gmail</span>
                                  <span className="text-xs text-slate-500">Workspace & Personal</span>
                              </div>
                          </button>
                      </div>
                  ) : (
                      <div className="p-6">
                          <div className="text-center mb-6">
                              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600">
                                  <Key size={24} />
                              </div>
                              <h3 className="font-bold text-slate-800">OAuth Configuration</h3>
                              <p className="text-sm text-slate-500 mt-1">Enter your App Credentials to enable real authentication.</p>
                          </div>
                          
                          <div className="space-y-4 mb-6">
                              <div>
                                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Client ID</label>
                                  <input 
                                      type="text" 
                                      value={oauthConfig.clientId}
                                      onChange={(e) => setOauthConfig({...oauthConfig, clientId: e.target.value})}
                                      className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                      placeholder={`Enter ${selectedProvider === 'microsoft' ? 'Azure' : 'GCP'} Client ID`}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Redirect URI</label>
                                  <input 
                                      type="text" 
                                      value={oauthConfig.redirectUri}
                                      readOnly
                                      className="w-full p-2 border border-slate-200 bg-slate-50 rounded text-sm text-slate-500"
                                  />
                                  <p className="text-[10px] text-slate-400 mt-1">Add this URI to your App Registration settings.</p>
                              </div>
                          </div>

                          <button 
                              onClick={initiateRealOAuth}
                              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                              <LogIn size={16} /> Authenticate with {selectedProvider === 'microsoft' ? 'Microsoft' : 'Google'}
                          </button>
                          
                          <button 
                              onClick={() => setEmailAuthStep('provider')}
                              className="w-full mt-2 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                          >
                              Back
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Storage Setup Modal */}
      {isStorageModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-96 text-center">
                  <h3 className="font-bold mb-4">Storage Setup</h3>
                  <button onClick={() => setIsStorageModalOpen(false)} className="mt-4 text-sm text-slate-400 hover:text-slate-600">Cancel</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
