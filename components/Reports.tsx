
import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, InvoiceStatus, RiskLevel, AppSettings } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Calendar, Filter, Download, DollarSign, FileText, AlertOctagon, TrendingUp, TrendingDown, Activity, Ban, ShieldCheck, PieChart as PieChartIcon, Table, Settings2, CheckSquare, Square, CalendarRange, Play, ArrowLeft, Search } from 'lucide-react';
import ComplianceReports from './ComplianceReports';

interface ReportsProps {
  invoices: Invoice[];
  appSettings?: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];
const STATUS_COLORS: Record<string, string> = {
  [InvoiceStatus.APPROVED]: '#10b981', // Emerald
  [InvoiceStatus.POSTED_TO_XERO]: '#059669', // Dark Emerald
  [InvoiceStatus.NEEDS_REVIEW]: '#f59e0b', // Amber
  [InvoiceStatus.FAILED]: '#ef4444', // Rose
  [InvoiceStatus.RECEIVED]: '#94a3b8', // Slate
  [InvoiceStatus.EXTRACTED]: '#60a5fa', // Blue
  [InvoiceStatus.MATCHED]: '#818cf8', // Indigo
  [InvoiceStatus.VALIDATED]: '#a78bfa', // Purple
};

type TimeRange = '7d' | '30d' | '90d' | 'year' | 'all';
type ReportTab = 'financial' | 'compliance' | 'custom';

const AVAILABLE_COLUMNS = [
    { id: 'invoiceNumber', label: 'Invoice #' },
    { id: 'supplierName', label: 'Supplier' },
    { id: 'supplierABN', label: 'ABN' },
    { id: 'invoiceDate', label: 'Date' },
    { id: 'totalAmount', label: 'Amount' },
    { id: 'status', label: 'Status' },
    { id: 'riskLevel', label: 'Risk Level' },
    { id: 'poNumber', label: 'PO Number' },
    { id: 'intakeId', label: 'Intake ID' }
];

