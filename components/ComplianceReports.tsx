
import React, { useState, useRef } from 'react';
import { AppSettings, ComplianceTemplate, ComplianceField, Invoice, Client, ComplianceAuditResult } from '../types';
import { FileText, Plus, Upload, Loader2, Save, ArrowRight, Download, Send, AlertCircle, CheckCircle, Database, ShieldCheck, XCircle, Wand2, RefreshCw, Bot, Globe, Library, Copy } from 'lucide-react';
import { parseComplianceTemplate, auditComplianceForm } from '../services/geminiService';
import { MOCK_CLIENTS } from '../constants';

interface ComplianceReportsProps {
  settings: AppSettings;
  invoices: Invoice[];
  onUpdateSettings: (settings: AppSettings) => void;
}

// --- OFFICIAL GOVERNMENT TEMPLATES (PRE-DIGITISED) ---
const OFFICIAL_GOV_TEMPLATES: ComplianceTemplate[] = [
    {
        id: 'tpl-gov-sah-2024',
        name: 'Support at Home - Monthly Payment Claim (v2024.1)',
        description: 'Official Services Australia schema for Support at Home consolidated payments.',
        authority: 'SERVICES_AUSTRALIA',
        createdAt: new Date().toISOString(),
        fields: [
            { id: 'providerId', label: 'Provider NAPS ID', type: 'text', required: true, mappedKey: 'invoice.supplierABN' },
            { id: 'participantId', label: 'Participant ID (Gov)', type: 'text', required: true, mappedKey: 'client.integrationId' },
            { id: 'claimPeriodStart', label: 'Claim Period Start', type: 'date', required: true, mappedKey: 'invoice.date' }, // Simplified mapping
            { id: 'serviceCode', label: 'Support Classification Code', type: 'text', required: true },
            { id: 'claimAmount', label: 'Total Claim Amount (GST Exclusive)', type: 'currency', required: true, mappedKey: 'invoice.totalAmount' },
            { id: 'invoiceReference', label: 'Invoice Reference', type: 'text', required: true, mappedKey: 'invoice.invoiceNumber' },
            { id: 'declaration', label: 'I certify services were delivered per Quality Standards', type: 'checkbox', required: true, value: false }
        ]
    },
    {
        id: 'tpl-gov-ndis-bulk',
        name: 'NDIS Payment Request (Bulk Upload)',
        description: 'Standard NDIS bulk payment file structure (CSV compatible).',
        authority: 'NDIS',
        createdAt: new Date().toISOString(),
        fields: [
            { id: 'RegistrationNumber', label: 'Registration Number', type: 'text', required: true, mappedKey: 'invoice.supplierABN' },
            { id: 'NDISNumber', label: 'Participant NDIS Number', type: 'text', required: true, mappedKey: 'client.ndisNumber' },
            { id: 'SupportDeliveredFrom', label: 'Support Delivered From', type: 'date', required: true, mappedKey: 'invoice.date' },
            { id: 'SupportDeliveredTo', label: 'Support Delivered To', type: 'date', required: true, mappedKey: 'invoice.date' },
            { id: 'SupportNumber', label: 'Support Item Number', type: 'text', required: true },
            { id: 'ClaimReference', label: 'Claim Reference', type: 'text', required: true, mappedKey: 'invoice.invoiceNumber' },
            { id: 'Quantity', label: 'Quantity', type: 'number', required: true },
            { id: 'UnitPrice', label: 'Unit Price', type: 'currency', required: true },
            { id: 'GSTCode', label: 'GST Code', type: 'text', required: true, value: 'P1' }
        ]
    },
    {
        id: 'tpl-gov-chsp-perf',
        name: 'CHSP Performance Report (Dex)',
        description: 'Data Exchange (DEX) reporting for Commonwealth Home Support Program.',
        authority: 'OTHER', // DSS
        createdAt: new Date().toISOString(),
        fields: [
            { id: 'outletId', label: 'Outlet ID', type: 'text', required: true },
            { id: 'clientId', label: 'Client ID', type: 'text', required: true, mappedKey: 'client.integrationId' },
            { id: 'sessionDate', label: 'Session Date', type: 'date', required: true, mappedKey: 'invoice.date' },
            { id: 'serviceTypeId', label: 'Service Type ID', type: 'text', required: true },
            { id: 'totalCost', label: 'Total Cost', type: 'currency', required: true, mappedKey: 'invoice.totalAmount' },
            { id: 'clientContribution', label: 'Client Contribution', type: 'currency', required: false }
        ]
    }
];

