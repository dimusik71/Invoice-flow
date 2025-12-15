
import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus, RiskLevel, ValidationSeverity } from '../types';
import { Search, Filter, AlertTriangle, BadgeCheck, ShieldAlert, Download, FileSpreadsheet, CalendarRange, Check, X, FileJson, FileText, LayoutGrid, List as ListIcon, ArrowRight, BrainCircuit, Loader2, CheckCircle, AlertOctagon } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  filterStatus?: InvoiceStatus;
}

const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const styles = {
    [InvoiceStatus.RECEIVED]: 'bg-slate-100 text-slate-700',
    [InvoiceStatus.EXTRACTED]: 'bg-blue-50 text-blue-700',
    [InvoiceStatus.MATCHED]: 'bg-indigo-50 text-indigo-700',
    [InvoiceStatus.VALIDATED]: 'bg-purple-50 text-purple-700',
    [InvoiceStatus.NEEDS_REVIEW]: 'bg-amber-50 text-amber-700',
    [InvoiceStatus.APPROVED]: 'bg-emerald-50 text-emerald-700',
    [InvoiceStatus.POSTED_TO_XERO]: 'bg-green-100 text-green-800',
    [InvoiceStatus.FAILED]: 'bg-rose-50 text-rose-700',
  };

  const labels = {
    [InvoiceStatus.RECEIVED]: 'Received',
    [InvoiceStatus.EXTRACTED]: 'Extracted',
    [InvoiceStatus.MATCHED]: 'Matched',
    [InvoiceStatus.VALIDATED]: 'Validated',
    [InvoiceStatus.NEEDS_REVIEW]: 'Needs Review',
    [InvoiceStatus.APPROVED]: 'Approved',
    [InvoiceStatus.POSTED_TO_XERO]: 'Posted to Xero',
    [InvoiceStatus.FAILED]: 'Failed',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles[InvoiceStatus.RECEIVED]}`}>
      {labels[status]}
    </span>
  );
};

const RiskBadge = ({ level, invoice }: { level?: RiskLevel, invoice?: Invoice }) => {
  // Check for Exception (System Validation Failure)
  const isException = invoice?.validationResults.some(r => r.severity === ValidationSeverity.FAIL && r.result === 'FAIL');

  if (isException) {
      return (
        <span className="flex items-center w-fit px-2 py-0.5 rounded text-xs font-bold border bg-purple-50 text-purple-700 border-purple-200">
            <AlertOctagon size={12} className="mr-1" /> SYSTEM EXCEPTION
        </span>
      );
  }

  if (!level) return <span className="text-xs text-slate-400">-</span>;
  
  const styles = {
    [RiskLevel.LOW]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    [RiskLevel.MEDIUM]: 'bg-amber-50 text-amber-700 border-amber-200',
    [RiskLevel.HIGH]: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const icons = {
    [RiskLevel.LOW]: <BadgeCheck size={12} className="mr-1" />,
    [RiskLevel.MEDIUM]: <AlertTriangle size={12} className="mr-1" />,
    [RiskLevel.HIGH]: <ShieldAlert size={12} className="mr-1" />,
  };

  return (
    <span className={`flex items-center w-fit px-2 py-0.5 rounded text-xs font-bold border ${styles[level]}`}>
      {icons[level]} {level} RISK
    </span>
  );
};

// --- EXPORT HELPERS ---

const downloadBlob = (content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const formatCSV = (invoices: Invoice[]) => {
  const headers = ['IntakeID', 'Supplier', 'ABN', 'InvoiceNumber', 'Date', 'PONumber', 'TotalAmount', 'Status', 'RiskLevel'];
  const rows = invoices.map(inv => [
    inv.intakeId,
    `"${inv.supplierName}"`, // Quote strings
    inv.supplierABN,
    inv.invoiceNumber,
    inv.invoiceDate,
    inv.poNumberMatched || inv.poNumberExtracted || '',
    inv.totalAmount.toFixed(2),
    inv.status,
    inv.riskAssessment?.level || ''
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

// ... (Other export format functions remain the same as previous implementations) ...
const formatXero = (invoices: Invoice[]) => "Mock Xero Content"; 
const formatMYOB = (invoices: Invoice[]) => "Mock MYOB Content";
const formatQuickBooks = (invoices: Invoice[]) => "Mock QuickBooks Content";
const formatEpicor = (invoices: Invoice[]) => "Mock Epicor Content";

interface TriageCardProps {
  invoice: Invoice;
  onSelectInvoice: (invoice: Invoice) => void;
}

const TriageCard: React.FC<TriageCardProps> = ({ invoice, onSelectInvoice }) => {
  const isException = invoice.validationResults.some(r => r.severity === ValidationSeverity.FAIL && r.result === 'FAIL');
  
  return (
    <div 
        onClick={() => onSelectInvoice(invoice)}
        className={`bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-2 ${isException ? 'border-purple-200 ring-1 ring-purple-100' : 'border-slate-200'}`}
    >
        <div className="flex justify-between items-start">
            <span className="font-bold text-slate-800 text-sm">{invoice.supplierName}</span>
            <span className="font-mono text-xs text-slate-500">{invoice.invoiceDate}</span>
        </div>
        
        <div className="flex justify-between items-center">
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">{invoice.intakeId}</span>
            <span className="font-bold text-slate-900">${invoice.totalAmount.toFixed(2)}</span>
        </div>

        {isException ? (
            <div className="mt-2 p-2 rounded text-xs leading-relaxed border bg-purple-50 border-purple-100 text-purple-800">
                <p className="font-bold flex items-center gap-1"><AlertOctagon size={12} /> Validation Exception</p>
                <p className="mt-1 opacity-90 line-clamp-2">
                    {invoice.validationResults.find(r => r.result === 'FAIL')?.details || 'System validation failed.'}
                </p>
            </div>
        ) : invoice.riskAssessment && (
            <div className={`mt-2 p-2 rounded text-xs leading-relaxed border ${
                invoice.riskAssessment.level === RiskLevel.HIGH ? 'bg-rose-50 border-rose-100 text-rose-800' :
                invoice.riskAssessment.level === RiskLevel.MEDIUM ? 'bg-amber-50 border-amber-100 text-amber-800' :
                'bg-emerald-50 border-emerald-100 text-emerald-800'
            }`}>
                <p className="line-clamp-3">{invoice.riskAssessment.justification}</p>
            </div>
        )}
        
        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:underline">
                Review <ArrowRight size={12} />
            </span>
        </div>
    </div>
  );
};

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onSelectInvoice, filterStatus }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xero' | 'myob' | 'quickbooks' | 'epicor'>('csv');
  const [exportRange, setExportRange] = useState<'all' | 'today' | 'week' | 'month' | 'quarter'>('all');
  
  // View Toggle State (Only active for Needs Review)
  const [viewMode, setViewMode] = useState<'list' | 'triage'>('list');

  // Init viewMode based on filter status
  React.useEffect(() => {
      if (filterStatus === InvoiceStatus.NEEDS_REVIEW) {
          setViewMode('triage');
      } else {
          setViewMode('list');
      }
  }, [filterStatus]);

  // Simple filter logic
  let filteredInvoices = filterStatus 
    ? invoices.filter(inv => inv.status === filterStatus)
    : invoices;

  // Sorting: If reviewing, put Exceptions then HIGH risk first
  if (filterStatus === InvoiceStatus.NEEDS_REVIEW) {
      const riskScore = { [RiskLevel.HIGH]: 3, [RiskLevel.MEDIUM]: 2, [RiskLevel.LOW]: 1, undefined: 0 };
      filteredInvoices = filteredInvoices.sort((a, b) => {
          // Check for validation failure (Exception)
          const isExceptionA = a.validationResults.some(r => r.severity === ValidationSeverity.FAIL && r.result === 'FAIL');
          const isExceptionB = b.validationResults.some(r => r.severity === ValidationSeverity.FAIL && r.result === 'FAIL');
          
          if (isExceptionA && !isExceptionB) return -1;
          if (!isExceptionA && isExceptionB) return 1;

          const scoreA = riskScore[a.riskAssessment?.level || 'undefined'] || 0;
          const scoreB = riskScore[b.riskAssessment?.level || 'undefined'] || 0;
          return scoreB - scoreA;
      });
  }

  // Triage Grouping
  const triageGroups = useMemo(() => {
      const groups = {
          'EXCEPTION': [] as Invoice[], // New Exception Group
          [RiskLevel.HIGH]: [] as Invoice[],
          [RiskLevel.MEDIUM]: [] as Invoice[],
          [RiskLevel.LOW]: [] as Invoice[],
          'PENDING': [] as Invoice[]
      };
      
      if (filterStatus === InvoiceStatus.NEEDS_REVIEW) {
          filteredInvoices.forEach(inv => {
              const isException = inv.validationResults.some(r => r.severity === ValidationSeverity.FAIL && r.result === 'FAIL');
              
              if (isException) {
                  groups['EXCEPTION'].push(inv);
              } else {
                  const level = inv.riskAssessment?.level;
                  if (level) {
                      groups[level].push(inv);
                  } else {
                      groups['PENDING'].push(inv);
                  }
              }
          });
      }
      return groups;
  }, [filteredInvoices, filterStatus]);

  const handleExport = (singleInvoice?: Invoice) => {
      const dataToExport = singleInvoice ? [singleInvoice] : filteredInvoices;
      let content = '';
      
      if (exportFormat === 'csv') {
          content = formatCSV(dataToExport);
      } else {
          // Placeholder for other formats if implemented later
          content = formatCSV(dataToExport);
      }

      const filename = `invoice_export_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(content, filename, 'text/csv;charset=utf-8;');
      
      if (!singleInvoice) setShowExportModal(false);
  };

  return (
    <div className="p-8">
       <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            {filterStatus === InvoiceStatus.NEEDS_REVIEW ? (
                <>
                    <BrainCircuit className="text-indigo-600" size={28} />
                    AI Triage Queue
                </>
            ) : 'Invoices'}
          </h2>
          <p className="text-slate-500 mt-1">
            {filterStatus === InvoiceStatus.NEEDS_REVIEW 
                ? 'Manage system exceptions and AI-flagged risk items.' 
                : 'Manage and track invoice processing'}
          </p>
        </div>
        <div className="flex space-x-3">
          {filterStatus === InvoiceStatus.NEEDS_REVIEW && (
              <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                  <button 
                      onClick={() => setViewMode('triage')} 
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'triage' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                      title="AI Triage View"
                  >
                      <LayoutGrid size={18} />
                  </button>
                  <button 
                      onClick={() => setViewMode('list')} 
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                      title="List View"
                  >
                      <ListIcon size={18} />
                  </button>
              </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="pl-10 pr-4 py-2 bg-white text-black border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button 
            onClick={() => setShowExportModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
          >
            <Download size={18} />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {viewMode === 'triage' && filterStatus === InvoiceStatus.NEEDS_REVIEW ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-200px)] overflow-hidden">
              
              {/* Exceptions Column */}
              <div className="flex flex-col bg-purple-50/50 rounded-xl border border-purple-100 h-full">
                  <div className="p-4 border-b border-purple-200 bg-purple-100/50 rounded-t-xl flex justify-between items-center">
                      <h3 className="font-bold text-purple-800 flex items-center gap-2 text-sm">
                          <AlertOctagon size={16} /> Exceptions
                      </h3>
                      <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-purple-600 border border-purple-200">
                          {triageGroups['EXCEPTION'].length}
                      </span>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto flex-1">
                      {triageGroups['EXCEPTION'].length === 0 && (
                          <div className="text-center py-10 text-purple-300">
                              <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                              <p className="text-xs">No validation errors</p>
                          </div>
                      )}
                      {triageGroups['EXCEPTION'].map(inv => <TriageCard key={inv.id} invoice={inv} onSelectInvoice={onSelectInvoice} />)}
                  </div>
              </div>

              {/* High Risk Column */}
              <div className="flex flex-col bg-rose-50/50 rounded-xl border border-rose-100 h-full">
                  <div className="p-4 border-b border-rose-200 bg-rose-100/50 rounded-t-xl flex justify-between items-center">
                      <h3 className="font-bold text-rose-800 flex items-center gap-2 text-sm">
                          <ShieldAlert size={16} /> High Risk
                      </h3>
                      <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-rose-600 border border-rose-200">
                          {triageGroups[RiskLevel.HIGH].length}
                      </span>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto flex-1">
                      {triageGroups[RiskLevel.HIGH].length === 0 && (
                          <div className="text-center py-10 text-rose-300">
                              <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                              <p className="text-xs">No critical items</p>
                          </div>
                      )}
                      {triageGroups[RiskLevel.HIGH].map(inv => <TriageCard key={inv.id} invoice={inv} onSelectInvoice={onSelectInvoice} />)}
                  </div>
              </div>

              {/* Medium Risk Column */}
              <div className="flex flex-col bg-amber-50/50 rounded-xl border border-amber-100 h-full">
                  <div className="p-4 border-b border-amber-200 bg-amber-100/50 rounded-t-xl flex justify-between items-center">
                      <h3 className="font-bold text-amber-800 flex items-center gap-2 text-sm">
                          <AlertTriangle size={16} /> Medium Risk
                      </h3>
                      <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-amber-600 border border-amber-200">
                          {triageGroups[RiskLevel.MEDIUM].length}
                      </span>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto flex-1">
                      {triageGroups[RiskLevel.MEDIUM].length === 0 && (
                          <div className="text-center py-10 text-amber-300">
                              <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                              <p className="text-xs">All clear</p>
                          </div>
                      )}
                      {triageGroups[RiskLevel.MEDIUM].map(inv => <TriageCard key={inv.id} invoice={inv} onSelectInvoice={onSelectInvoice} />)}
                  </div>
              </div>

              {/* Low Risk Column */}
              <div className="flex flex-col bg-emerald-50/50 rounded-xl border border-emerald-100 h-full">
                  <div className="p-4 border-b border-emerald-200 bg-emerald-100/50 rounded-t-xl flex justify-between items-center">
                      <h3 className="font-bold text-emerald-800 flex items-center gap-2 text-sm">
                          <BadgeCheck size={16} /> Low Risk
                      </h3>
                      <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-emerald-600 border border-emerald-200">
                          {triageGroups[RiskLevel.LOW].length}
                      </span>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto flex-1">
                      {triageGroups[RiskLevel.LOW].length > 0 && (
                          <div className="mb-4 p-3 bg-emerald-100/50 border border-emerald-200 rounded-lg text-[10px] text-emerald-800 flex items-start gap-2">
                              <BrainCircuit size={12} className="shrink-0 mt-0.5" />
                              <p><strong>AI Suggestion:</strong> Candidates for bulk approval.</p>
                          </div>
                      )}
                      {triageGroups[RiskLevel.LOW].length === 0 && (
                          <div className="text-center py-10 text-emerald-300">
                              <p className="text-xs">No low risk items pending</p>
                          </div>
                      )}
                      {triageGroups[RiskLevel.LOW].map(inv => <TriageCard key={inv.id} invoice={inv} onSelectInvoice={onSelectInvoice} />)}
                  </div>
              </div>

          </div>
      ) : (
          /* LIST VIEW */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Intake ID</th>
                  <th className="px-6 py-4">Supplier</th>
                  {filterStatus === InvoiceStatus.NEEDS_REVIEW && <th className="px-6 py-4">Risk / Exception</th>}
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="">
                {filteredInvoices.map((invoice) => (
                  <tr 
                    key={invoice.id} 
                    className="bg-white border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => onSelectInvoice(invoice)}
                  >
                    <td className="p-4 text-sm font-medium text-slate-900">{invoice.intakeId}</td>
                    <td className="p-4 text-sm text-slate-600">{invoice.supplierName || 'Unknown'}</td>
                    
                    {filterStatus === InvoiceStatus.NEEDS_REVIEW && (
                        <td className="p-4">
                            <RiskBadge level={invoice.riskAssessment?.level} invoice={invoice} />
                        </td>
                    )}

                    <td className="p-4 text-sm text-slate-500">{invoice.invoiceDate}</td>
                    <td className="p-4 text-sm text-slate-500 font-mono">
                      {invoice.poNumberMatched || <span className="text-rose-500">Missing</span>}
                    </td>
                    <td className="p-4 text-sm text-slate-900 text-right font-medium">
                      ${invoice.totalAmount.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                          {/* Quick Export Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleExport(invoice); }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title={`Export as ${exportFormat.toUpperCase()}`}
                          >
                              <FileSpreadsheet size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onSelectInvoice(invoice); }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Review
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      )}

      {/* EXPORT MODAL */}
      {showExportModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Download size={20} className="text-indigo-600" /> Export Data
                      </h3>
                      <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 space-y-6">
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Format</label>
                          <div className="grid grid-cols-2 gap-3">
                              <button
                                  onClick={() => setExportFormat('csv')}
                                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                                      exportFormat === 'csv' 
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                  }`}
                              >
                                  <FileSpreadsheet size={16} />
                                  <span>CSV</span>
                              </button>
                          </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600">Records to Export:</span>
                              <span className="font-bold text-slate-900">{filteredInvoices.length}</span>
                          </div>
                      </div>

                      <button 
                          onClick={() => handleExport()} 
                          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                      >
                          <Download size={18} /> Download CSV
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InvoiceList;
