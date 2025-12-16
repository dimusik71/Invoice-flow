
import React, { useState, useRef, useEffect } from 'react';
import { Client, FundingSource } from '../types';
import { Search, Filter, RefreshCw, ChevronRight, User, AlertCircle, CheckCircle, Upload, Plus, X, Loader2, Sparkles, FileText as FileIcon, Calculator, Building2, MapPin, Flag, Award, Stethoscope } from 'lucide-react';
import ClientDetail from './ClientDetail';
import { extractClientProfileFromDocument } from '../services/geminiService';
import { fetchClientsForTenant, createClientInDb, updateClientInDb } from '../services/dbService';
import { useTenant } from '../contexts/TenantContext';
import { GOV_FUNDING_DATA } from '../constants';

interface ClientListProps {
    clients: Client[];
    onUpdateClient: (client: Client) => void;
    apiKey?: string; // Prop for live AI usage
}

const ClientList: React.FC<ClientListProps> = ({ apiKey }) => {
  const { tenant } = useTenant();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // Load Clients from DB on Tenant Change
  useEffect(() => {
      if (tenant) {
          loadClients();
      }
  }, [tenant]);

  const loadClients = async () => {
      if (!tenant) return;
      setIsLoading(true);
      try {
          const data = await fetchClientsForTenant(tenant.id);
          setClients(data);
      } catch (e) {
          console.error("Failed to load clients", e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleCreateClient = async (newClient: Client) => {
      try {
          // Ensure ID is unique if not set
          const clientWithId = { ...newClient, id: newClient.id || crypto.randomUUID() };
          // Optimistic UI update
          setClients(prev => [clientWithId, ...prev]);
          
          await createClientInDb(clientWithId);
          alert(`Client ${newClient.name} created successfully!`);
          setShowAddClientModal(false);
          loadClients(); // Refresh to get server timestamps/ID confirmation
      } catch (e) {
          console.error("Failed to create client", e);
          alert("Error creating client. Please try again.");
          loadClients(); // Revert UI
      }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
      try {
          // Optimistic UI update
          setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
          if (selectedClient && selectedClient.id === updatedClient.id) {
              setSelectedClient(updatedClient);
          }

          await updateClientInDb(updatedClient);
      } catch (e) {
          console.error("Failed to update client", e);
          alert("Error updating client.");
      }
  };

  const handleSyncLookout = () => {
    setIsSyncing(true);
    // Simulate API delay
    setTimeout(() => {
        setIsSyncing(false);
        alert("Successfully synced 14 updated records from Lookout.");
        loadClients(); // Reload in case sync changed things
    }, 2000);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedClient) {
      return <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} onUpdate={handleUpdateClient} />;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Client Management</h2>
          <p className="text-slate-500">Manage care plans, budgets, and integration settings.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setShowAddClientModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-all active:scale-95"
            >
                <Plus size={18} />
                <span>Add Client</span>
            </button>
            <button 
            onClick={handleSyncLookout}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-all active:scale-95 disabled:opacity-70"
            >
            <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Lookout'}</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search clients..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-white text-black border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Filter size={16} />
                <span>Showing {filteredClients.length} clients</span>
            </div>
        </div>

        {isLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>Loading clients from database...</p>
            </div>
        ) : (
            <table className="w-full text-left">
            <thead>
                <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Integration ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Budget Used</th>
                <th className="px-6 py-4">Docs</th>
                <th className="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                    const usagePct = (client.totalBudgetUsed / client.totalBudgetCap) * 100;
                    return (
                    <tr 
                        key={client.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedClient(client)}
                    >
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                                    {client.name.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{client.name}</p>
                                    <p className="text-xs text-slate-500">{client.email}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                        {client.integrationId ? (
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold border border-blue-100">
                                {client.integrationId}
                            </span>
                        ) : (
                            <span className="text-slate-400">-</span>
                        )}
                        </td>
                        <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            client.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 
                            client.status === 'ON_HOLD' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                            {client.status === 'ACTIVE' && <CheckCircle size={12} className="mr-1" />}
                            {client.status === 'ON_HOLD' && <AlertCircle size={12} className="mr-1" />}
                            {client.status}
                        </span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="w-full max-w-[140px]">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-slate-700">${client.totalBudgetUsed.toLocaleString()}</span>
                                    <span className="text-slate-400">${client.totalBudgetCap.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${usagePct > 90 ? 'bg-rose-500' : usagePct > 75 ? 'bg-amber-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${Math.min(usagePct, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                            {client.documents.length > 0 ? (
                                <div className="flex items-center gap-1 text-slate-600">
                                    <FileText size={14} /> {client.documents.length}
                                </div>
                            ) : (
                                <span className="text-slate-400 italic text-xs">No plans</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right">
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </td>
                    </tr>
                    );
                })}
            </tbody>
            </table>
        )}
      </div>

      {showAddClientModal && tenant && (
          <AddClientModal 
            onClose={() => setShowAddClientModal(false)} 
            onAdd={handleCreateClient}
            tenantId={tenant.id}
            apiKey={apiKey}
          />
      )}
    </div>
  );
};

// --- ADD CLIENT MODAL COMPONENT ---

interface AddClientModalProps {
    onClose: () => void;
    onAdd: (client: Client) => void;
    tenantId: string;
    apiKey?: string;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onAdd, tenantId, apiKey }) => {
    // Basic Info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [integrationId, setIntegrationId] = useState('');
    const [renewalDate, setRenewalDate] = useState(new Date().toISOString().split('T')[0]);

    // Complex Funding State
    const [sahLevel, setSahLevel] = useState<string>('SAH_LEVEL_3'); // Default L3
    const [supplements, setSupplements] = useState<string[]>([]);
    const [diseaseSchemes, setDiseaseSchemes] = useState<string[]>([]);
    const [mmmLevel, setMmmLevel] = useState<string>('1');
    const [dvaCard, setDvaCard] = useState<string>(''); // '' = None
    const [isIndigenous, setIsIndigenous] = useState(false);
    const [isClaimsConference, setIsClaimsConference] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [specificApprovals, setSpecificApprovals] = useState<string[]>([]);

    // Missing Info Alert
    const [missingInfo, setMissingInfo] = useState<string[]>([]);

    // Calculated
    const [dailyFunding, setDailyFunding] = useState(0);
    const [annualFunding, setAnnualFunding] = useState(0);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Calculator Engine ---
    useEffect(() => {
        let dailyTotal = 0;

        // 1. Base SAH Daily Rate
        if (sahLevel && GOV_FUNDING_DATA.SAH_DAILY_RATES[sahLevel as keyof typeof GOV_FUNDING_DATA.SAH_DAILY_RATES]) {
            dailyTotal += GOV_FUNDING_DATA.SAH_DAILY_RATES[sahLevel as keyof typeof GOV_FUNDING_DATA.SAH_DAILY_RATES];
        }

        // 2. MMM Loading (Remote Area) - Applies to Base Daily Rate
        const loading = GOV_FUNDING_DATA.MMM_LOADINGS[mmmLevel as keyof typeof GOV_FUNDING_DATA.MMM_LOADINGS] || 1.0;
        dailyTotal = dailyTotal * loading;

        // 3. Supplements (Daily)
        supplements.forEach(sup => {
            const val = GOV_FUNDING_DATA.SUPPLEMENT_DAILY_RATES[sup as keyof typeof GOV_FUNDING_DATA.SUPPLEMENT_DAILY_RATES];
            if (val) dailyTotal += val;
        });

        // 4. Claims Conference (Top-Up Simulation) - usually a fixed annual amount, converting to daily
        if (isClaimsConference) dailyTotal += (5000 / 365); 

        setDailyFunding(dailyTotal);
        setAnnualFunding(dailyTotal * 365); // Annualize for display
    }, [sahLevel, supplements, mmmLevel, isClaimsConference]);


    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsAnalyzing(true);
            try {
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                    reader.readAsDataURL(file);
                });

                // Call AI Service with API Key Override
                const profile = await extractClientProfileFromDocument(base64, file.type, apiKey);
                
                // Map extracted fields to State
                if (profile.name) setName(profile.name);
                if (profile.email) setEmail(profile.email);
                if (profile.phone) setPhone(profile.phone);
                if (profile.integrationId) setIntegrationId(profile.integrationId);
                if (profile.budgetRenewalDate) setRenewalDate(profile.budgetRenewalDate);
                
                if (profile.fundingSource) setSahLevel(profile.fundingSource);
                if (profile.mmmLevel) setMmmLevel(profile.mmmLevel);
                if (profile.dvaCardType) setDvaCard(profile.dvaCardType);
                if (profile.detectedSupplements) setSupplements(profile.detectedSupplements);
                if (profile.detectedSchemes) setDiseaseSchemes(profile.detectedSchemes);
                if (profile.isIndigenous !== undefined) setIsIndigenous(profile.isIndigenous);
                if (profile.isClaimsConference !== undefined) setIsClaimsConference(profile.isClaimsConference);
                if (profile.specificApprovals) setSpecificApprovals(profile.specificApprovals);

                // Set Missing Info Alert
                if (profile.missingData && profile.missingData.length > 0) {
                    setMissingInfo(profile.missingData);
                } else {
                    setMissingInfo([]);
                }

                alert("AI extracted profile data successfully. Please review the highlighted fields.");

            } catch (error) {
                console.error("Auto-fill failed", error);
                alert("Could not auto-fill from document. Please enter details manually.");
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newClient: Client = {
            id: crypto.randomUUID(), // New UUID
            tenantId,
            name,
            email,
            phone,
            integrationId,
            status: 'ACTIVE',
            totalBudgetCap: annualFunding,
            totalBudgetUsed: 0,
            budgetRenewalDate: renewalDate,
            documents: [], // Ideally attach the file if we persisted it
            activePO: '',
            fundingPackages: [{ source: sahLevel as FundingSource, startDate: new Date().toISOString().split('T')[0], supplements }],
            specificApprovals: specificApprovals, 
            dvaCardType: dvaCard as any || null,
            mmmLevel: mmmLevel as any,
            isIndigenous,
            isClaimsConference,
            isPrivateFunded: isPrivate,
            activeSchemes: diseaseSchemes
        };
        onAdd(newClient);
    };

    const toggleSupplement = (key: string) => {
        if (supplements.includes(key)) {
            setSupplements(prev => prev.filter(s => s !== key));
        } else {
            setSupplements(prev => [...prev, key]);
        }
    };

    const toggleScheme = (key: string) => {
        if (diseaseSchemes.includes(key)) {
            setDiseaseSchemes(prev => prev.filter(s => s !== key));
        } else {
            setDiseaseSchemes(prev => [...prev, key]);
        }
    };

    // Helper to render label with amounts
    const sahOption = (level: string, daily: number) => {
        return `Level ${level} - $${daily.toFixed(2)}/day ($${(daily * 365).toLocaleString()}/yr)`;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex overflow-hidden animate-in zoom-in duration-200 h-[85vh]">
                
                {/* Left: Comprehensive Form */}
                <div className="w-2/3 p-8 overflow-y-auto border-r border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">New Client Profile</h3>
                            <p className="text-xs text-slate-500">Configure comprehensive funding sources.</p>
                        </div>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Manual Entry</span>
                    </div>

                    {/* Missing Data Alert */}
                    {missingInfo.length > 0 && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-sm font-bold text-amber-800">Missing Information Detected</h4>
                                <p className="text-xs text-amber-700 mt-1">The AI could not find the following fields in the uploaded document:</p>
                                <ul className="list-disc pl-4 mt-2 text-xs text-amber-800 space-y-1">
                                    {missingInfo.map((info, idx) => (
                                        <li key={idx}>{info}</li>
                                    ))}
                                </ul>
                                <button onClick={() => setMissingInfo([])} className="text-xs font-bold text-amber-700 underline mt-2 hover:text-amber-900">Dismiss</button>
                            </div>
                        </div>
                    )}
                    
                    <form id="add-client-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. Basic Details */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <User size={16} /> Personal Details
                            </h4>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm bg-white text-slate-900" placeholder="e.g. John Doe" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm bg-white text-slate-900" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
                                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm bg-white text-slate-900" placeholder="0400..." />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gov / Integration ID</label>
                                    <input type="text" value={integrationId} onChange={e => setIntegrationId(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm bg-white text-slate-900" placeholder="e.g. NDIS Number or Aged Care ID" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plan Renewal Date</label>
                                    <input type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm bg-white text-slate-900" />
                                </div>
                            </div>
                        </div>
                        
                        {/* 2. Support at Home & MMM */}
                        <div className="space-y-4 pt-4">
                            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Calculator size={16} /> Support at Home & Location
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SAH Classification (Daily Rates)</label>
                                    <select value={sahLevel} onChange={e => setSahLevel(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm bg-white text-slate-900">
                                        <option value="">None / Self-Funded</option>
                                        <option value="SAH_LEVEL_1">{sahOption('1', GOV_FUNDING_DATA.SAH_DAILY_RATES.SAH_LEVEL_1)}</option>
                                        <option value="SAH_LEVEL_2">{sahOption('2', GOV_FUNDING_DATA.SAH_DAILY_RATES.SAH_LEVEL_2)}</option>
                                        <option value="SAH_LEVEL_3">{sahOption('3', GOV_FUNDING_DATA.SAH_DAILY_RATES.SAH_LEVEL_3)}</option>
                                        <option value="SAH_LEVEL_4">{sahOption('4', GOV_FUNDING_DATA.SAH_DAILY_RATES.SAH_LEVEL_4)}</option>
                                        <option value="SAH_LEVEL_5">{sahOption('5', GOV_FUNDING_DATA.SAH_DAILY_RATES.SAH_LEVEL_5)}</option>
                                        <option value="SAH_LEVEL_6">{sahOption('6', GOV_FUNDING_DATA.SAH_DAILY_RATES.SAH_LEVEL_6)}</option>
                                        <option value="SAH_LEVEL_7">{sahOption('7', GOV_FUNDING_DATA.SAH_DAILY_RATES.SAH_LEVEL_7)}</option>
                                        <option value="SAH_LEVEL_8">{sahOption('8', GOV_FUNDING_DATA.SAH_DAILY_RATES.SAH_LEVEL_8)}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">MMM Remoteness (1-7)</label>
                                    <select value={mmmLevel} onChange={e => setMmmLevel(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm bg-white text-slate-900">
                                        <option value="1">MMM 1 - Major Cities (100%)</option>
                                        <option value="2">MMM 2 - Regional (100%)</option>
                                        <option value="3">MMM 3 - Regional (100%)</option>
                                        <option value="4">MMM 4 - Rural (100%)</option>
                                        <option value="5">MMM 5 - Remote (115%)</option>
                                        <option value="6">MMM 6 - Remote (140%)</option>
                                        <option value="7">MMM 7 - Very Remote (150%)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 3. Specific Funding Supplements */}
                        <div className="space-y-4 pt-4">
                            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Plus size={16} /> Specific Funding Supplements
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'dementia_cognition', label: 'Dementia & Cognition' },
                                    { id: 'oxygen', label: 'Oxygen Supplement' },
                                    { id: 'enteral_feeding', label: 'Enteral Feeding' },
                                    { id: 'veterans_supplement', label: 'Veterans Supplement' },
                                    { id: 'assistive_tech_high', label: 'Assistive Tech (> $1500)' },
                                    { id: 'palliative_care', label: 'Palliative Care Pathway' },
                                    { id: 'restorative_care', label: 'Restorative (STRC)' },
                                ].map(sup => (
                                    <label key={sup.id} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${supplements.includes(sup.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={supplements.includes(sup.id)}
                                            onChange={() => toggleSupplement(sup.id)}
                                            className="w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <span className="text-xs font-medium text-slate-700">{sup.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 4. Disease Specific Schemes */}
                        <div className="space-y-4 pt-4">
                            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Stethoscope size={16} /> Disease Specific Schemes
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(GOV_FUNDING_DATA.DISEASE_SCHEMES).map(([key, label]) => (
                                    <label key={key} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${diseaseSchemes.includes(key) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={diseaseSchemes.includes(key)}
                                            onChange={() => toggleScheme(key)}
                                            className="w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <span className="text-xs font-medium text-slate-700">{label}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 italic">Checking these ensures AI audits against "Double Dipping" (e.g. buying stoma bags with Package funds when covered by SAS).</p>
                        </div>

                        {/* 5. Special Eligibility & DVA */}
                        <div className="space-y-4 pt-4">
                            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Award size={16} /> Special Eligibility & DVA
                            </h4>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">DVA Card Status</label>
                                    <div className="flex gap-2">
                                        {['GOLD', 'WHITE', 'ORANGE'].map(card => (
                                            <button
                                                key={card}
                                                type="button"
                                                onClick={() => setDvaCard(dvaCard === card ? '' : card)}
                                                className={`flex-1 py-2 text-xs font-bold rounded border transition-all ${
                                                    dvaCard === card 
                                                        ? (card === 'GOLD' ? 'bg-amber-300 text-amber-900 border-amber-400' : card === 'WHITE' ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-orange-300 text-orange-900 border-orange-400')
                                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {card}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">AI will reference card color for dual funding eligibility.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={isIndigenous} onChange={e => setIsIndigenous(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                                        <span className="text-xs font-medium text-slate-700">Indigenous / Aboriginal Status</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={isClaimsConference} onChange={e => setIsClaimsConference(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                                        <span className="text-xs font-medium text-slate-700">Claims Conference (Holocaust Survivor)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                                        <span className="text-xs font-medium text-slate-700">Private / Self-Funded Top-up</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Right: AI & Calculations */}
                <div className="w-1/3 bg-slate-50 flex flex-col border-l border-slate-200">
                    {/* Live Calculator */}
                    <div className="p-6 bg-white border-b border-slate-200">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Total Available Funding</h4>
                        <div className="flex items-end gap-1 mb-2">
                            <span className="text-3xl font-bold text-slate-800">${annualFunding.toLocaleString()}</span>
                            <span className="text-sm text-slate-500 font-medium mb-1.5">/ year</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                ${dailyFunding.toFixed(2)} / day
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Includes Base SAH Daily Rate + MMM {mmmLevel} Loading ({((GOV_FUNDING_DATA.MMM_LOADINGS[mmmLevel as any] || 1) - 1) * 100}%) + {supplements.length} Daily Supplements.
                        </p>
                    </div>

                    {/* AI Upload Area */}
                    <div className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                    <Sparkles size={18} className="text-indigo-600" /> AI Auto-Fill
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Upload Care Plan/Intake to auto-populate funding.</p>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                        </div>

                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-6 group max-h-64"
                        >
                            {isAnalyzing ? (
                                <div className="space-y-4">
                                    <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto" />
                                    <p className="text-sm font-medium text-indigo-800">Reading document...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                        <Upload size={32} className="text-indigo-500" />
                                    </div>
                                    <h4 className="font-bold text-slate-700">Drop Care Plan Here</h4>
                                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                                        PDF, Word, Excel supported.
                                    </p>
                                </>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".pdf,.docx,.xlsx,.doc" 
                                onChange={handleFile} 
                            />
                        </div>

                        <div className="mt-auto pt-6 flex justify-end gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                            <button 
                                type="submit" 
                                form="add-client-form" 
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 text-sm"
                            >
                                Create Client
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FileText(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
}

export default ClientList;
