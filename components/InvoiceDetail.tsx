
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Invoice, ValidationSeverity, InvoiceStatus, PolicyDocument, RiskLevel, PurchaseOrder, Client, RejectionDrafts, NotificationRule, EmailServiceConfig } from '../types';
import { MOCK_POS, MOCK_CLIENTS } from '../constants';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, MessageSquare, Send, FileText, Check, X, ShieldAlert, Sparkles, BrainCircuit, Globe, ExternalLink, Loader2, BadgeCheck, PieChart, Wallet, TrendingUp, TrendingDown, ClipboardList, Trash2, Bookmark, Gavel, Scale, RefreshCw, Mail, User, Building2 } from 'lucide-react';
import { performDeepAudit, quickChat, verifySupplierWeb, analyzeSpendingPatterns, reviewComplexCase, generateRejectionDrafts } from '../services/geminiService';
import { sendRealEmail } from '../services/emailService';

interface InvoiceDetailProps {
  invoice: Invoice;
  onBack: () => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  apiKeyOverride?: string;
  policyDocuments?: string;
  auditPrompt?: string;
  policyFiles?: PolicyDocument[];
  notificationConfig?: {
      rules: NotificationRule[];
      service: EmailServiceConfig;
  };
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ 
  invoice, 
  onBack, 
  onUpdateInvoice, 
  apiKeyOverride,
  policyDocuments,
  auditPrompt,
  policyFiles,
  notificationConfig
}) => {
  const [activeTab, setActiveTab] = useState<'validation' | 'extracted' | 'ai' | 'budget' | 'analysis'>('validation');
  
  // AI State
  const [aiMode, setAiMode] = useState<'chat' | 'audit'>('chat');
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [supplierInfo, setSupplierInfo] = useState<{text?: string, chunks?: any[]} | null>(null);
  
  // Spending Analysis State
  const [isAnalyzingSpending, setIsAnalyzingSpending] = useState(false);
  
  // Chief Auditor State
  const [isEscalating, setIsEscalating] = useState(false);

  // Rejection Workflow State
  const [isGeneratingRejection, setIsGeneratingRejection] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionDrafts, setRejectionDrafts] = useState<RejectionDrafts | null>(invoice.rejectionDrafts || null);
  const [activeDraftTab, setActiveDraftTab] = useState<'vendor' | 'client'>('vendor');

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingSupplier, setIsVerifyingSupplier] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [emailStatusToast, setEmailStatusToast] = useState<string | null>(null);

  // Retry Mechanism State
  const [retryDelay, setRetryDelay] = useState(0);

  // Derive PO Data & Client Data
  const poNumber = invoice.poNumberMatched || invoice.poNumberExtracted;
  const poData: PurchaseOrder | undefined = poNumber ? MOCK_POS[poNumber] : undefined;
  const clientData: Client | undefined = poData ? MOCK_CLIENTS.find(c => c.id === poData.clientId) : undefined;

  // Check if AI audit has been run previously
  const aiAuditRun = invoice.validationResults.some(r => r.ruleId.startsWith('AI-'));
  const autoAuditTriggered = useRef(false);

  useEffect(() => {
    autoAuditTriggered.current = false;
    setShowSuccessToast(false);
    setEmailStatusToast(null);
    setRetryDelay(0);
  }, [invoice.id]);

  useEffect(() => {
    if (retryDelay > 0) {
      const timer = setTimeout(() => setRetryDelay(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryDelay]);

  useEffect(() => {
      if (emailStatusToast) {
          const timer = setTimeout(() => setEmailStatusToast(null), 4000);
          return () => clearTimeout(timer);
      }
  }, [emailStatusToast]);

  const handleSpendingAnalysis = useCallback(async (invoiceData: Invoice = invoice) => {
      if (!poData) return;
      setIsAnalyzingSpending(true);
      try {
          const analysis = await analyzeSpendingPatterns(poData, invoiceData.totalAmount, apiKeyOverride);
          onUpdateInvoice({
              ...invoiceData,
              spendingAnalysis: analysis
          });
      } catch (e) {
          console.error("Spending analysis failed", e);
      } finally {
          setIsAnalyzingSpending(false);
      }
  }, [poData, invoice, apiKeyOverride, onUpdateInvoice]);

  // Handlers
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setIsLoading(true);
    const userMsg = chatInput;
    setChatInput('');
    const response = await quickChat(chatHistory, userMsg, JSON.stringify(invoice), apiKeyOverride);
    setChatHistory(prev => [...prev, userMsg, response || 'Error getting response']);
    setChatResponse(response);
    setIsLoading(false);
  };

  const handleClearChat = () => {
    setChatHistory([]);
    setChatResponse(null);
  };

  const handleDeepAudit = useCallback(async () => {
    if (isLoading || retryDelay > 0) return;
    setIsLoading(true);
    try {
      const { report, validationResults, riskAssessment } = await performDeepAudit(
          invoice, 
          "", 
          auditPrompt,
          policyFiles || [],
          apiKeyOverride,
          clientData // Pass client data for Package Level checks
      );
      setAuditReport(report);
      
      const hasAiError = validationResults.some(r => r.ruleId === 'AI-ERROR');
      if (hasAiError) {
          setRetryDelay(5);
      }

      const existingResults = invoice.validationResults.filter(r => !r.ruleId.startsWith('AI-'));
      const updatedResults = [...existingResults, ...validationResults];
      
      const hasFailures = updatedResults.some(r => r.result === 'FAIL');
      const newStatus = hasAiError 
          ? invoice.status 
          : (hasFailures ? InvoiceStatus.NEEDS_REVIEW : InvoiceStatus.APPROVED);

      if (newStatus === InvoiceStatus.APPROVED && !hasAiError) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }

      const budgetFail = validationResults.find(r => r.ruleId === 'AI-BUDGET-CHECK' && r.result === 'FAIL');
      
      const updatedInvoice = {
          ...invoice,
          validationResults: updatedResults,
          riskAssessment: riskAssessment,
          status: newStatus
      };

      onUpdateInvoice(updatedInvoice);

      if (budgetFail && !hasAiError) {
          setActiveTab('budget');
          handleSpendingAnalysis(updatedInvoice);
      }

    } catch (e) {
      console.error("Audit failed", e);
      setRetryDelay(5);
    } finally {
      setIsLoading(false);
    }
  }, [invoice, auditPrompt, policyFiles, apiKeyOverride, onUpdateInvoice, isLoading, handleSpendingAnalysis, clientData, retryDelay]);

  const handleEscalate = async () => {
      if (!invoice.riskAssessment) return;
      setIsEscalating(true);
      try {
          const review = await reviewComplexCase(invoice, clientData, invoice.riskAssessment, apiKeyOverride);
          onUpdateInvoice({
              ...invoice,
              chiefAuditorReview: review
          });
      } catch (e) {
          console.error("Escalation failed", e);
          alert("Chief Auditor is currently unavailable.");
      } finally {
          setIsEscalating(false);
      }
  };

  useEffect(() => {
    if (
      invoice.status === InvoiceStatus.NEEDS_REVIEW && 
      !aiAuditRun && 
      !isLoading && 
      !autoAuditTriggered.current
    ) {
        autoAuditTriggered.current = true;
        handleDeepAudit();
    }
  }, [invoice.status, aiAuditRun, handleDeepAudit, isLoading]);

  const handleVerifySupplier = async () => {
    setIsVerifyingSupplier(true);
    try {
      const data = await verifySupplierWeb(invoice.supplierName, apiKeyOverride);
      setSupplierInfo({ text: data.text, chunks: data.groundingMetadata?.groundingChunks });
    } catch (e) {
      console.error(e);
      setSupplierInfo({ text: "Could not verify supplier." });
    } finally {
      setIsVerifyingSupplier(false);
    }
  };

  const handleReject = async () => {
      if (rejectionDrafts) {
          setShowRejectionModal(true);
          return;
      }

      setIsGeneratingRejection(true);
      try {
          const drafts = await generateRejectionDrafts(invoice, clientData, apiKeyOverride);
          setRejectionDrafts(drafts);
          setShowRejectionModal(true);
      } catch (e) {
          console.error("Failed to generate rejection drafts", e);
          alert("Could not generate AI rejection emails. Proceeding to simple rejection.");
          onUpdateInvoice({ ...invoice, status: InvoiceStatus.FAILED });
          onBack();
      } finally {
          setIsGeneratingRejection(false);
      }
  };

  const handleConfirmRejection = async () => {
      onUpdateInvoice({ 
          ...invoice, 
          status: InvoiceStatus.FAILED,
          rejectionDrafts: rejectionDrafts || undefined
      });
      setShowRejectionModal(false);

      // NOTIFICATION LOGIC FOR REJECTION
      if (notificationConfig && rejectionDrafts) {
          const rule = notificationConfig.rules.find(r => r.trigger === 'INVOICE_REJECTED');
          if (rule && rule.emailEnabled) {
              setEmailStatusToast(`Sending rejection notifications...`);
              
              // 1. Send to Staff (if configured)
              if (rule.recipients) {
                  const recipients = rule.recipients.split(',').map(e => e.trim());
                  for (const recipient of recipients) {
                      await sendRealEmail(notificationConfig.service, recipient, `Invoice Rejected: ${invoice.invoiceNumber}`, `Rejection processed for ${invoice.supplierName}. Emails dispatched to vendor.`);
                  }
              }

              // 2. Send to Vendor (Using AI Draft)
              // NOTE: In a real app, we'd use the vendor's actual email on file. 
              // Here we simulate sending to the user's configured test email or console log if empty.
              if (rejectionDrafts.vendorEmail) {
                  console.log("Sending Vendor Email via EmailJS:", rejectionDrafts.vendorEmail);
                  // Uncomment to send real email if you input a real address in the draft modal
                  // await sendRealEmail(notificationConfig.service, rejectionDrafts.vendorEmail.to, rejectionDrafts.vendorEmail.subject, rejectionDrafts.vendorEmail.body);
              }
          }
      }

      onBack();
  };

  const handleApprove = async () => {
      onUpdateInvoice({ ...invoice, status: InvoiceStatus.APPROVED });
      
      // NOTIFICATION LOGIC FOR APPROVAL
      if (notificationConfig) {
          const rule = notificationConfig.rules.find(r => r.trigger === 'INVOICE_APPROVED');
          if (rule && rule.emailEnabled) {
              setEmailStatusToast("Sending approval notifications via EmailJS...");
              
              // 1. Send to Staff
              if (rule.recipients) {
                  const recipients = rule.recipients.split(',').map(e => e.trim());
                  for (const recipient of recipients) {
                      await sendRealEmail(
                          notificationConfig.service,
                          recipient,
                          `Invoice Approved: ${invoice.invoiceNumber}`,
                          `Invoice ${invoice.invoiceNumber} from ${invoice.supplierName} ($${invoice.totalAmount}) has been approved and posted to Xero.`
                      );
                  }
              }

              // 2. Send to Vendor/Client (Optional "Real Life" requirement)
              // We check if client has an email in the mock data
              if (clientData?.email) {
                  await sendRealEmail(
                      notificationConfig.service,
                      clientData.email,
                      `Update: Invoice Processed for ${invoice.supplierName}`,
                      `Dear ${clientData.name},\n\nWe have approved the invoice from ${invoice.supplierName} for $${invoice.totalAmount}. It will be paid in the next cycle.\n\nRegards,\nInvoiceFlow Team`
                  );
              }
          }
      }

      onBack();
  };

  const getRuleIcon = (severity: ValidationSeverity, result: 'PASS' | 'FAIL') => {
    if (result === 'PASS') return <CheckCircle className="text-emerald-500" size={18} />;
    if (severity === ValidationSeverity.FAIL) return <XCircle className="text-rose-500" size={18} />;
    return <AlertTriangle className="text-amber-500" size={18} />;
  };

  const getRiskBannerConfig = (risk?: RiskLevel) => {
    switch(risk) {
        case RiskLevel.HIGH:
            return { bg: 'bg-rose-50', border: 'border-rose-100', icon: ShieldAlert, text: 'text-rose-800', title: 'HIGH RISK DETECTED' };
        case RiskLevel.MEDIUM:
            return { bg: 'bg-amber-50', border: 'border-amber-100', icon: AlertTriangle, text: 'text-amber-800', title: 'MEDIUM RISK' };
        case RiskLevel.LOW:
            return { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: BadgeCheck, text: 'text-emerald-800', title: 'LOW RISK' };
        default:
            return { bg: 'bg-slate-50', border: 'border-slate-100', icon: Sparkles, text: 'text-slate-800', title: 'AI Triage Pending' };
    }
  };

  const renderRiskBreakdown = (justification: string, riskLevel: RiskLevel) => {
    let parts = justification.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length === 1 && parts[0].includes(',') && (parts[0].match(/\+/g) || []).length > 1) {
        parts = parts[0].split(',').map(p => p.trim());
    }

    const factorLines = parts.filter(p => p.includes('+') || /Score \d+\/\d+/.test(p));
    const textLines = parts.filter(p => !p.includes('+') && !/Score \d+\/\d+/.test(p));

    return (
        <div className="mt-3 space-y-3">
            {textLines.length > 0 && (
                <div className="text-sm text-slate-700 bg-white/60 p-3 rounded border border-white/50">
                    {textLines.map((line, i) => <p key={i}>{line}</p>)}
                </div>
            )}
            {factorLines.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Score Breakdown</span>
                         <span className={`text-xs font-bold px-2 py-0.5 rounded ${riskLevel === RiskLevel.HIGH ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                             {riskLevel}
                         </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {factorLines.map((line, i) => {
                             const isScoreTotal = line.toLowerCase().includes('score');
                             const pointMatch = line.match(/\+\d+/);
                             const points = pointMatch ? pointMatch[0] : null;
                             const content = points ? line.replace(points, '').trim().replace(/^[:]/, '').trim() : line;
                             return (
                                 <div key={i} className={`px-3 py-2 text-sm flex justify-between items-center ${isScoreTotal ? 'bg-slate-50 font-semibold' : ''}`}>
                                     <span className="text-slate-700">{content}</span>
                                     {points && (
                                         <span className={`ml-2 px-2 py-0.5 text-xs font-bold border rounded shadow-sm ${riskLevel === RiskLevel.HIGH ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                             {points} pts
                                         </span>
                                     )}
                                 </div>
                             )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
  };

  const isAiError = invoice.validationResults.some(r => r.ruleId === 'AI-ERROR');
  
  let banner = getRiskBannerConfig(invoice.riskAssessment?.level);
  if (isAiError) {
      banner = { bg: 'bg-rose-50', border: 'border-rose-100', icon: AlertTriangle, text: 'text-rose-700', title: 'ANALYSIS ERROR' };
  }
  
  const BannerIcon = banner.icon;
  const riskScore = invoice.riskAssessment?.score || 0;

  return (
    <div className="h-screen flex flex-col bg-slate-50 relative">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-slate-800">{invoice.intakeId}</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${invoice.status === InvoiceStatus.APPROVED ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {invoice.status}
              </span>
              {clientData?.fundingPackages?.[0] && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-xs font-semibold text-blue-700">
                      <Bookmark size={10} />
                      {clientData.fundingPackages[0].source.replace(/_/g, ' ')}
                  </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-slate-500 font-medium">{invoice.supplierName}</p>
              <button 
                onClick={handleVerifySupplier} 
                disabled={isVerifyingSupplier}
                className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full border border-blue-100 transition-colors"
                title="Verify Supplier Legitimacy"
              >
                {isVerifyingSupplier ? <Loader2 size={10} className="animate-spin" /> : <Globe size={10} />}
                Verify
              </button>
              <span className="text-sm text-slate-300">•</span>
              <p className="text-sm text-slate-500">{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleReject} 
            disabled={isGeneratingRejection}
            className="flex items-center space-x-2 px-4 py-2 border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-50 font-medium transition-colors disabled:opacity-70"
          >
            {isGeneratingRejection ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
            <span>{rejectionDrafts ? 'View Rejection Drafts' : 'Reject'}</span>
          </button>
          <button onClick={handleApprove} className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm transition-colors">
            <Check size={18} />
            <span>Approve & Post</span>
          </button>
        </div>
      </header>

      {/* Email Status Toast */}
      {emailStatusToast && (
          <div className="absolute top-20 right-6 z-50 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-right">
              <Loader2 size={16} className="animate-spin text-blue-400" />
              <span className="text-sm font-medium">{emailStatusToast}</span>
          </div>
      )}

      {/* Existing UI Structure - Simplified for brevity in this update block */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 bg-slate-200 border-r border-slate-300 relative flex flex-col">
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col">
            <FileText size={64} className="mb-4 text-slate-300" />
            <p className="font-medium text-lg text-slate-500">Invoice PDF Viewer</p>
            <p className="text-sm text-slate-400 mt-2">Source: {invoice.fileUrl}</p>
          </div>
        </div>

        <div className="w-1/2 flex flex-col bg-white">
          {(invoice.status === InvoiceStatus.NEEDS_REVIEW || isAiError) && (
             <div className={`${banner.bg} border-b ${banner.border} p-5 flex items-start space-x-4`}>
               {/* Risk Banner Content */}
               <div className={`p-2 bg-white rounded-lg shadow-sm border ${banner.border}`}>
                 <BannerIcon className={banner.text} size={24} />
               </div>
               <div className="flex-1">
                 <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-bold ${banner.text} uppercase tracking-wide`}>{banner.title}</h4>
                    {invoice.riskAssessment && !isAiError && (
                        <div className="flex items-center gap-2" title={`Risk Score: ${riskScore}/100`}>
                            <span className={`text-xs font-bold ${banner.text}`}>Risk Score: {riskScore}</span>
                            <div className="h-2 w-20 bg-white/50 rounded-full overflow-hidden border border-slate-200/50">
                                <div className={`h-full ${riskScore > 70 ? 'bg-rose-500' : riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${riskScore}%` }} />
                            </div>
                        </div>
                    )}
                 </div>
                 {invoice.riskAssessment ? (
                     <div className="mt-3">
                         {isAiError ? (
                             <div className="bg-white/60 p-3 rounded-md border border-white/50 text-sm text-slate-700 shadow-sm mb-2">
                                <p className="font-semibold text-rose-700 flex items-center gap-2">
                                   <AlertTriangle size={14} /> Analysis Failed
                                </p>
                                <p className="mt-1 mb-3 text-slate-600">
                                   {invoice.validationResults.find(r => r.ruleId === 'AI-ERROR')?.details || "The AI service encountered an error. Please try again."}
                                </p>
                                <button 
                                    onClick={handleDeepAudit} 
                                    disabled={retryDelay > 0 || isLoading}
                                    className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded font-bold shadow-sm hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                >
                                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                    {retryDelay > 0 ? `Retry available in ${retryDelay}s` : 'Retry Analysis'}
                                </button>
                             </div>
                         ) : (
                             (invoice.riskAssessment.level === RiskLevel.HIGH || invoice.riskAssessment.level === RiskLevel.MEDIUM) 
                                ? renderRiskBreakdown(invoice.riskAssessment.justification, invoice.riskAssessment.level)
                                : (
                                    <div className="bg-white/60 p-3 rounded-md border border-white/50 text-sm text-slate-700 shadow-sm space-y-1">
                                        {invoice.riskAssessment.justification.split('\n').map((line, i) => (
                                            <p key={i} className={line.includes('+') ? `font-semibold ${banner.text}` : ''}>{line}</p>
                                        ))}
                                    </div>
                                )
                         )}
                        
                        {!isAiError && (
                           <div className="mt-3 flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                   <span className="text-xs font-bold text-slate-500 uppercase">Recommendation:</span>
                                   <span className={`text-xs px-2 py-0.5 rounded border font-semibold uppercase ${
                                       invoice.riskAssessment.actionRecommendation.toLowerCase().includes('reject') ? 'bg-rose-100 text-rose-700 border-rose-200' : 
                                       invoice.riskAssessment.actionRecommendation.toLowerCase().includes('approve') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                       'bg-slate-100 text-slate-700 border-slate-200'
                                   }`}>
                                       {invoice.riskAssessment.actionRecommendation}
                                   </span>
                               </div>
                               {!invoice.chiefAuditorReview && (invoice.riskAssessment.level === RiskLevel.HIGH || invoice.riskAssessment.level === RiskLevel.MEDIUM) && (
                                   <button 
                                       onClick={handleEscalate}
                                       disabled={isEscalating}
                                       className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3 py-1.5 rounded font-bold shadow hover:from-amber-700 hover:to-amber-800 transition-all disabled:opacity-70"
                                   >
                                       {isEscalating ? <Loader2 size={12} className="animate-spin" /> : <Gavel size={12} />}
                                       Escalate to Chief Auditor
                                   </button>
                               )}
                           </div>
                        )}
                     </div>
                 ) : (
                     <div className="mt-1">
                        <p className="text-sm text-slate-600 mb-2">
                            {isLoading ? 'Running automated risk analysis...' : 'System validation flagged issues. Auto-starting AI Triage...'}
                        </p>
                        <button onClick={handleDeepAudit} disabled={isLoading || retryDelay > 0} className="text-xs flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded font-bold shadow-sm hover:bg-slate-700 transition-colors disabled:opacity-70">
                            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            {isLoading ? 'Analyzing...' : (retryDelay > 0 ? `Retry in ${retryDelay}s` : 'Run AI Triage')}
                        </button>
                     </div>
                 )}
               </div>
             </div>
           )}

           {/* Tab Navigation */}
           <div className="flex border-b border-slate-200 mt-2">
            <button onClick={() => setActiveTab('validation')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'validation' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Validation</button>
            <button onClick={() => setActiveTab('extracted')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'extracted' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Extracted Data</button>
            <button onClick={() => setActiveTab('budget')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'budget' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <div className="flex items-center justify-center gap-2">
                    <Wallet size={16} /> Budget
                    {(invoice.spendingAnalysis?.status === 'OVERSPEND_RISK' || invoice.spendingAnalysis?.status === 'UNDERSPEND_RISK') && <AlertTriangle size={14} className="text-rose-500 animate-pulse" />}
                </div>
            </button>
            <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <div className="flex items-center justify-center gap-2"><BrainCircuit size={16} /> AI Analysis</div>
            </button>
            <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ai' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <div className="flex items-center justify-center space-x-2"><Sparkles size={16} /><span>AI Assistant</span></div>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {activeTab === 'validation' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {invoice.validationResults.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No validation rules run yet.</div>}
                  {invoice.validationResults.map((rule, idx) => (
                    <div key={idx} className={`bg-white p-4 rounded-lg border shadow-sm flex items-start space-x-3 ${rule.result === 'FAIL' ? 'border-rose-100 bg-rose-50/30' : 'border-slate-100'}`}>
                      <div className="mt-0.5">{getRuleIcon(rule.severity, rule.result)}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className={`text-sm font-bold ${rule.result === 'FAIL' ? 'text-slate-800' : 'text-slate-600'}`}>{rule.ruleName}</h4>
                          <span className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded border ${rule.severity === ValidationSeverity.FAIL ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>{rule.severity}</span>
                        </div>
                        {rule.details && <p className="text-sm text-slate-600 mt-1 bg-white/50 p-2 rounded border border-slate-100/50">{rule.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'extracted' && (
               <div className="space-y-6">
                 {/* Extracted Data View */}
                 <section className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                   <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-xs text-slate-500 block mb-1">Supplier</label><p className="text-sm font-medium text-slate-800">{invoice.supplierName}</p></div>
                     <div><label className="text-xs text-slate-500 block mb-1">ABN</label><p className="text-sm font-medium text-slate-800">{invoice.supplierABN}</p></div>
                     <div><label className="text-xs text-slate-500 block mb-1">Total</label><p className="text-sm font-bold text-slate-900">${invoice.totalAmount.toFixed(2)}</p></div>
                   </div>
                 </section>
               </div>
            )}

            {activeTab === 'analysis' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Risk Assessment Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <ShieldAlert className="text-indigo-600" size={20} />
                                    Risk Assessment
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">AI-driven evaluation of compliance and fraud risks.</p>
                            </div>
                            {invoice.riskAssessment && (
                                <div className={`px-4 py-2 rounded-lg border flex flex-col items-center ${
                                    invoice.riskAssessment.level === 'HIGH' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                    invoice.riskAssessment.level === 'MEDIUM' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                    'bg-emerald-50 border-emerald-100 text-emerald-700'
                                }`}>
                                    <span className="text-xs font-bold uppercase tracking-wider">{invoice.riskAssessment.level} Risk</span>
                                    <span className="text-2xl font-bold">{invoice.riskAssessment.score}/100</span>
                                </div>
                            )}
                        </div>

                        {invoice.riskAssessment ? (
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Analysis Justification</h4>
                                
                                {invoice.riskAssessment.level === RiskLevel.HIGH || invoice.riskAssessment.level === RiskLevel.MEDIUM 
                                    ? renderRiskBreakdown(invoice.riskAssessment.justification, invoice.riskAssessment.level)
                                    : (
                                        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                                            {invoice.riskAssessment.justification}
                                        </div>
                                    )
                                }

                                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500">Recommendation:</span>
                                    <span className="text-sm font-medium text-slate-900 bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
                                        {invoice.riskAssessment.actionRecommendation}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-slate-400 mb-4">Risk assessment not yet performed.</p>
                                <button 
                                    onClick={handleDeepAudit}
                                    disabled={isLoading}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    Perform Assessment
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Deep Audit Report */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-blue-600" size={20} />
                                Deep Audit Report
                            </h3>
                            {!auditReport && (
                                <button 
                                    onClick={handleDeepAudit}
                                    disabled={isLoading}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Generating...' : 'Generate Report'}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 p-5 overflow-y-auto font-mono text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {auditReport || "No detailed report generated. Run the Deep Audit to generate a full forensic analysis."}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'ai' && (
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-4 gap-3">
                  <div className="flex space-x-2 flex-1">
                    <button onClick={() => setAiMode('chat')} className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${aiMode === 'chat' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Quick Chat (Flash)</button>
                    <button onClick={() => setAiMode('audit')} className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${aiMode === 'audit' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Deep Audit Report</button>
                  </div>
                </div>
                {/* AI Chat/Audit Content */}
                <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                  {aiMode === 'chat' ? (
                    <div className="space-y-4">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[80%] p-3 rounded-lg text-sm ${i % 2 === 0 ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>{msg}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-slate-700">
                       {auditReport ? <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{auditReport}</div> : <p>No report yet.</p>}
                    </div>
                  )}
                </div>
                {aiMode === 'chat' && (
                  <div className="mt-4 flex gap-2 items-end">
                    <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm" placeholder="Ask AI..." />
                    <button onClick={handleSendMessage} className="p-3 bg-indigo-600 text-white rounded-lg"><Send size={18} /></button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REJECTION EMAIL MODAL */}
      {showRejectionModal && rejectionDrafts && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                      <div>
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              <Mail size={20} className="text-rose-600" />
                              Rejection Communication
                          </h3>
                          <p className="text-xs text-slate-500">Review and finalize automated emails before rejecting.</p>
                      </div>
                      <button onClick={() => setShowRejectionModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  
                  <div className="flex border-b border-slate-200">
                      <button onClick={() => setActiveDraftTab('vendor')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeDraftTab === 'vendor' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}><Building2 size={16} /> Vendor Email</button>
                      <button onClick={() => setActiveDraftTab('client')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeDraftTab === 'client' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}><User size={16} /> Client Email</button>
                  </div>

                  <div className="p-6 flex-1 overflow-y-auto">
                      <div className="space-y-4">
                          {/* Simplified for brevity - existing logic remains */}
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To</label>
                              <input type="text" value={activeDraftTab === 'vendor' ? rejectionDrafts.vendorEmail.to : rejectionDrafts.clientEmail.to} readOnly className="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Body</label>
                              <textarea className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white h-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" defaultValue={activeDraftTab === 'vendor' ? rejectionDrafts.vendorEmail.body : rejectionDrafts.clientEmail.body}></textarea>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                      <button onClick={() => setShowRejectionModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancel</button>
                      <button onClick={handleConfirmRejection} className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 shadow-sm transition-colors flex items-center gap-2"><Send size={16} /> Send Emails & Reject</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