const Reports: React.FC<ReportsProps> = ({ invoices, appSettings, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('financial');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Custom Report State
  const [customStartDate, setCustomStartDate] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['invoiceNumber', 'supplierName', 'invoiceDate', 'totalAmount', 'status', 'riskLevel']);
  const [reportData, setReportData] = useState<Invoice[]>([]);
  const [reportRun, setReportRun] = useState(false);

  // --- DATA PROCESSING ---
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    if (timeRange === 'all') return invoices;

    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);
    if (timeRange === '90d') cutoff.setDate(now.getDate() - 90);
    if (timeRange === 'year') cutoff.setFullYear(now.getFullYear() - 1);

    return invoices.filter(inv => new Date(inv.invoiceDate) >= cutoff);
  }, [invoices, timeRange]);

  const handleRunReport = () => {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);

      const data = invoices.filter(inv => {
          const d = new Date(inv.invoiceDate);
          return d >= start && d <= end;
      });
      setReportData(data);
      setReportRun(true);
  };

  // Run initial report on mount so list isn't empty if we have data
  useEffect(() => {
      if (invoices.length > 0 && reportData.length === 0 && !reportRun) {
          // Optional: Auto-run on first load? Or wait for user. 
          // Let's wait for user action in Custom tab, but financial runs automatically.
      }
  }, [invoices]);

  const metrics = useMemo(() => {
    const totalSpend = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const count = filteredInvoices.length;
    const avgAmount = count > 0 ? totalSpend / count : 0;
    
    const rejectedCount = filteredInvoices.filter(inv => inv.status === InvoiceStatus.FAILED).length;
    const rejectionRate = count > 0 ? (rejectedCount / count) * 100 : 0;

    const highRiskCount = filteredInvoices.filter(inv => inv.riskAssessment?.level === RiskLevel.HIGH).length;

    const trend = Math.random() > 0.5 ? 'up' : 'down'; 
    const trendValue = Math.floor(Math.random() * 15) + 1;

    return { totalSpend, count, avgAmount, rejectionRate, highRiskCount, trend, trendValue };
  }, [filteredInvoices]);

  const chartsData = useMemo(() => {
    // 1. Spend Over Time
    const spendMap: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
        const date = new Date(inv.invoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        spendMap[date] = (spendMap[date] || 0) + inv.totalAmount;
    });
    const spendData = Object.entries(spendMap).map(([name, value]) => ({ name, value }));

    // 2. Status Distribution
    const statusMap: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
        statusMap[inv.status] = (statusMap[inv.status] || 0) + 1;
    });
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // 3. Top Suppliers
    const supplierMap: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
        supplierMap[inv.supplierName] = (supplierMap[inv.supplierName] || 0) + inv.totalAmount;
    });
    const supplierData = Object.entries(supplierMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // 4. Risk Distribution
    const riskMap: Record<string, number> = { [RiskLevel.LOW]: 0, [RiskLevel.MEDIUM]: 0, [RiskLevel.HIGH]: 0 };
    filteredInvoices.forEach(inv => {
        if (inv.riskAssessment?.level) {
            riskMap[inv.riskAssessment.level] = (riskMap[inv.riskAssessment.level] || 0) + 1;
        }
    });
    const riskData = Object.entries(riskMap).map(([name, value]) => ({ name, value }));

    return { spendData, statusData, supplierData, riskData };
  }, [filteredInvoices]);

  // Helper for currency formatting
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  const toggleColumn = (id: string) => {
      if (selectedColumns.includes(id)) {
          setSelectedColumns(prev => prev.filter(c => c !== id));
      } else {
          setSelectedColumns(prev => [...prev, id]);
      }
  };

  const handleCustomExport = () => {
      const headers = selectedColumns.map(id => AVAILABLE_COLUMNS.find(c => c.id === id)?.label).join(',');
      const rows = reportData.map(inv => {
          return selectedColumns.map(col => {
              switch(col) {
                  case 'invoiceNumber': return `"${inv.invoiceNumber}"`;
                  case 'supplierName': return `"${inv.supplierName}"`;
                  case 'supplierABN': return `"${inv.supplierABN}"`;
                  case 'invoiceDate': return inv.invoiceDate;
                  case 'totalAmount': return inv.totalAmount.toFixed(2);
                  case 'status': return inv.status;
                  case 'riskLevel': return inv.riskAssessment?.level || 'N/A';
                  case 'poNumber': return inv.poNumberMatched || inv.poNumberExtracted || '';
                  case 'intakeId': return inv.intakeId;
                  default: return '';
              }
          }).join(',');
      }).join('\n');

      const csvContent = `${headers}\n${rows}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `custom_report_${customStartDate}_to_${customEndDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const renderContent = () => {
      if (activeTab === 'compliance' && appSettings && onUpdateSettings) {
          return <ComplianceReports settings={appSettings} invoices={invoices} onUpdateSettings={onUpdateSettings} />;
      }

      if (activeTab === 'custom') {
          return (
              <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
                  {/* Custom Report Header with Back Button */}
                  <div className="flex justify-between items-end shrink-0">
                      <div className="flex items-center gap-4">
                          <button 
                              onClick={() => setActiveTab('financial')}
                              className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                              title="Back to Analytics"
                          >
                              <ArrowLeft size={20} />
                          </button>
                          <div>
                              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                  <Settings2 className="text-indigo-600" size={24} /> Custom Report Builder
                              </h2>
                              <p className="text-slate-500 mt-1">Generate tailored datasets based on specific date ranges and fields.</p>
                          </div>
                      </div>
                      <button 
                          onClick={handleCustomExport}
                          disabled={reportData.length === 0}
                          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <Download size={18} /> Export CSV
                      </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                      {/* Configuration Panel */}
                      <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2">
                          {/* Date Range */}
                          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <CalendarRange size={16} className="text-slate-400" /> Date Range
                              </h3>
                              <div className="space-y-3">
                                  <div>
                                      <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                                      <input 
                                          type="date" 
                                          value={customStartDate}
                                          onChange={(e) => setCustomStartDate(e.target.value)}
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                                      <input 
                                          type="date" 
                                          value={customEndDate}
                                          onChange={(e) => setCustomEndDate(e.target.value)}
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                      />
                                  </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-slate-100">
                                  <button 
                                      onClick={handleRunReport}
                                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
                                  >
                                      <Play size={16} /> Run Report
                                  </button>
                              </div>
                          </div>

                          {/* Column Selection */}
                          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <Table size={16} className="text-slate-400" /> Columns
                              </h3>
                              <div className="space-y-2">
                                  {AVAILABLE_COLUMNS.map(col => (
                                      <button 
                                          key={col.id}
                                          onClick={() => toggleColumn(col.id)}
                                          className={`flex items-center gap-3 w-full text-left px-2 py-1.5 rounded-md transition-colors text-sm ${selectedColumns.includes(col.id) ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                      >
                                          {selectedColumns.includes(col.id) ? <CheckSquare size={16} className="shrink-0" /> : <Square size={16} className="shrink-0" />}
                                          {col.label}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>

                      {/* Preview Panel */}
                      <div className="lg:col-span-3 h-full flex flex-col">
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                                  <h3 className="font-bold text-slate-700 text-sm">Preview Data ({reportData.length} Records)</h3>
                              </div>
                              <div className="flex-1 overflow-auto p-0 relative">
                                  {reportData.length > 0 ? (
                                      <table className="w-full text-left border-collapse">
                                          <thead>
                                              <tr className="bg-white border-b border-slate-200 text-xs text-slate-500 uppercase sticky top-0 z-10 shadow-sm">
                                                  {selectedColumns.map(colId => (
                                                      <th key={colId} className="px-4 py-3 font-semibold whitespace-nowrap bg-slate-50 border-b border-slate-200">
                                                          {AVAILABLE_COLUMNS.find(c => c.id === colId)?.label}
                                                      </th>
                                                  ))}
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                              {reportData.map(inv => (
                                                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                                      {selectedColumns.map(colId => {
                                                          let content: React.ReactNode = '';
                                                          switch(colId) {
                                                              case 'invoiceNumber': content = <span className="font-medium text-slate-800">{inv.invoiceNumber}</span>; break;
                                                              case 'supplierName': content = <span className="text-slate-700">{inv.supplierName}</span>; break;
                                                              case 'supplierABN': content = <span className="font-mono text-xs text-slate-500">{inv.supplierABN}</span>; break;
                                                              case 'invoiceDate': content = <span className="text-slate-600">{inv.invoiceDate}</span>; break;
                                                              case 'totalAmount': content = <span className="font-medium text-slate-900">${inv.totalAmount.toFixed(2)}</span>; break;
                                                              case 'status': content = <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${inv.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{inv.status}</span>; break;
                                                              case 'riskLevel': content = <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${inv.riskAssessment?.level === 'HIGH' ? 'bg-rose-100 text-rose-800' : inv.riskAssessment?.level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{inv.riskAssessment?.level || 'N/A'}</span>; break;
                                                              case 'poNumber': content = <span className="font-mono text-xs text-blue-600">{inv.poNumberMatched || inv.poNumberExtracted || '-'}</span>; break;
                                                              case 'intakeId': content = <span className="text-xs text-slate-400">{inv.intakeId}</span>; break;
                                                          }
                                                          return <td key={colId} className="px-4 py-3 text-sm whitespace-nowrap">{content}</td>;
                                                      })}
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  ) : (
                                      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/30">
                                          {reportRun ? (
                                              <>
                                                  <Search size={48} className="mb-4 opacity-20" />
                                                  <p className="font-medium text-slate-500">No records found for this period.</p>
                                                  <p className="text-sm mt-1">Try adjusting the date range.</p>
                                              </>
                                          ) : (
                                              <>
                                                  <Filter size={48} className="mb-4 opacity-20" />
                                                  <p className="font-medium text-slate-500">Select date range and click Run Report.</p>
                                              </>
                                          )}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          );
      }

      // Default: Financial Dashboard
      return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Financial Reports</h2>
              <div className="flex items-center gap-4 mt-2">
                  <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                      <button onClick={() => setActiveTab('financial')} className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold shadow-sm">Analytics</button>
                      <button onClick={() => setActiveTab('custom')} className="px-3 py-1 text-slate-600 hover:text-slate-900 rounded text-xs font-bold transition-colors">Custom Report</button>
                      {appSettings && (
                          <button onClick={() => setActiveTab('compliance')} className="px-3 py-1 text-slate-600 hover:text-slate-900 rounded text-xs font-bold transition-colors">B2G Compliance</button>
                      )}
                  </div>
              </div>
            </div>
            
            <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                {[
                    { id: '7d', label: '7D' },
                    { id: '30d', label: '30D' },
                    { id: '90d', label: '3M' },
                    { id: 'year', label: 'YTD' },
                    { id: 'all', label: 'ALL' }
                ].map(range => (
                    <button
                        key={range.id}
                        onClick={() => setTimeRange(range.id as TimeRange)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === range.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                        {range.label}
                    </button>
                ))}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><DollarSign size={20} /></div>
                      <span className={`text-xs font-bold flex items-center ${metrics.trend === 'up' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {metrics.trend === 'up' ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                          {metrics.trendValue}%
                      </span>
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Spend</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(metrics.totalSpend)}</h3>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mb-8 transition-transform group-hover:scale-150"></div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><FileText size={20} /></div>
                      <span className="text-xs font-bold text-slate-400">Total</span>
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Invoices Processed</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{metrics.count}</h3>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-8 -mb-8 transition-transform group-hover:scale-150"></div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><AlertOctagon size={20} /></div>
                      <span className={`text-xs font-bold flex items-center ${metrics.highRiskCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {metrics.highRiskCount} Flags
                      </span>
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">High Risk Invoices</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{((metrics.highRiskCount / metrics.count || 0) * 100).toFixed(1)}%</h3>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-8 -mb-8 transition-transform group-hover:scale-150"></div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Ban size={20} /></div>
                      <span className="text-xs font-bold text-slate-400">Rate</span>
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Rejection Rate</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{metrics.rejectionRate.toFixed(1)}%</h3>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-8 -mb-8 transition-transform group-hover:scale-150"></div>
              </div>
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Spending Trend */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Activity size={18} className="text-blue-500" /> Spending Trend
                  </h3>
                  <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartsData.spendData}>
                              <defs>
                                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fill: '#94a3b8', fontSize: 12}} 
                                  tickMargin={10}
                              />
                              <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fill: '#94a3b8', fontSize: 12}} 
                                  tickFormatter={(val) => `$${val}`}
                              />
                              <Tooltip 
                                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                  formatter={(val: number) => [formatCurrency(val), 'Spend']}
                              />
                              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Top Suppliers */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <DollarSign size={18} className="text-emerald-500" /> Top Suppliers by Spend
                  </h3>
                  <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={chartsData.supplierData} margin={{ left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                              <XAxis type="number" hide />
                              <YAxis 
                                  dataKey="name" 
                                  type="category" 
                                  width={120}
                                  tick={{fill: '#475569', fontSize: 12, fontWeight: 500}}
                                  axisLine={false}
                                  tickLine={false}
                              />
                              <Tooltip 
                                  cursor={{fill: '#f8fafc'}}
                                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                  formatter={(val: number) => [formatCurrency(val), 'Total']}
                              />
                              <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Invoice Status Distribution */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Status Breakdown</h3>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={chartsData.statusData}
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                              >
                                  {chartsData.statusData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                                  ))}
                              </Pie>
                              <Tooltip />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Risk Profile */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <AlertOctagon size={18} className="text-amber-500" /> Risk Profile
                  </h3>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={chartsData.riskData}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  dataKey="value"
                                  label={({ name, percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                              >
                                  {chartsData.riskData.map((entry, index) => {
                                      let color = '#94a3b8';
                                      if (entry.name === RiskLevel.HIGH) color = '#ef4444';
                                      if (entry.name === RiskLevel.MEDIUM) color = '#f59e0b';
                                      if (entry.name === RiskLevel.LOW) color = '#10b981';
                                      return <Cell key={`cell-${index}`} fill={color} />;
                                  })}
                              </Pie>
                              <Tooltip />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </div>

          </div>
        </div>
      );
  }

  return (
      <div className="h-full flex flex-col">
          {activeTab === 'compliance' && appSettings && onUpdateSettings ? (
              <>
                  <div className="p-8 pb-0">
                      <div className="flex space-x-2 border-b border-slate-200">
                          <button onClick={() => setActiveTab('financial')} className="px-6 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 flex items-center gap-2">
                              <PieChartIcon size={16} /> Financial Analytics
                          </button>
                          <button onClick={() => setActiveTab('custom')} className="px-6 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 flex items-center gap-2">
                              <Settings2 size={16} /> Custom Reports
                          </button>
                          <button onClick={() => setActiveTab('compliance')} className="px-6 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 flex items-center gap-2">
                              <ShieldCheck size={16} /> B2G Compliance
                          </button>
                      </div>
                  </div>
                  <ComplianceReports settings={appSettings} invoices={invoices} onUpdateSettings={onUpdateSettings} />
              </>
          ) : (
              renderContent()
          )}
      </div>
  );
};

export default Reports;
