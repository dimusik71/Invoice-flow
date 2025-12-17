
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceDetail from './components/InvoiceDetail';
import InvoiceScanner from './components/InvoiceScanner';
import Settings from './components/Settings';
import SuperuserDashboard from './components/SuperuserDashboard';
import ClientList from './components/ClientList';
import HelpCenter from './components/HelpCenter';
import Login from './components/Login';
import FloatingAgent from './components/FloatingAgent';
import Reports from './components/Reports';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { Invoice, InvoiceStatus, AppSettings, UserRole } from './types';
import { performDeepAudit } from './services/geminiService';
import { validateInvoiceAgainstSystem } from './services/validationService';
import { assembleAuditPrompt } from './services/promptService';
import { sendRealEmail } from './services/emailService';
import { Loader2 } from 'lucide-react';
import { INITIAL_TENANTS } from './constants';

const DEFAULT_SETTINGS: AppSettings = {
    xero: { connected: true, clientId: 'xero-dev-app', clientSecret: '********', tenantId: 't-001', lastSync: new Date().toISOString() },
    myob: { connected: false, clientId: '', clientSecret: '' },
    quickbooks: { connected: false, clientId: '', clientSecret: '' },
    epicor: { connected: false, clientId: '', clientSecret: '', apiEndpoint: 'https://api.epicor.com' },
    sap: { connected: false, clientId: '', clientSecret: '', apiEndpoint: 'https://api.sap.com' },
    lookout: {
        connected: false,
        apiEndpoint: 'https://api.thelookoutway.com/v1',
        apiKey: ''
    },
    alayaCare: {
        connected: false,
        tenantUrl: '',
        clientId: '',
        clientSecret: ''
    },
    storageProvider: 'onedrive',
    storageConnected: false,
    emailConfig: {
        enabled: true,
        mode: 'forwarding',
        forwardingAddress: 't-001@inbound.invoiceflow.com',
        connectedAccount: {
            provider: 'microsoft',
            email: 'admin@carefirst.com',
            monitoredFolder: 'Inbox',
            lastSync: new Date().toISOString(),
            ingestionRules: {
                mustHaveAttachment: true,
                allowedDomains: [],
                subjectKeywords: ['invoice', 'bill', 'receipt']
            }
        }
    },
    notificationRules: [],
    emailServiceConfig: { provider: 'emailjs', serviceId: '', templateId: '', publicKey: '' },
    compliance: {
        orgPrivacyPolicyUrl: '',
        orgTermsOfServiceUrl: '',
        dataBreachContactEmail: '',
        dataSovereigntyRegion: 'AU-SYD',
        auditLogRetentionDays: 90
    },
    complianceTemplates: [],
    extractionPrompt: '',
    llmKeys: {
        gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
        openai: import.meta.env.VITE_OPENAI_API_KEY || '',
        anthropic: '',
        grok: import.meta.env.VITE_XAI_API_KEY || '',
        perplexity: import.meta.env.VITE_PERPLEXITY_API_KEY || '',
    },
    auditPrompt: {
      priceReasonableness: "Analyze price reasonableness for EACH line item. Compare unit prices against standard market rates for support services (e.g. Cleaning ~$50/hr, Personal Care ~$65/hr, Gardening ~$60/hr). Flag any significant deviations.",
      fraudIndicators: "Check for potential fraud indicators in line items:\n   - Round dollar amounts (e.g. $500.00 exactly) which can be suspicious.\n   - \"Weekend\" or \"After Hours\" surcharges where the service date corresponds to a weekday.\n   - Duplicate line items or vague descriptions like \"Consulting\" or \"Services\".",
      consistencyCheck: "Cross-reference line item totals against the invoice subtotal and total.",
      contractorCompliance: "Check the supplier against the provided 'OFFICIAL APPROVED CONTRACTOR LIST'. If the supplier is missing or marked as suspended/review_pending, flag as FAIL. \n\nVerify compliance with Australian Aged Care & NDIS legal requirements AND provided policy documents:\n- Mandatory Reporting: Flag any descriptions suggesting incidents of abuse, neglect, or unexplained absence.\n- Client Rights: Ensure services align with the Charter of Aged Care Rights (e.g. choice, dignity).\n- NDIS/Price Guide: If NDIS codes are used, verify they follow the standard format (e.g. 01_011_0107_1_1).\n- Regulatory: Confirm valid ABN and consistency between service type and supplier entity.\n- Policy Cross-Reference: Check supplier details against specific contractor rules in any attached policy files.",
      riskAssessment: "Provide a risk assessment score (0-100) and detailed justification.\n\nSCORING MATRIX:\n- Fraud Indicators (AI-FRAUD-CHECK): +100 points\n- Contractor Verification (AI-CONTRACTOR-CHECK): +100 points\n- Price Unreasonable (AI-PRICE-CHECK): +30 points\n- Policy Violation (AI-POLICY-COMPLIANCE): +50 points\n\nAGING CHECKS:\n1. Extract 'Invoice Date' and compare with 'Current Date'.\n- If > 60 days: Rule 'AI-AGING-CHECK' = FAIL. Add +80 points.\n- If > 50 days: Rule 'AI-AGING-CHECK' = WARN. Add +40 points.\n- Otherwise: Rule 'AI-AGING-CHECK' = PASS.\n\nRISK LEVEL DETERMINATION:\n- Score >= 70: HIGH\n- Score >= 30: MEDIUM\n- Score < 30: LOW\n\nIn the justification, you MUST explicitly list exactly which rules contributed points to the final score. For example: 'Score 80/100: +50 for Fraud Indicator detected (AI-FRAUD-CHECK), +30 for Price Reasonableness failure (AI-PRICE-CHECK)'."
    },
    policyDocuments: `POLICY: PROCUREMENT-2024-V2
1. Approved Hourly Rates Cap:
   - Domestic Assistance: $55.00/hr
   - Personal Care: $68.00/hr
   - Gardening/Maintenance: $70.00/hr
2. Travel:
   - Max 30 mins travel time chargeable per visit.
   - Max $0.92/km vehicle allowance.
3. Forbidden Items:
   - Gift cards
   - Alcohol or Tobacco
   - Services by family members`,
    policyFiles: []
};

