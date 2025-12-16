
import React, { useRef, useState } from 'react';
import { Client, ClientDocument, FundingSource } from '../types';
import { ArrowLeft, Upload, FileText, Trash2, Calendar, DollarSign, Activity, FileCheck, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { extractClientProfileFromDocument } from '../services/geminiService';

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
  onUpdate: (client: Client) => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);

  // Budget Data for Chart
  const budgetData = [
    { name: 'Used', value: client.totalBudgetUsed, color: '#3b82f6' },
    { name: 'Remaining', value: client.totalBudgetCap - client.totalBudgetUsed, color: '#e2e8f0' }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      
      // 1. Create Document Record (Mock Upload)
      // In a real app, we'd upload to Supabase Storage here.
      const newDoc: ClientDocument = {
          id: `doc-${Date.now()}`,
          name: file.name,
          type: file.name.toLowerCase().includes('plan') ? 'CARE_PLAN' : 'OTHER',
          size: file.size,
          uploadDate: new Date().toISOString().split('T')[0],
          url: '#' // Mock URL
      };

      // 2. Offer to Sync Profile Data
      const shouldSync = confirm(`Uploaded "${file.name}".\n\nDo you want the AI to scan this document and update the client's funding/profile details automatically?`);

      let updatedClient = { ...client, documents: [newDoc, ...client.documents] };

      if (shouldSync) {
          setIsSyncingProfile(true);
          try {
              const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                  reader.readAsDataURL(file);
              });

              // Use the new Robust Extractor
              const profile = await extractClientProfileFromDocument(base64, file.type);
              
              // Merge extracted data carefully
              updatedClient = {
                  ...updatedClient,
                  name: profile.name || updatedClient.name,
                  email: profile.email || updatedClient.email,
                  phone: profile.phone || updatedClient.phone,
                  integrationId: profile.integrationId || updatedClient.integrationId,
                  totalBudgetCap: profile.totalBudgetCap || updatedClient.totalBudgetCap,
                  budgetRenewalDate: profile.budgetRenewalDate || updatedClient.budgetRenewalDate,
                  
                  // Specific Funding Details
                  mmmLevel: (profile.mmmLevel as any) || updatedClient.mmmLevel,
                  dvaCardType: (profile.dvaCardType as any) || updatedClient.dvaCardType,
                  isIndigenous: profile.isIndigenous !== undefined ? profile.isIndigenous : updatedClient.isIndigenous,
                  isClaimsConference: profile.isClaimsConference !== undefined ? profile.isClaimsConference : updatedClient.isClaimsConference,
                  
                  // Merge Schemes (Append new ones)
                  activeSchemes: profile.detectedSchemes 
                      ? Array.from(new Set([...(updatedClient.activeSchemes || []), ...profile.detectedSchemes]))
                      : updatedClient.activeSchemes,

                  // Specific Approvals (Append new ones)
                  specificApprovals: profile.specificApprovals 
                      ? Array.from(new Set([...updatedClient.specificApprovals, ...profile.specificApprovals]))
                      : updatedClient.specificApprovals
              };
              
              // Handle complex funding source + supplements
              if (profile.fundingSource) {
                   updatedClient.fundingPackages[0] = { 
                       ...updatedClient.fundingPackages[0], 
                       source: profile.fundingSource as FundingSource,
                       supplements: profile.detectedSupplements || updatedClient.fundingPackages[0].supplements
                   };
              }

              alert("Client profile updated from document successfully! Please review the funding details.");

          } catch (error) {
              console.error("Sync failed", error);
              alert("Document uploaded, but AI sync failed. Please update profile manually if needed.");
          } finally {
              setIsSyncingProfile(false);
          }
      }

      onUpdate(updatedClient);
      setIsUploading(false);
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
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
                   <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 relative overflow-hidden">
                       <FileCheck className="text-indigo-600 shrink-0 mt-0.5 relative z-10" size={20} />
                       <div className="relative z-10">
                           <h4 className="text-sm font-bold text-indigo-900">Personal Document Folder</h4>
                           <p className="text-sm text-indigo-800 mt-1">
                               This folder serves as the <strong>AI Knowledge Base</strong> for {client.name}. 
                               Upload Care Plans, Service Agreements, or Intake Forms here. The AI will index them to validate future invoices against specific client rules.
                           </p>
                           {isSyncingProfile && (
                               <div className="mt-2 flex items-center gap-2 text-xs font-bold text-indigo-600 bg-white/50 p-2 rounded w-fit">
                                   <Loader2 size={12} className="animate-spin" /> Syncing profile data from new document...
                               </div>
                           )}
                       </div>
                       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
                   </div>

                   <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                       <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                           <h3 className="font-bold text-slate-700 text-sm">Client Documents</h3>
                           <button 
                               onClick={() => fileInputRef.current?.click()}
                               disabled={isUploading}
                               className="text-xs flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 px-3 py-1.5 rounded-lg font-medium transition-all shadow-sm disabled:opacity-70"
                           >
                               {isUploading ? <span className="animate-spin flex gap-1"><Loader2 size={14}/> Uploading...</span> : <Upload size={14} />}
                               {isUploading ? '' : 'Upload Document'}
                           </button>
                       </div>
                       
                       <div className="p-0">
                           {client.documents.length === 0 ? (
                               <div className="p-8 text-center text-slate-400">
                                   <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                   <p>No documents found.</p>
                                   <p className="text-xs mt-1">Upload a Care Plan (PDF/Docx) to enable advanced AI auditing.</p>
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
        accept=".pdf,.doc,.docx,.xls,.xlsx" // Expanded file support
      />
    </div>
  );
};

export default ClientDetail;
