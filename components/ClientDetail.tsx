
import React, { useRef, useState } from 'react';
import { Client, ClientDocument } from '../types';
import { ArrowLeft, Upload, FileText, Trash2, Calendar, DollarSign, Activity, FileCheck, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
  onUpdate: (client: Client) => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Budget Data for Chart
  const budgetData = [
    { name: 'Used', value: client.totalBudgetUsed, color: '#3b82f6' },
    { name: 'Remaining', value: client.totalBudgetCap - client.totalBudgetUsed, color: '#e2e8f0' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      
      // Simulate upload process
      setTimeout(() => {
          const newDoc: ClientDocument = {
              id: `doc-${Date.now()}`,
              name: file.name,
              type: file.name.toLowerCase().includes('plan') ? 'CARE_PLAN' : 'OTHER',
              size: file.size,
              uploadDate: new Date().toISOString().split('T')[0],
              url: '#'
          };

          onUpdate({
              ...client,
              documents: [newDoc, ...client.documents]
          });
          setIsUploading(false);
      }, 1500);
    }
  };

  const removeDoc = (id: string) => {
      onUpdate({
          ...client,
          documents: client.documents.filter(d => d.id !== id)
      });
  };

  const remaining = client.totalBudgetCap - client.totalBudgetUsed;

  return (
    <div className="p-8 h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
           <div className="flex items-center gap-3">
               <h2 className="text-2xl font-bold text-slate-800">{client.name}</h2>
               <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded border border-blue-200 uppercase">
                   {client.status}
               </span>
           </div>
           <p className="text-sm text-slate-500">Integration ID: {client.integrationId} • {client.email}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Financials */}
              <div className="space-y-6">
                  {/* Budget Card */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                          <DollarSign size={16} className="text-emerald-500" />
                          Budget Utilization
                      </h3>
                      
                      <div className="h-48 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={budgetData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {budgetData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                              <span className="text-2xl font-bold text-slate-800">${remaining.toLocaleString()}</span>
                              <span className="text-xs text-slate-500 font-medium">REMAINING</span>
                          </div>
                      </div>

                      <div className="mt-4 space-y-3">
                          <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                              <span className="text-slate-500">Total Cap</span>
                              <span className="font-medium text-slate-800">${client.totalBudgetCap.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                              <span className="text-slate-500">Used YTD</span>
                              <span className="font-medium text-blue-600">${client.totalBudgetUsed.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Renewal Date</span>
                              <span className="font-medium text-slate-800">{client.budgetRenewalDate}</span>
                          </div>
                      </div>
                  </div>

                  {/* Activity Card */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Activity size={16} className="text-purple-500" />
                          Recent Activity
                      </h3>
                      <div className="space-y-4">
                          <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                              <div>
                                  <p className="text-sm text-slate-700">Invoice processed for <span className="font-medium">$450.00</span></p>
                                  <p className="text-xs text-slate-400">Oct 27, 2023 • BrightSide Care</p>
                              </div>
                          </div>
                          <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                              <div>
                                  <p className="text-sm text-slate-700">Budget limit refreshed via Sync</p>
                                  <p className="text-xs text-slate-400">Oct 20, 2023 • Lookout API</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Right Column: Documents & Care Plan */}
              <div className="lg:col-span-2 space-y-6">
                   {/* Context Info */}
                   <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                       <FileCheck className="text-indigo-600 shrink-0 mt-0.5" size={20} />
                       <div>
                           <h4 className="text-sm font-bold text-indigo-900">AI Context Source</h4>
                           <p className="text-sm text-indigo-800 mt-1">
                               Documents uploaded here are automatically indexed for the AI Invoice Auditor. 
                               Upload the latest <strong>Care Plan</strong> or <strong>Service Agreement</strong> to ensure validation rules are accurate for {client.name}.
                           </p>
                       </div>
                   </div>

                   <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                       <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                           <h3 className="font-bold text-slate-700 text-sm">Client Documents</h3>
                           <button 
                               onClick={() => fileInputRef.current?.click()}
                               className="text-xs flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 px-3 py-1.5 rounded-lg font-medium transition-all shadow-sm"
                           >
                               {isUploading ? <span className="animate-spin">⌛</span> : <Upload size={14} />}
                               Upload Document
                           </button>
                       </div>
                       
                       <div className="p-0">
                           {client.documents.length === 0 ? (
                               <div className="p-8 text-center text-slate-400">
                                   <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                   <p>No documents found.</p>
                                   <p className="text-xs mt-1">Upload a Care Plan to enable advanced AI auditing.</p>
                               </div>
                           ) : (
                               <div className="divide-y divide-slate-50">
                                   {client.documents.map(doc => (
                                       <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                           <div className="flex items-center gap-4">
                                               <div className={`p-2 rounded-lg ${doc.type === 'CARE_PLAN' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                                   <FileText size={20} />
                                               </div>
                                               <div>
                                                   <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                                                   <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                       <span>{(doc.size / 1024).toFixed(0)} KB</span>
                                                       <span>•</span>
                                                       <span>Uploaded {doc.uploadDate}</span>
                                                       {doc.type === 'CARE_PLAN' && (
                                                           <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold tracking-wide uppercase">Care Plan</span>
                                                       )}
                                                   </div>
                                               </div>
                                           </div>
                                           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                               <button onClick={() => removeDoc(doc.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                                                   <Trash2 size={16} />
                                               </button>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                   </div>
              </div>
          </div>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload}
        className="hidden" 
        accept=".pdf"
      />
    </div>
  );
};

export default ClientDetail;
