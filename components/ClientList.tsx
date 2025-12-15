
import React, { useState } from 'react';
import { Client } from '../types';
import { Search, Filter, RefreshCw, ChevronRight, User, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import ClientDetail from './ClientDetail';

interface ClientListProps {
  clients: Client[];
  onUpdateClient: (client: Client) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onUpdateClient }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSyncLookout = () => {
    setIsSyncing(true);
    // Simulate API delay
    setTimeout(() => {
        setIsSyncing(false);
        alert("Successfully synced 14 updated records from Lookout.");
    }, 2000);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedClient) {
      return <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} onUpdate={onUpdateClient} />;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Client Management</h2>
          <p className="text-slate-500">Manage care plans, budgets, and integration settings.</p>
        </div>
        <button 
          onClick={handleSyncLookout}
          disabled={isSyncing}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all active:scale-95 disabled:opacity-70"
        >
          <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Lookout Data'}</span>
        </button>
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
      </div>
    </div>
  );
};

// Missing icon import shim
function FileText(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
}

export default ClientList;
