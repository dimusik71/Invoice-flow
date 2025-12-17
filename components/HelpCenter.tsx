
import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Search, Zap, Shield, FileText, Settings, PlayCircle, HelpCircle, ChevronRight, MessageSquare, Key, Layout, CheckCircle, Bot, Send, User, Sparkles, Loader2, Trash2, ArrowLeft, ExternalLink, AlertTriangle } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

interface HelpCenterProps {
  apiKeyOverride?: string;
  initialCategory?: string;
}

// --- KNOWLEDGE BASE DATA ---
const KNOWLEDGE_BASE: Record<string, { id: string; title: string; description: string; content: React.ReactNode }[]> = {
  'getting-started': [
    {
      id: 'gs-1',
      title: "Platform Overview & Roles",
      description: "Understanding the difference between Admins, Officers, and Viewers.",
      content: (
        <div className="space-y-4">
          <p>InvoiceFlow is designed with strict Role-Based Access Control (RBAC) to ensure security and operational efficiency.</p>
          
          <h4 className="font-bold text-slate-800 mt-4">User Roles</h4>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li><strong>Superuser:</strong> Global system administrator with access to all tenants, audit logs, and global configuration. Cannot be assigned to standard staff.</li>
            <li><strong>Administrator:</strong> Full access to a specific Organisation (Tenant). Can manage users, edit settings, and approve high-risk invoices.</li>
            <li><strong>Officer:</strong> Operational staff. Can scan invoices, review low/medium risk items, and manage client files. Cannot change system configuration.</li>
            <li><strong>Viewer:</strong> Read-only access. Useful for external auditors or management review.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'gs-2',
      title: "Connecting Integrations",
      description: "How to setup Xero, AlayaCare, and Lookout.",
      content: (
        <div className="space-y-4">
          <p>To automate data flow, you must connect your external systems in the <strong>Configuration</strong> tab.</p>
          
          <h4 className="font-bold text-slate-800 mt-4">1. Xero Integration</h4>
          <p>We sync invoices as "Draft Bills". Ensure your Chart of Accounts is mapped correctly. A standard "Sync" runs every 15 minutes, or can be triggered manually.</p>

          <h4 className="font-bold text-slate-800 mt-4">2. Care Management Systems (Lookout/AlayaCare)</h4>
          <p>We require an API Key to fetch:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>Active Client Lists</li>
            <li>Purchase Orders / Budgets</li>
            <li>Approved Service Codes</li>
          </ul>
          <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-800 text-sm mt-2">
            <strong>Note:</strong> If a client exists in InvoiceFlow but not in your CMS, their invoices will be flagged as "Unknown Client" and require manual linking.
          </div>
        </div>
      )
    }
  ],
  'ai-features': [
    {
      id: 'ai-1',
      title: "Understanding Risk Scores",
      description: "How the AI calculates risk from 0 to 100.",
      content: (
        <div className="space-y-4">
          <p>Every invoice undergoes a "Deep Audit" using the Gemini 3 Pro model. The score reflects the probability of non-compliance or error.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="font-bold text-emerald-700 block mb-1">Low Risk (0-29)</span>
              <p className="text-xs text-emerald-800">Routine transaction. Matches PO, Price Guide, and historical patterns. Eligible for Auto-Approval.</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <span className="font-bold text-amber-700 block mb-1">Medium Risk (30-69)</span>
              <p className="text-xs text-amber-800">Minor anomalies. E.g., Price slightly above benchmark, missing ABN format, or weekend surcharge on a Friday.</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-lg border border-rose-100">
              <span className="font-bold text-rose-700 block mb-1">High Risk (70-100)</span>
              <p className="text-xs text-rose-800">Critical issues. Fraud indicators, budget exceeded, unauthorized service type, or suspended supplier.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-2',
      title: "Prompt Tuning",
      description: "Customizing how the AI audits your invoices.",
      content: (
        <div className="space-y-4">
          <p>You can adjust the "Personality" and "Strictness" of the AI in <strong>Settings &gt; AI Prompt Tuning</strong>.</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li><strong>Price Reasonableness:</strong> Define your specific hourly caps (e.g., "Flag cleaning &gt; $60/hr").</li>
            <li><strong>Fraud Indicators:</strong> Add specific keywords to watch for (e.g., "Consulting", "Miscellaneous").</li>
            <li><strong>Policy Documents:</strong> Upload your internal PDF policies. The AI reads these and will cite specific page numbers if an invoice violates a clause.</li>
          </ul>
        </div>
      )
    }
  ],
  'workflow': [
    {
      id: 'wf-1',
      title: "The Approval Lifecycle",
      description: "From 'Received' to 'Posted to Xero'.",
      content: (
        <div className="space-y-4">
          <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pl-6 py-2">
            <div className="relative">
              <span className="absolute -left-[31px] top-0 w-6 h-6 bg-slate-100 rounded-full border-2 border-slate-300"></span>
              <h4 className="font-bold text-slate-800">1. Ingestion</h4>
              <p className="text-sm text-slate-600">Invoice arrives via Email or Drag-and-Drop. OCR extracts data.</p>
            </div>
            <div className="relative">
              <span className="absolute -left-[31px] top-0 w-6 h-6 bg-blue-100 rounded-full border-2 border-blue-500"></span>
              <h4 className="font-bold text-slate-800">2. System Validation</h4>
              <p className="text-sm text-slate-600">Checks PO existence, budget availability, and ABN status against live databases.</p>
            </div>
            <div className="relative">
              <span className="absolute -left-[31px] top-0 w-6 h-6 bg-purple-100 rounded-full border-2 border-purple-500"></span>
              <h4 className="font-bold text-slate-800">3. AI Deep Audit</h4>
              <p className="text-sm text-slate-600">Gemini 3 Pro analyzes context, fraud risk, and policy compliance.</p>
            </div>
            <div className="relative">
              <span className="absolute -left-[31px] top-0 w-6 h-6 bg-emerald-100 rounded-full border-2 border-emerald-500"></span>
              <h4 className="font-bold text-slate-800">4. Approval / Rejection</h4>
              <p className="text-sm text-slate-600">Officer reviews High/Medium risk items. Approved items sync to Xero.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'wf-2',
      title: "Handling Rejections",
      description: "Using AI to draft vendor and client communications.",
      content: (
        <div className="space-y-4">
          <p>When you click <strong>Reject</strong> on an invoice, the system generates two draft emails:</p>
          <ol className="list-decimal pl-5 space-y-2 text-slate-700">
            <li><strong>Vendor Email:</strong> Technical, citing specific missing details (e.g., "Invalid Tax Code") and requesting a credit note.</li>
            <li><strong>Client Email:</strong> Empathetic, simple language explaining why the funds couldn't be used (e.g., "This service isn't covered by your plan").</li>
          </ol>
          <p className="mt-2">You can edit these drafts before sending. The system logs the rejection reason for future audits.</p>
        </div>
      )
    }
  ],
  'compliance': [
    {
      id: 'comp-1',
      title: "B2G Reporting (PRODA)",
      description: "Submitting claims to Services Australia.",
      content: (
        <div className="space-y-4">
          <p>The <strong>B2G Compliance</strong> tab allows you to digitize and fill government forms (e.g., NDIS Payment Requests) using invoice data.</p>
          <h4 className="font-bold text-slate-800 mt-4">Steps:</h4>
          <ol className="list-decimal pl-5 space-y-1 text-slate-700">
            <li>Upload a blank PDF form template.</li>
            <li>Select an invoice to map data from.</li>
            <li>Run the "Superagent Auditor" to check for missing fields or logic errors.</li>
            <li>Submit directly via API (if PRODA keys are configured).</li>
          </ol>
        </div>
      )
    }
  ]
};

const HelpCenter: React.FC<HelpCenterProps> = ({ apiKeyOverride, initialCategory = 'getting-started' }) => {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  useEffect(() => {
    setActiveCategory(initialCategory);
    setSelectedArticleId(null);
  }, [initialCategory]);

  // Chat Context
  const { history, isLoading, sendMessage, clearHistory } = useChat();
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCategory === 'ai-agent') {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, activeCategory]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    if (apiKeyOverride) {
      sendMessage(userMsg, apiKeyOverride);
    }
  };

  const categories = [
    { id: 'ai-agent', label: 'Specialist Support', icon: Bot, description: "Chat with Marcus" },
    { id: 'getting-started', label: 'Getting Started', icon: PlayCircle, description: "Setup and roles" },
    { id: 'ai-features', label: 'AI Features', icon: Zap, description: "Risk scoring and logic" },
    { id: 'workflow', label: 'Invoice Workflow', icon: FileText, description: "Processing cycle" },
    { id: 'compliance', label: 'B2G Compliance', icon: Shield, description: "Government reporting" },
  ];

  // Helper to find current article
  const currentArticle = selectedArticleId 
    ? KNOWLEDGE_BASE[activeCategory]?.find(a => a.id === selectedArticleId)
    : null;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fade-in h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="text-indigo-600" size={32} />
                Help & Support Center
            </h2>
            <p className="text-slate-500 mt-1">Documentation, Guides, and Specialist Assistance</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Sidebar Navigation */}
        <div className="col-span-12 md:col-span-3 space-y-2 overflow-y-auto pr-2 border-r border-slate-100">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSelectedArticleId(null); }}
                className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all text-left group ${
                  activeCategory === cat.id 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                    : 'text-slate-600 hover:bg-white hover:shadow-md bg-slate-50 border border-transparent hover:border-slate-100'
                }`}
              >
                <div className={`p-2 rounded-lg ${activeCategory === cat.id ? 'bg-white/10' : 'bg-white shadow-sm group-hover:text-blue-600'}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <span className="block font-bold text-sm">{cat.label}</span>
                    <span className={`text-xs ${activeCategory === cat.id ? 'text-slate-400' : 'text-slate-400'}`}>{cat.description}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Main Content Area */}
        <div className="col-span-12 md:col-span-9 h-full flex flex-col">
           <div className={`bg-white rounded-2xl border border-slate-200 shadow-xl flex-1 flex flex-col overflow-hidden ${activeCategory === 'ai-agent' ? 'p-0' : 'p-0'}`}>
              
              {activeCategory === 'ai-agent' ? (
                  // AI Agent Chat Interface
                  <div className="flex flex-col h-full bg-slate-50/50">
                      {/* Chat Header */}
                      <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-4 shadow-sm z-10">
                          <div className="relative">
                              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md border-2 border-white">
                                  <Bot size={24} />
                              </div>
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-900 text-lg">Marcus</h3>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-semibold">Support Specialist</span>
                                  <span>•</span>
                                  <span>Typical reply time: Instant</span>
                              </div>
                          </div>
                          <div className="ml-auto">
                              <button onClick={clearHistory} className="text-xs flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-full border border-slate-200 hover:bg-rose-50 hover:border-rose-200">
                                <Trash2 size={14} /> Reset Chat
                              </button>
                          </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                          {history.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white shadow-md'}`}>
                                          {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                      </div>
                                      <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                                          msg.role === 'user' 
                                            ? 'bg-slate-800 text-white rounded-tr-none' 
                                            : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                                      }`}>
                                          {msg.text}
                                      </div>
                                  </div>
                              </div>
                          ))}
                          {isLoading && (
                              <div className="flex justify-start">
                                  <div className="flex gap-3 max-w-[85%]">
                                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1 text-white shadow-md">
                                          <Bot size={16} />
                                      </div>
                                      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-indigo-600 text-xs font-bold animate-pulse">
                                          <Sparkles size={14} /> Marcus is thinking...
                                      </div>
                                  </div>
                              </div>
                          )}
                          <div ref={chatEndRef} />
                      </div>

                      {/* Input Area */}
                      <div className="p-4 bg-white border-t border-slate-200">
                          <div className="relative max-w-4xl mx-auto">
                              <input 
                                  type="text" 
                                  value={input}
                                  onChange={(e) => setInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                  placeholder="Ask Marcus about invoice errors, Xero sync, or audit flags..."
                                  className="w-full pl-5 pr-14 py-4 bg-slate-50 text-black border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                              />
                              <button 
                                  onClick={handleSend}
                                  disabled={!input.trim() || isLoading}
                                  className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm flex items-center justify-center"
                              >
                                  <Send size={20} />
                              </button>
                          </div>
                      </div>
                  </div>
              ) : selectedArticleId ? (
                  // Article Reading View
                  <div className="flex flex-col h-full bg-white">
                      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                          <button 
                            onClick={() => setSelectedArticleId(null)}
                            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                          >
                              <ArrowLeft size={20} />
                          </button>
                          <div>
                              <h3 className="text-xl font-bold text-slate-800">{currentArticle?.title}</h3>
                              <p className="text-xs text-slate-500">{categories.find(c => c.id === activeCategory)?.label} / Article</p>
                          </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
                          <div className="prose prose-slate prose-sm max-w-none">
                              {currentArticle?.content}
                          </div>

                          <div className="mt-10 pt-6 border-t border-slate-100 bg-indigo-50 rounded-xl p-6 flex items-center justify-between">
                              <div>
                                  <h4 className="font-bold text-indigo-900 text-sm">Still have questions?</h4>
                                  <p className="text-xs text-indigo-700 mt-1">Marcus can explain this topic further in context of your data.</p>
                              </div>
                              <button 
                                onClick={() => { setActiveCategory('ai-agent'); setInput(`Can you explain more about "${currentArticle?.title}"?`); }}
                                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                              >
                                  <Bot size={16} /> Ask Marcus
                              </button>
                          </div>
                      </div>
                  </div>
              ) : (
                  // Article List View
                  <div className="flex flex-col h-full bg-slate-50/30">
                      <div className="p-8 pb-4">
                          <div className="flex items-center gap-3 mb-6">
                              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                  {categories.find(c => c.id === activeCategory)?.icon({ size: 24, className: "text-indigo-600" })}
                              </div>
                              <div>
                                  <h3 className="text-2xl font-bold text-slate-800">
                                     {categories.find(c => c.id === activeCategory)?.label}
                                  </h3>
                                  <p className="text-slate-500 text-sm">Browse articles and guides</p>
                              </div>
                          </div>
                      </div>

                      <div className="px-8 pb-8 overflow-y-auto flex-1">
                         <div className="grid gap-4">
                             {KNOWLEDGE_BASE[activeCategory] ? (
                                KNOWLEDGE_BASE[activeCategory].map((article, idx) => (
                                  <button 
                                    key={idx} 
                                    onClick={() => setSelectedArticleId(article.id)}
                                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left group relative overflow-hidden"
                                  >
                                     <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                     <div className="flex justify-between items-start">
                                         <div>
                                             <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors">
                                                {article.title}
                                             </h4>
                                             <p className="text-slate-600 text-sm">
                                                {article.description}
                                             </p>
                                         </div>
                                         <div className="p-2 bg-slate-50 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                             <ChevronRight size={20} />
                                         </div>
                                     </div>
                                  </button>
                                ))
                             ) : (
                                <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                                   <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                                   <p>No articles found for this category.</p>
                                   <button 
                                      onClick={() => setActiveCategory('ai-agent')}
                                      className="mt-4 text-indigo-600 font-bold hover:underline text-sm"
                                   >
                                      Ask Marcus instead
                                   </button>
                                </div>
                             )}
                         </div>
                      </div>
                  </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