// Internal component to use hooks
const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);

  // Contexts
  const { tenant, setTenant, tenants } = useTenant();
  const { addNotification } = useNotifications();

  // --- OAUTH CALLBACK HANDLER ---
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('id_token'))) {
        // We are inside an OAuth Popup redirect
        try {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const state = params.get('state'); // 'microsoft' or 'google' passed from initiator
            
            if (accessToken && window.opener) {
                // Post message to parent window
                window.opener.postMessage({ 
                    type: 'OAUTH_SUCCESS', 
                    token: accessToken,
                    provider: state || 'unknown'
                }, window.location.origin);
                
                // Close popup
                window.close();
            }
        } catch (e) {
            console.error("Error processing OAuth callback", e);
        }
    }
  }, []);

  // --- PERSISTENCE LAYER (INVOICES ONLY for now, Clients/Tenants are DB) ---
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('if_invoices');
      // STRICT MODE: Start with empty list if nothing saved. No Mocks.
      return saved ? JSON.parse(saved) : []; 
    } catch (e) {
      console.error("Failed to load invoices from storage", e);
      return [];
    }
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('if_settings');
      if (saved) {
          const parsed = JSON.parse(saved);
          return {
              ...DEFAULT_SETTINGS,
              ...parsed,
              emailConfig: { ...DEFAULT_SETTINGS.emailConfig, ...(parsed.emailConfig || {}) },
              // Ensure we prefer the Env Var key if the saved one is empty, or allow override
              llmKeys: { 
                  ...DEFAULT_SETTINGS.llmKeys, 
                  ...(parsed.llmKeys || {}),
                  gemini: parsed.llmKeys?.gemini || import.meta.env.VITE_GEMINI_API_KEY || '',
                  openai: parsed.llmKeys?.openai || import.meta.env.VITE_OPENAI_API_KEY || '',
                  grok: parsed.llmKeys?.grok || import.meta.env.VITE_XAI_API_KEY || '',
                  perplexity: parsed.llmKeys?.perplexity || import.meta.env.VITE_PERPLEXITY_API_KEY || '',
              },
              notificationRules: parsed.notificationRules || [],
              emailServiceConfig: parsed.emailServiceConfig || { provider: 'emailjs', serviceId: '', templateId: '', publicKey: '' }
          };
      }
      return DEFAULT_SETTINGS;
    } catch (e) {
      console.error("Failed to load settings from storage", e);
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('if_invoices', JSON.stringify(invoices));
    } catch (e) {
      console.warn("Storage quota exceeded, could not save invoices");
    }
  }, [invoices]);

  // Login Handler
  const handleLoginSuccess = (role: UserRole) => {
      setUserRole(role);
      setIsAuthenticated(true);
      setCurrentView(role === 'superuser' ? 'superuser' : 'dashboard');
  };

  const handleImpersonate = (tenantId: string) => {
    // Attempt to find in active tenant list
    let targetTenant = tenants.find(t => t.id === tenantId);
    
    // Fallback: If DB is empty, use INITIAL_TENANTS specifically for the test environment
    if (!targetTenant && tenantId === 't-dev-001') {
        targetTenant = INITIAL_TENANTS.find(t => t.id === 't-dev-001');
    }

    if (targetTenant) {
        setTenant(targetTenant);
        setCurrentView('dashboard');
        if (targetTenant.status === 'BETA') setShowDevTools(true);
    }
  };

  const handleNavigation = (view: string) => {
      if (view === 'superuser') {
          setTenant(null); 
          setShowDevTools(false);
      }
      setCurrentView(view);
  };

  const handleNavigateToInvoice = (id: string) => {
      const inv = invoices.find(i => i.id === id);
      if (inv) {
          setSelectedInvoice(inv);
          setCurrentView('detail');
      }
  };

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCurrentView('detail');
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
     setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
     if (selectedInvoice && selectedInvoice.id === updatedInvoice.id) {
       setSelectedInvoice(updatedInvoice);
     }
  };

  const handleUpdateGlobalSettings = (updates: Partial<AppSettings>) => {
      setAppSettings(prev => ({
          ...prev,
          ...updates
      }));
      // Persist immediately
      try {
          localStorage.setItem('if_settings', JSON.stringify({ ...appSettings, ...updates }));
      } catch (e) { console.error("Failed to persist settings", e); }
  };

  // --- BACKGROUND AUDIT PROCESSOR ---
  const runBackgroundAudit = async (invoice: Invoice) => {
    try {
      console.log(`Starting background processing for ${invoice.id}...`);
      
      const systemCheck = await validateInvoiceAgainstSystem(invoice);
      
      // CHECK FOR EXCEPTIONS (SYSTEM FAILURES)
      const exceptionErrors = systemCheck.results.filter(r => r.result === 'FAIL');
      if (exceptionErrors.length > 0) {
          // 1. IN-APP NOTIFICATION
          const auditRule = appSettings.notificationRules.find(r => r.trigger === 'AUDIT_FAILED');
          
          if (!auditRule || auditRule.inAppEnabled) {
              addNotification({
                  type: 'error',
                  title: `Exception: ${invoice.supplierName}`,
                  message: `Validation failed: ${exceptionErrors.map(e => e.ruleName).join(', ')}`,
                  targetId: invoice.id,
                  targetView: 'detail'
              });
          }

          // 2. EMAIL NOTIFICATION (REAL)
          if (auditRule?.emailEnabled && auditRule.recipients) {
              const recipients = auditRule.recipients.split(',').map(e => e.trim());
              for (const recipient of recipients) {
                  sendRealEmail(
                      appSettings.emailServiceConfig,
                      recipient,
                      `Action Required: Audit Failed for ${invoice.invoiceNumber}`,
                      `System validation failed for invoice ${invoice.invoiceNumber} from ${invoice.supplierName}. Reasons: ${exceptionErrors.map(e => e.ruleName).join(', ')}. Please review in dashboard.`
                  );
              }
          }
      }

      const fullPrompt = assembleAuditPrompt(appSettings.auditPrompt, appSettings.policyDocuments);
      const aiCheck = await performDeepAudit(
          invoice, 
          "", 
          fullPrompt,
          appSettings.policyFiles,
          appSettings.llmKeys.gemini
      );
      
      // EMAIL NOTIFICATION FOR HIGH RISK
      if (aiCheck.riskAssessment?.level === 'HIGH') {
          const highRiskRule = appSettings.notificationRules.find(r => r.trigger === 'HIGH_RISK_DETECTED');
          if (highRiskRule?.emailEnabled && highRiskRule.recipients) {
              const recipients = highRiskRule.recipients.split(',').map(e => e.trim());
              for (const recipient of recipients) {
                  sendRealEmail(
                      appSettings.emailServiceConfig,
                      recipient,
                      `URGENT: High Risk Invoice Detected - ${invoice.supplierName}`,
                      `AI Assessment Flag: ${aiCheck.riskAssessment.score}/100. Justification: ${aiCheck.riskAssessment.justification}. Login to review.`
                  );
              }
          }
      }

      setInvoices(currentInvoices => 
        currentInvoices.map(inv => {
          if (inv.id === invoice.id) {
             const allResults = [...systemCheck.results, ...aiCheck.validationResults];
             const hasFailures = allResults.some(r => r.result === 'FAIL');
             const newStatus = hasFailures ? InvoiceStatus.NEEDS_REVIEW : InvoiceStatus.APPROVED;

             return {
               ...inv,
               validationResults: allResults,
               riskAssessment: aiCheck.riskAssessment,
               status: newStatus,
               poNumberMatched: systemCheck.matchedPo
             };
          }
          return inv;
        })
      );

      // Refresh selected if open
      setSelectedInvoice(prev => {
        if (prev && prev.id === invoice.id) {
             const allResults = [...systemCheck.results, ...aiCheck.validationResults];
             const hasFailures = allResults.some(r => r.result === 'FAIL');
             return {
                 ...prev,
                 validationResults: allResults,
                 riskAssessment: aiCheck.riskAssessment,
                 status: hasFailures ? InvoiceStatus.NEEDS_REVIEW : InvoiceStatus.APPROVED,
                 poNumberMatched: systemCheck.matchedPo
             };
        }
        return prev;
      });

    } catch (error) {
      console.error("Background audit failed:", error);
    }
  };

  const handleScanComplete = (data: any) => {
    if (!tenant) return;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      tenantId: tenant.id, 
      intakeId: `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-SCAN`,
      supplierName: data.supplierName || 'Unknown Supplier',
      supplierABN: data.supplierABN || '',
      invoiceNumber: data.invoiceNumber || 'PENDING',
      invoiceDate: data.invoiceDate || new Date().toISOString().slice(0,10),
      totalAmount: data.totalAmount || 0,
      poNumberExtracted: data.poNumberExtracted || 'PO-998877',
      status: InvoiceStatus.EXTRACTED, 
      confidenceScore: 0.85, 
      fileUrl: '', 
      lineItems: data.lineItems || [],
      validationResults: [],
      rawContent: JSON.stringify(data)
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setShowScanner(false);
    setSelectedInvoice(newInvoice);
    setCurrentView('detail');
    
    runBackgroundAudit(newInvoice);
  };

  const visibleInvoices = (userRole === 'superuser' && (currentView === 'superuser' || currentView.startsWith('superuser_')))
      ? invoices 
      : invoices.filter(inv => inv.tenantId === tenant?.id);
  
  // Clients are now handled internally by ClientList via DB Service, no need to pass

  const renderContent = () => {
    if (userRole === 'superuser' && (currentView === 'superuser' || currentView === 'superuser_audit' || currentView === 'superuser_settings')) {
        const tab = currentView === 'superuser_audit' ? 'audit' : currentView === 'superuser_settings' ? 'global_config' : 'orgs';
        return <SuperuserDashboard 
            onImpersonate={handleImpersonate} 
            initialTab={tab} 
            apiKey={appSettings.llmKeys.gemini}
            emailServiceConfig={appSettings.emailServiceConfig} // Pass config for invite emails
            onUpdateSettings={handleUpdateGlobalSettings}
        />;
    }

    if (selectedInvoice && currentView === 'detail') {
      return (
        <InvoiceDetail 
          invoice={selectedInvoice} 
          onBack={() => {
            setSelectedInvoice(null);
            setCurrentView('invoices');
          }}
          onUpdateInvoice={handleUpdateInvoice}
          apiKeyOverride={appSettings.llmKeys.gemini}
          policyDocuments={appSettings.policyDocuments}
          auditPrompt={assembleAuditPrompt(appSettings.auditPrompt, appSettings.policyDocuments)}
          policyFiles={appSettings.policyFiles}
          notificationConfig={{ rules: appSettings.notificationRules, service: appSettings.emailServiceConfig }}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'invoices':
        return <InvoiceList invoices={visibleInvoices} onSelectInvoice={handleInvoiceSelect} />;
      case 'reviews':
        return <InvoiceList invoices={visibleInvoices} onSelectInvoice={handleInvoiceSelect} filterStatus={InvoiceStatus.NEEDS_REVIEW} />;
      case 'approved':
        return <InvoiceList invoices={visibleInvoices} onSelectInvoice={handleInvoiceSelect} filterStatus={InvoiceStatus.APPROVED} />;
      case 'reports':
        return <Reports invoices={visibleInvoices} appSettings={appSettings} onUpdateSettings={setAppSettings} />;
      case 'clients':
        return <ClientList clients={[]} onUpdateClient={() => {}} apiKey={appSettings.llmKeys.gemini} />;
      case 'settings':
        return <Settings settings={appSettings} onSave={setAppSettings} />;
      case 'ai-support':
        return <HelpCenter apiKeyOverride={appSettings.llmKeys.gemini} initialCategory="ai-agent" />;
      case 'help':
        return <HelpCenter apiKeyOverride={appSettings.llmKeys.gemini} />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    // Check if we are inside a popup (OAuth flow) - don't render login
    if (window.opener && window.location.hash.includes('access_token')) {
        return <div className="flex items-center justify-center h-screen bg-white">
            <div className="text-center">
                <Loader2 className="animate-spin h-8 w-8 mx-auto text-indigo-600 mb-2" />
                <p className="text-slate-600">Completing authentication...</p>
            </div>
        </div>;
    }
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex bg-slate-100 min-h-screen font-sans text-slate-900">
      {currentView !== 'detail' && (
        <Sidebar 
          currentView={currentView} 
          setCurrentView={handleNavigation} 
          onScanClick={() => setShowScanner(true)}
          onSimulateEmailClick={() => {}}
          onLogout={() => setIsAuthenticated(false)}
          onToggleDevTools={() => setShowDevTools(!showDevTools)}
          isSuperuser={userRole === 'superuser'}
          onNavigateToInvoice={handleNavigateToInvoice}
        />
      )}
      
      <main className={`flex-1 transition-all duration-300 ${currentView !== 'detail' ? 'ml-64' : ''}`}>
        {renderContent()}
      </main>

      {currentView !== 'detail' && currentView !== 'ai-support' && (
        <FloatingAgent apiKey={appSettings.llmKeys.gemini} />
      )}
      
      {showScanner && (
        <InvoiceScanner 
          onScanComplete={handleScanComplete}
          onCancel={() => setShowScanner(false)}
          apiKeyOverride={appSettings.llmKeys.gemini}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <TenantProvider>
      <NotificationProvider>
        <ChatProvider>
           <AppContent />
        </ChatProvider>
      </NotificationProvider>
    </TenantProvider>
  );
}
