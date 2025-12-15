
import React, { useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

interface FloatingAgentProps {
  apiKey: string;
}

const FloatingAgent: React.FC<FloatingAgentProps> = ({ apiKey }) => {
  const { history, isLoading, isOpen, setIsOpen, sendMessage, clearHistory } = useChat();
  const [input, setInput] = React.useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input, apiKey);
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 z-50 group"
        title="Chat with Marcus (AI Support)"
      >
        <Bot size={28} />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 border border-slate-200 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white border-2 border-slate-800">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Marcus</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Support Specialist
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
           <button onClick={clearHistory} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors" title="Reset Chat">
              <Trash2 size={16} />
           </button>
           <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
              <X size={20} />
           </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div 
               className={`max-w-[85%] p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                 msg.role === 'user' 
                   ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-md' 
                   : 'bg-white text-slate-700 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm'
               }`}
             >
               {msg.text}
             </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-bold text-indigo-600">
                <Loader2 size={14} className="animate-spin" /> Marcus is thinking...
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about compliance, errors, or legislation..."
            className="w-full pl-4 pr-12 py-3 bg-white text-black border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-12 min-h-[48px] max-h-32 transition-all scrollbar-hide"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-slate-300 transition-colors shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2">
           AI advice does not constitute formal legal counsel.
        </p>
      </div>
    </div>
  );
};

export default FloatingAgent;