// Helper to safely get nested values
const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const ComplianceReports: React.FC<ComplianceReportsProps> = ({ settings, invoices, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<'submission' | 'templates' | 'library'>('submission');
  
  // Template Manager State
  const [isUploading, setIsUploading] = useState(false);
  const [analyzedTemplate, setAnalyzedTemplate] = useState<ComplianceTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Library State
  const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);

  // Live Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // Superagent Auditor State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<ComplianceAuditResult | null>(null);
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // --- Handlers ---

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsUploading(true);
          const file = e.target.files[0];
          
          try {
              const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                  reader.readAsDataURL(file);
              });

              // Gemini Vision to analyze the form
              const result = await parseComplianceTemplate(base64, file.type, settings.llmKeys.gemini);
              
              setAnalyzedTemplate({
                  id: `tpl-${Date.now()}`,
                  name: result.templateName || file.name,
                  description: `Auto-generated from ${file.name}`,
                  authority: result.authority as any || 'OTHER',
                  fields: result.fields,
                  createdAt: new Date().toISOString().split('T')[0]
              });

          } catch (err) {
              alert("Failed to analyze template. Ensure you have a valid Gemini Key.");
              console.error(err);
          } finally {
              setIsUploading(false);
          }
      }
  };

  const handleSaveTemplate = () => {
      if (!analyzedTemplate) return;
      const newTemplates = [...(settings.complianceTemplates || []), analyzedTemplate];
      onUpdateSettings({ ...settings, complianceTemplates: newTemplates });
      setAnalyzedTemplate(null);
      alert("Template saved successfully!");
  };

  const handleImportOfficial = (template: ComplianceTemplate) => {
      // Check if already exists
      if (settings.complianceTemplates?.some(t => t.name === template.name)) {
          alert("This template is already in your library.");
          return;
      }
      const newTemplates = [...(settings.complianceTemplates || []), { ...template, id: `tpl-imp-${Date.now()}` }];
      onUpdateSettings({ ...settings, complianceTemplates: newTemplates });
      setActiveTab('templates');
  };

  const handleRefreshLibrary = () => {
      setIsFetchingLibrary(true);
      setTimeout(() => {
          setIsFetchingLibrary(false);
      }, 1500);
  };

  const handleInvoiceSelect = (invId: string) => {
      setSelectedInvoiceId(invId);
      setAuditResult(null); // Reset audit on change
      
      // Auto-fill Logic
      const template = settings.complianceTemplates?.find(t => t.id === selectedTemplateId);
      const invoice = invoices.find(i => i.id === invId);
      
      if (!template || !invoice) return;

      // Find client (simulated link via PO)
      const poNumber = invoice.poNumberMatched || invoice.poNumberExtracted;
      const client = MOCK_CLIENTS.find(c => c.activePO === poNumber) || MOCK_CLIENTS[0]; // Fallback for demo

      const newFormData: Record<string, any> = {};
      
      template.fields.forEach(field => {
          if (field.mappedKey) {
              let val = null;
              if (field.mappedKey.startsWith('invoice.')) {
                  val = getNestedValue(invoice, field.mappedKey.replace('invoice.', ''));
                  // Specific case overrides
                  if (field.mappedKey === 'invoice.totalAmount') val = invoice.totalAmount;
                  if (field.mappedKey === 'invoice.date') val = invoice.invoiceDate;
                  if (field.mappedKey === 'invoice.number') val = invoice.invoiceNumber;
                  if (field.mappedKey === 'invoice.supplierABN') val = invoice.supplierABN;
              } else if (field.mappedKey.startsWith('client.')) {
                  val = getNestedValue(client, field.mappedKey.replace('client.', ''));
                  // Specific case overrides for mock data gaps
                  if (field.mappedKey === 'client.ndisNumber' || field.mappedKey === 'client.integrationId') val = client.integrationId; // Using IntegrationID as proxy
              }
              
              if (val !== undefined && val !== null) {
                  newFormData[field.id] = val;
              }
          }
      });
      setFormData(newFormData);
  };

  // --- AI Superagent Compliance Check ---
  const handleVerifyCompliance = async () => {
      const template = settings.complianceTemplates?.find(t => t.id === selectedTemplateId);
      const invoice = invoices.find(i => i.id === selectedInvoiceId);
      
      if (!template || !invoice) return;

      setIsAuditing(true);
      try {
          const result = await auditComplianceForm(formData, template, invoice, settings.llmKeys.gemini);
          setAuditResult(result);
      } catch (err) {
          console.error("Audit failed", err);
          alert("Compliance Audit Failed. Please check API Key.");
      } finally {
          setIsAuditing(false);
      }
  };

  const handleAutoFix = (fieldId: string, value: any) => {
      setFormData(prev => ({ ...prev, [fieldId]: value }));
      // Optimistically remove the issue from the UI to show progress
      setAuditResult(prev => {
          if(!prev) return null;
          return {
              ...prev,
              issues: prev.issues.filter(i => i.fieldId !== fieldId),
              // If no issues left, mark as passed (simplification)
              passed: prev.issues.length <= 1 // Logic: we just removed one
          };
      });
  };

  const handleSubmit = () => {
      if (!auditResult?.passed) return; // Strict gating

      setIsSubmitting(true);
      // Simulate API call to PRODA / Services Australia
      setTimeout(() => {
          setIsSubmitting(false);
          setSubmissionSuccess(true);
          setTimeout(() => {
              setSubmissionSuccess(false);
              setFormData({});
              setSelectedInvoiceId('');
              setAuditResult(null);
          }, 3000);
      }, 2000);
  };

  // --- Renderers ---

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
        
        {/* Navigation Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Database className="text-indigo-600" size={24} /> 
                    B2G Compliance Portal
                </h2>
                <p className="text-sm text-slate-500">PRODA / Services Australia / NDIS Reporting</p>
            </div>
            <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                    onClick={() => setActiveTab('submission')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'submission' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    <Send size={14} /> New Submission
                </button>
                <button 
                    onClick={() => setActiveTab('templates')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'templates' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    <FileText size={14} /> My Templates
                </button>
                <button 
                    onClick={() => setActiveTab('library')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'library' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    <Library size={14} /> Official Library
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
            
            {activeTab === 'library' && (
                <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-end bg-gradient-to-r from-purple-900 to-indigo-800 p-8 rounded-2xl text-white shadow-lg mb-8">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Globe className="text-purple-300" /> Government Template Registry
                            </h2>
                            <p className="text-purple-200 mt-2 max-w-2xl">
                                Access the latest digitized reporting schemas for Support at Home, NDIS, and CHSP. 
                                These templates are pre-mapped to InvoiceFlow data fields for instant compliance.
                            </p>
                        </div>
                        <button 
                            onClick={handleRefreshLibrary}
                            disabled={isFetchingLibrary}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                        >
                            {isFetchingLibrary ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            {isFetchingLibrary ? 'Checking Registry...' : 'Check for Updates'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {OFFICIAL_GOV_TEMPLATES.map((template) => (
                            <div key={template.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${
                                            template.authority === 'NDIS' ? 'bg-purple-100 text-purple-700' : 
                                            template.authority === 'SERVICES_AUSTRALIA' ? 'bg-emerald-100 text-emerald-700' : 
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {template.authority === 'NDIS' ? 'N' : template.authority === 'SERVICES_AUSTRALIA' ? 'SA' : 'G'}
                                        </div>
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase tracking-wider">
                                            v2024.1
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-2">{template.name}</h3>
                                    <p className="text-xs text-slate-500 mb-4">{template.description}</p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {template.fields.slice(0, 3).map(f => (
                                            <span key={f.id} className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-600">
                                                {f.label}
                                            </span>
                                        ))}
                                        {template.fields.length > 3 && (
                                            <span className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-600">
                                                +{template.fields.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                                    <button 
                                        onClick={() => handleImportOfficial(template)}
                                        className="w-full bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Copy size={16} /> Import Template
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'templates' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    
                    {/* Upload Section */}
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="text-indigo-600" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Digitize Custom Form</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">Upload a blank PDF or Image of a government form. Our AI will analyze the structure and create a mapped digital template.</p>
                        
                        <div className="flex justify-center gap-4">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-70"
                            >
                                {isUploading ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                                {isUploading ? 'Analyzing Template...' : 'Upload & Analyze'}
                            </button>
                            <button 
                                onClick={() => setActiveTab('library')}
                                className="bg-white text-indigo-600 border border-indigo-200 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-all flex items-center gap-2"
                            >
                                <Library size={18} /> Browse Official Library
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleTemplateUpload} />
                    </div>

                    {/* Analyzed Result Preview */}
                    {analyzedTemplate && (
                        <div className="bg-white rounded-xl border border-indigo-200 shadow-lg overflow-hidden animate-in slide-in-from-bottom-4">
                            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                                <h3 className="font-bold text-indigo-900">AI Analysis Result</h3>
                                <span className="bg-indigo-200 text-indigo-800 text-xs px-2 py-1 rounded font-bold uppercase">{analyzedTemplate.authority}</span>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Form Name</label>
                                        <input 
                                            type="text" 
                                            value={analyzedTemplate.name} 
                                            onChange={(e) => setAnalyzedTemplate({...analyzedTemplate, name: e.target.value})}
                                            className="w-full border border-slate-300 rounded p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                        <input 
                                            type="text" 
                                            value={analyzedTemplate.description} 
                                            onChange={(e) => setAnalyzedTemplate({...analyzedTemplate, description: e.target.value})}
                                            className="w-full border border-slate-300 rounded p-2 text-sm"
                                        />
                                    </div>
                                </div>
                                
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Detected Fields & Mappings</h4>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="p-3 font-semibold text-slate-700">Label</th>
                                                <th className="p-3 font-semibold text-slate-700">Type</th>
                                                <th className="p-3 font-semibold text-slate-700">Auto-Map Key</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {analyzedTemplate.fields.map((field, idx) => (
                                                <tr key={idx} className="bg-white">
                                                    <td className="p-3 text-slate-800">{field.label}</td>
                                                    <td className="p-3 text-slate-500 font-mono text-xs">{field.type}</td>
                                                    <td className="p-3">
                                                        {field.mappedKey ? (
                                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-mono">{field.mappedKey}</span>
                                                        ) : (
                                                            <span className="text-slate-400 italic text-xs">Manual Entry</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button onClick={() => setAnalyzedTemplate(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Discard</button>
                                    <button onClick={handleSaveTemplate} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-2">
                                        <Save size={18} /> Save Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Existing Templates List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">My Active Templates</h3>
                            <span className="text-xs text-slate-500">{settings.complianceTemplates?.length || 0} Templates</span>
                        </div>
                        
                        {(!settings.complianceTemplates || settings.complianceTemplates.length === 0) && (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                                <p>No templates yet. Import from Library or Upload one.</p>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {settings.complianceTemplates?.map(tpl => (
                                <div key={tpl.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{tpl.name}</h4>
                                            <p className="text-xs text-slate-500">{tpl.description} • {tpl.fields.length} Fields</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase">{tpl.authority}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'submission' && (
                <div className="max-w-7xl mx-auto h-full flex gap-6 animate-in fade-in slide-in-from-bottom-2">
                    
                    {/* Left: Configuration & Audit Panel */}
                    <div className="w-96 bg-white border border-slate-200 rounded-xl flex flex-col h-[700px] shadow-sm">
                        <div className="p-6 border-b border-slate-100 flex-1 overflow-y-auto">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} /> Setup</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Template</label>
                                    <select 
                                        className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                                    >
                                        <option value="">-- Choose Form --</option>
                                        {settings.complianceTemplates?.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    {(!settings.complianceTemplates || settings.complianceTemplates.length === 0) && (
                                        <p className="text-[10px] text-amber-600 mt-1">No templates found. Go to 'Official Library' to add one.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Source Invoice</label>
                                    <select 
                                        className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
                                        value={selectedInvoiceId}
                                        onChange={(e) => handleInvoiceSelect(e.target.value)}
                                        disabled={!selectedTemplateId}
                                    >
                                        <option value="">-- Choose Invoice --</option>
                                        {invoices.map(inv => (
                                            <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.supplierName} (${inv.totalAmount})</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedInvoiceId && !auditResult && (
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center mt-4">
                                        <p className="text-xs text-slate-600 mb-3">Form populated. Run AI Auditor to check compliance before submission.</p>
                                        <button 
                                            onClick={handleVerifyCompliance}
                                            disabled={isAuditing}
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                                        >
                                            {isAuditing ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                                            {isAuditing ? 'Auditing...' : 'Run Compliance Check'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audit Results Panel */}
                        {auditResult && (
                            <div className="border-t border-slate-200 bg-slate-50 flex-1 flex flex-col h-1/2">
                                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        <Bot size={16} className="text-purple-600" /> Superagent Findings
                                    </h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${auditResult.passed ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                                        {auditResult.passed ? 'PASS' : 'FAIL'}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    <p className="text-xs text-slate-500 italic mb-2">{auditResult.summary}</p>
                                    {auditResult.issues.length === 0 && (
                                        <div className="text-center py-6 text-emerald-600">
                                            <CheckCircle size={32} className="mx-auto mb-2" />
                                            <p className="text-xs font-bold">No issues found.</p>
                                        </div>
                                    )}
                                    {auditResult.issues.map((issue, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg border text-xs ${issue.severity === 'CRITICAL' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                            <div className="flex items-start gap-2">
                                                {issue.severity === 'CRITICAL' ? <XCircle size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
                                                <div>
                                                    <p className="font-bold">{issue.severity === 'CRITICAL' ? 'Critical Error' : 'Warning'}</p>
                                                    <p className="mt-1">{issue.message}</p>
                                                    {issue.suggestedFix !== undefined && (
                                                        <button 
                                                            onClick={() => handleAutoFix(issue.fieldId, issue.suggestedFix)}
                                                            className="mt-2 flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm hover:bg-slate-50 transition-colors font-bold"
                                                        >
                                                            <Wand2 size={10} className="text-purple-600" />
                                                            Apply Fix: {String(issue.suggestedFix)}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {!auditResult.passed && (
                                    <div className="p-3 bg-rose-100 text-rose-800 text-[10px] font-bold text-center border-t border-rose-200">
                                        Submission Blocked: Resolve Critical Issues
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: The Live Form */}
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col h-[700px]">
                        {selectedInvoiceId && selectedTemplateId ? (
                            <>
                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">
                                        {settings.complianceTemplates?.find(t => t.id === selectedTemplateId)?.name}
                                    </h3>
                                    <div className="flex gap-2">
                                        <button className="text-xs flex items-center gap-1 bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 transition-colors">
                                            <Download size={14} /> Download PDF
                                        </button>
                                        <button 
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || submissionSuccess || !auditResult?.passed}
                                            className="text-xs flex items-center gap-1 bg-indigo-600 text-white border border-transparent px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={!auditResult?.passed ? "Compliance Audit must pass before submission" : "Submit"}
                                        >
                                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : (submissionSuccess ? <CheckCircle size={14} /> : <Send size={14} />)}
                                            {submissionSuccess ? 'Submitted!' : 'Submit to PRODA'}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 overflow-y-auto bg-slate-50/50 flex-1">
                                    {/* Form Rendering */}
                                    <div className="bg-white p-8 shadow-sm border border-slate-200 max-w-2xl mx-auto min-h-[500px]">
                                        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
                                            <div>
                                                <h1 className="text-2xl font-serif font-bold text-black uppercase tracking-wider">
                                                    {settings.complianceTemplates?.find(t => t.id === selectedTemplateId)?.authority}
                                                </h1>
                                                <p className="text-sm font-serif italic">Official Claim Form</p>
                                            </div>
                                            {/* Form Status Badge */}
                                            {auditResult && (
                                                <div className={`px-3 py-1 border-2 font-bold uppercase tracking-widest text-xs rotate-[-10deg] opacity-80 ${auditResult.passed ? 'border-emerald-600 text-emerald-700' : 'border-rose-600 text-rose-700'}`}>
                                                    {auditResult.passed ? 'AUDIT PASSED' : 'AUDIT FAILED'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                            {settings.complianceTemplates?.find(t => t.id === selectedTemplateId)?.fields.map((field) => {
                                                // Check if field has an issue
                                                const issue = auditResult?.issues.find(i => i.fieldId === field.id);
                                                
                                                return (
                                                    <div key={field.id} className="col-span-2 md:col-span-1 relative group">
                                                        <label className={`block text-xs font-bold uppercase mb-1 ${issue ? 'text-rose-600' : 'text-slate-900'}`}>
                                                            {field.label} {field.required && '*'}
                                                        </label>
                                                        <div className="relative">
                                                            <input 
                                                                type={field.type === 'currency' ? 'number' : field.type === 'checkbox' ? 'checkbox' : field.type}
                                                                checked={field.type === 'checkbox' ? (formData[field.id] || false) : undefined}
                                                                value={field.type !== 'checkbox' ? (formData[field.id] || '') : undefined}
                                                                onChange={(e) => {
                                                                    const val = field.type === 'checkbox' ? e.target.checked : e.target.value;
                                                                    setFormData({...formData, [field.id]: val});
                                                                }}
                                                                className={`
                                                                    ${field.type === 'checkbox' ? 'w-4 h-4' : 'w-full border-b bg-slate-50 p-1 text-sm focus:outline-none transition-colors text-black font-mono'}
                                                                    ${issue && field.type !== 'checkbox' ? 'border-rose-500 bg-rose-50' : 'border-slate-400 focus:border-blue-600 focus:bg-blue-50'}
                                                                `}
                                                            />
                                                            {issue && field.type !== 'checkbox' && (
                                                                <div className="absolute right-0 top-1 text-rose-500">
                                                                    <AlertCircle size={14} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {issue && (
                                                            <p className="text-[10px] text-rose-600 mt-1 font-medium">{issue.message}</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-12 pt-8 border-t border-slate-200">
                                            <div className="flex justify-between items-end">
                                                <div className="text-xs text-slate-400">
                                                    Generated by InvoiceFlow B2G Module<br />
                                                    Date: {new Date().toLocaleDateString()}
                                                </div>
                                                <div className="border-t border-black w-48 text-center pt-1 text-xs font-bold">
                                                    Authorized Signature
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                <FileText size={48} className="mb-4 opacity-20" />
                                <p className="font-medium">Select a Template and Invoice to generate a Live Form</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default ComplianceReports;
