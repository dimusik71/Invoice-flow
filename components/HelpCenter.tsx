
import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Search, Zap, Shield, FileText, Settings, PlayCircle, HelpCircle, ChevronRight, MessageSquare, Key, Layout, CheckCircle, Bot, Send, User, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

interface HelpCenterProps {
  apiKeyOverride?: string;
  initialCategory?: string;
}

const HelpCenter: React.FC<HelpCenterProps> = ({ apiKeyOverride, initialCategory = 'getting-started' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  // Use Shared Chat Context
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
    { id: 'ai-agent', label: 'Specialist Support', icon: Bot },
    { id: 'getting-started', label: 'Getting Started', icon: PlayCircle },
    { id: 'ai-features', label: 'AI Features', icon: Zap },
    { id: 'workflow', label: 'Invoice Workflow', icon: FileText },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'security', label: 'Security & Compliance', icon: Shield },
  ];

  const content: Record<string, any[]> = {
    'getting-started': [
      {
        title: "Setting up your Profile",
        body: "Your profile determines your role (Admin, Officer, Viewer). Navigate to Settings to update your display name and email notifications preferences. Ensure your Organization details are correct in the Tenant Settings."
      },
      {
        title: "Connecting your API Keys",
        body: "To enable the 'Nano Banana' AI features, you must provide a Google Gemini API Key. Go to Configuration > Integrations and paste your key starting with 'AIza'. This key is stored locally in your browser for security."
      },
      {
        title: "Connecting to Storage",
        body: "InvoiceFlow supports OneDrive and Google Drive. In the Configuration tab, authenticate with your provider to enable automatic PDF archiving. A folder named '/InvoiceFlow' will be created automatically."
      }
    ],
    'ai-features': [
      {
        title: "Deep Audit Explained",
        body: "The AI Deep Audit checks price reasonableness, fraud indicators, and policy compliance. It reads your uploaded PDF policies and cross-references line items. A risk score (0-100) is assigned based on these findings."
      },
      {
        title: "Supplier Verification",
        body: "Click the 'Verify' button next to a supplier name to run a live web check. The AI searches for the business's online presence, checks for ABN consistency, and summarizes its services."
      },
      {
        title: "Spending Analysis",
        body: "On the Budget tab, the AI analyzes the client's spending velocity. It flags 'Overspend Risk' if the budget is depleting too fast, or 'Underspend Risk' if funds are likely to expire unused."
      }
    ],
    'workflow': [
      {
        title: "Scanning Invoices",
        body: "Click 'Scan Invoice' in the sidebar to upload a PDF or Image. The system extracts data using OCR and immediately runs validation rules. You can edit extracted fields before approval."
      },
      {
        title: "Review Queue",
        body: "Invoices with a HIGH or MEDIUM risk score are sent to the 'Needs Review' queue. These require manual sign-off. Low risk invoices can be auto-approved based on your settings."
      },
      {
        title: "Xero Posting",
        body: "Once an invoice is approved, it is automatically posted to Xero as a 'Draft Bill'. Ensure your Xero tenant ID is connected in the Settings tab."
      }
    ]
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 text-center shrink-0">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Help & Support Center</h2>
        <p className="text-slate-500">Documentation, Guides, and Specialist Assistance</p>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Sidebar Navigation */}
        <div className="col-span-12 md:col-span-3 space-y-2 overflow-y-auto pr-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all text-left ${
                  activeCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-white hover:shadow-sm bg-slate-50 border border-transparent hover:border-slate-200'
                }`}
              >
                <Icon size={18} className={activeCategory === cat.id ? 'text-white' : 'text-slate-400'} />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="col-span-12 md:col-span-9 h-full flex flex-col">
           <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden ${activeCategory === 'ai-agent' ? 'p-0' : 'p-8'}`}>
              
              {activeCategory === 'ai-agent' ? (
                  // AI Agent Chat Interface
                  <div className="flex flex-col h-full">
                      {/* Chat Header */}
                      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
                              <Bot size={20} />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-800">Marcus</h3>
                              <p className="text-xs text-slate-500">Senior Software Support Specialist • 20+ Yrs Exp</p>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                              <button onClick={clearHistory} className="text-xs flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 rounded bg-slate-100 hover:bg-rose-50">
                                <Trash2 size={12} /> Clear
                              </button>
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Online
                              </span>
                          </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                          {history.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white shadow-md'}`}>
                                          {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                      </div>
                                      <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                                          msg.role === 'user' 
                                            ? 'bg-white text-slate-700 border border-slate-200 rounded-tr-none' 
                                            : 'bg-indigo-600 text-white rounded-tl-none shadow-indigo-100'
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
                                      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-indigo-600 text-xs font-bold">
                                          <Loader2 size={14} className="animate-spin" /> Marcus is analyzing your request...
                                      </div>
                                  </div>
                              </div>
                          )}
                          <div ref={chatEndRef} />
                      </div>

                      {/* Input Area */}
                      <div className="p-4 bg-white border-t border-slate-200">
                          <div className="relative">
                              <input 
                                  type="text" 
                                  value={input}
                                  onChange={(e) => setInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                  placeholder="Ask Marcus about invoice errors, Xero sync, or audit flags..."
                                  className="w-full pl-4 pr-12 py-3.5 bg-white text-black border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                              />
                              <button 
                                  onClick={handleSend}
                                  disabled={!input.trim() || isLoading}
                                  className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
                              >
                                  <Send size={18} />
                              </button>
                          </div>
                          <p className="text-[10px] text-center text-slate-400 mt-2">
                              AI Support Agent may occasionally provide general advice. Always consult your internal compliance team for critical financial decisions.
                          </p>
                      </div>
                  </div>
              ) : (
                  // Static Help Content
                  <>
                      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                         {categories.find(c => c.id === activeCategory)?.label}
                      </h3>

                      <div className="space-y-8 overflow-y-auto pr-2">
                         {content[activeCategory] ? (
                            content[activeCategory].map((article, idx) => (
                              <div key={idx} className="group">
                                 <h4 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">{idx + 1}</span>
                                    {article.title}
                                 </h4>
                                 <p className="text-slate-600 leading-relaxed text-sm pl-8">
                                    {article.body}
                                 </p>
                              </div>
                            ))
                         ) : (
                            <div className="text-center py-12 text-slate-400">
                               <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                               <p>Select a category to view documentation or chat with our AI Support Specialist.</p>
                            </div>
                         )}
                      </div>
                  </>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
