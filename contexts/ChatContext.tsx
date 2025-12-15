
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { consultAccountantSupport } from '../services/geminiService';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface ChatContextType {
  history: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sendMessage: (text: string, apiKey: string) => Promise<void>;
  clearHistory: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: "Good day. I am Marcus, your Senior Systems Support Specialist. I am here to assist with InvoiceFlow configuration, reconciliation queries, and legislative compliance regarding the GST Act or NDIS Pricing Arrangements. How may I assist you?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = async (text: string, apiKey: string) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date() };
    setHistory(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Prepare history for API (strip timestamps)
      const apiHistory = history.map(h => ({ role: h.role, text: h.text }));
      
      const responseText = await consultAccountantSupport(apiHistory, text, apiKey);
      
      const modelMsg: ChatMessage = { 
        role: 'model', 
        text: responseText || "I apologize, but I am unable to retrieve the necessary compliance data at this moment.",
        timestamp: new Date()
      };
      
      setHistory(prev => [...prev, modelMsg]);
    } catch (error) {
      setHistory(prev => [...prev, { 
        role: 'model', 
        text: "System Error: My connection to the knowledge base has been interrupted.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([{ 
      role: 'model', 
      text: "Conversation reset. How can I help you with your accounting workflows today?",
      timestamp: new Date()
    }]);
  };

  return (
    <ChatContext.Provider value={{ history, isLoading, isOpen, setIsOpen, sendMessage, clearHistory }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
