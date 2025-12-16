
import React, { useState } from 'react';
import { Terminal, Database, Play, AlertTriangle, X, RefreshCw, Zap, Bug, Trash2 } from 'lucide-react';
import { Invoice } from '../types';
import { checkDatabaseConnection } from '../services/dbService';

interface DevToolsPanelProps {
  onSeedData: () => void;
  onClearData: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DevToolsPanel: React.FC<DevToolsPanelProps> = ({ onSeedData, onClearData, isOpen, setIsOpen }) => {
  const [logs, setLogs] = useState<string[]>(['> DevTools initialized...', '> Waiting for input...']);
  const [simulateLatency, setSimulateLatency] = useState(false);
  const [errorRate, setErrorRate] = useState(0);

  const addLog = (msg: string) => {
      setLogs(prev => [`> ${msg}`, ...prev].slice(0, 10));
  };

  const handleAction = (name: string, action: () => void) => {
      addLog(`Executing: ${name}`);
      action();
      addLog(`Completed: ${name}`);
  };

  const handleTestConnection = async () => {
      addLog(`Testing Supabase Connection...`);
      const result = await checkDatabaseConnection();
      if (result.success) {
          addLog(`SUCCESS: ${result.message}`);
      } else {
          addLog(`FAILURE: ${result.message}`);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-6 top-24 w-80 bg-slate-900 border border-purple-500/30 rounded-xl shadow-2xl z-40 overflow-hidden animate-in slide-in-from-right-10 font-mono text-sm text-slate-200">
        <div className="bg-slate-950 p-3 border-b border-purple-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Terminal size={16} />
                <span>BETA LAB CONTROLS</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-6">
            
            {/* Data Management */}
            <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Data Seeding</h4>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => handleAction('Seed Test Invoices', onSeedData)}
                        className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-2 rounded-md transition-colors text-xs"
                    >
                        <Database size={14} /> Seed Data
                    </button>
                    <button 
                         onClick={() => handleAction('Purge DB', onClearData)}
                         className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-md transition-colors text-xs"
                    >
                        <Trash2 size={14} /> Purge DB
                    </button>
                </div>
                <button 
                    onClick={handleTestConnection}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-md transition-colors text-xs"
                >
                    <RefreshCw size={14} /> Test DB Connection
                </button>
            </div>

            {/* Simulation */}
            <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Simulation</h4>
                <div className="space-y-2">
                    <label className="flex items-center justify-between p-2 rounded bg-slate-800/50 cursor-pointer hover:bg-slate-800">
                        <span className="flex items-center gap-2"><RefreshCw size={14} className="text-blue-400" /> API Latency (2s)</span>
                        <input type="checkbox" checked={simulateLatency} onChange={(e) => setSimulateLatency(e.target.checked)} className="accent-purple-500" />
                    </label>
                    <div className="p-2 rounded bg-slate-800/50">
                        <div className="flex justify-between mb-1">
                            <span className="flex items-center gap-2"><Bug size={14} className="text-amber-400" /> Error Rate</span>
                            <span>{errorRate}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="50" 
                            value={errorRate} 
                            onChange={(e) => setErrorRate(Number(e.target.value))} 
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                </div>
            </div>

            {/* Feature Flags */}
            <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Experimental Flags</h4>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400 opacity-50 cursor-not-allowed">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                        <span>Multi-Tenant Sync (WIP)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                         <span>Gemini 3 Pro Audit (Active)</span>
                    </div>
                </div>
            </div>

            {/* Console Output */}
            <div className="bg-black/50 p-2 rounded border border-slate-800 h-24 overflow-y-auto text-[10px] font-mono text-slate-400">
                {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
            </div>

        </div>
    </div>
  );
};

export default DevToolsPanel;
