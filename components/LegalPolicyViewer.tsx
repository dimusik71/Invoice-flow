
import React from 'react';
import { X, Shield, Lock, FileText, Globe } from 'lucide-react';
import DOMPurify from 'dompurify';

export type PolicyType = 'privacy' | 'tos' | 'security';

interface LegalPolicyViewerProps {
  isOpen: boolean;
  onClose: () => void;
  type: PolicyType;
}

const POLICY_CONTENT = {
  privacy: {
    title: "Privacy Policy (Australian Privacy Principles)",
    lastUpdated: "October 28, 2023",
    icon: Shield,
    content: `
      <h3 class="font-bold text-lg mb-2">1. Introduction</h3>
      <p class="mb-4">InvoiceFlow ("we", "us") is committed to protecting your privacy and complying with the <strong>Privacy Act 1988 (Cth)</strong> and the <strong>Australian Privacy Principles (APPs)</strong>. This policy explains how we manage personal information.</p>

      <h3 class="font-bold text-lg mb-2">2. Collection of Personal Information</h3>
      <p class="mb-4">We collect information necessary to provide automated invoice processing and NDIS/HCP compliance auditing. This includes:</p>
      <ul class="list-disc pl-5 mb-4 space-y-1">
        <li>Names and contact details of suppliers and clients (Support at Home participants).</li>
        <li>Financial data (invoices, ABNs, bank details).</li>
        <li>Sensitive health information (only where contained within invoice line item descriptions, e.g., "Nursing Care").</li>
      </ul>

      <h3 class="font-bold text-lg mb-2">3. Data Sovereignty & Storage</h3>
      <p class="mb-4">All production data is stored securely within <strong>Australia (Sydney Region)</strong> to ensure data sovereignty. We utilize enterprise-grade cloud infrastructure with encryption at rest (AES-256) and in transit (TLS 1.2+).</p>

      <h3 class="font-bold text-lg mb-2">4. Use and Disclosure</h3>
      <p class="mb-4">We do not sell your data. We only disclose information to:</p>
      <ul class="list-disc pl-5 mb-4 space-y-1">
        <li>Your authorized software integrations (e.g., Xero, AlayaCare, The Lookout Way).</li>
        <li>Our AI processors (Google Gemini), under strict data processing agreements that prohibit training on your data.</li>
        <li>Law enforcement, where required by Australian law.</li>
      </ul>

      <h3 class="font-bold text-lg mb-2">5. Notifiable Data Breaches (NDB) Scheme</h3>
      <p class="mb-4">In the event of a data breach likely to result in serious harm, we will notify affected individuals and the Office of the Australian Information Commissioner (OAIC) in accordance with the NDB scheme.</p>

      <h3 class="font-bold text-lg mb-2">6. Access and Correction</h3>
      <p class="mb-4">You have the right to access and correct your personal information. Please contact our Privacy Officer at privacy@invoiceflow.com.au.</p>
    `
  },
  tos: {
    title: "Terms of Service",
    lastUpdated: "January 15, 2024",
    icon: FileText,
    content: `
      <h3 class="font-bold text-lg mb-2">1. Acceptance of Terms</h3>
      <p class="mb-4">By accessing InvoiceFlow, you agree to be bound by these Terms of Service and all applicable laws of Australia.</p>

      <h3 class="font-bold text-lg mb-2">2. Service Usage</h3>
      <p class="mb-4">You act as the Data Controller for all information uploaded. You warrant that you have obtained necessary consents from clients (Support at Home participants) to process their invoices using automated tools.</p>

      <h3 class="font-bold text-lg mb-2">3. AI Reliability</h3>
      <p class="mb-4">InvoiceFlow uses Artificial Intelligence to assist in auditing. <strong>AI output is advisory only.</strong> The final decision to approve payment rests with you. We adhere to the Australian AI Ethics Principles but do not guarantee 100% accuracy.</p>

      <h3 class="font-bold text-lg mb-2">4. Liability</h3>
      <p class="mb-4">To the extent permitted by Australian Consumer Law, InvoiceFlow's liability is limited to the resupply of services or refund of fees paid.</p>

      <h3 class="font-bold text-lg mb-2">5. Termination</h3>
      <p class="mb-4">We reserve the right to terminate access for violation of acceptable use policies, including uploading illegal content or attempting to reverse-engineer the platform.</p>
    `
  },
  security: {
    title: "Security Statement",
    lastUpdated: "February 1, 2024",
    icon: Lock,
    content: `
      <h3 class="font-bold text-lg mb-2">1. Infrastructure Security</h3>
      <p class="mb-4">Our infrastructure is hosted on AWS (Sydney Region). We employ VPC isolation, WAF (Web Application Firewalls), and regular automated vulnerability scanning.</p>

      <h3 class="font-bold text-lg mb-2">2. Data Encryption</h3>
      <p class="mb-4"><strong>At Rest:</strong> All databases and file storage are encrypted using AES-256.</p>
      <p class="mb-4"><strong>In Transit:</strong> All communications are encrypted via TLS 1.2 or higher.</p>

      <h3 class="font-bold text-lg mb-2">3. Access Control</h3>
      <p class="mb-4">We enforce strict Role-Based Access Control (RBAC). Multi-Factor Authentication (MFA) is enforced for all administrative access.</p>

      <h3 class="font-bold text-lg mb-2">4. Compliance</h3>
      <p class="mb-4">We align with <strong>ISO 27001</strong> controls and the <strong>ACSC Essential Eight</strong> maturity model (Level 2).</p>
    `
  }
};

const LegalPolicyViewer: React.FC<LegalPolicyViewerProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const policy = POLICY_CONTENT[type];
  const Icon = policy.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Icon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{policy.title}</h2>
              <p className="text-xs text-slate-500">Effective Date: {policy.lastUpdated}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto text-sm text-slate-600 leading-relaxed space-y-4 font-sans">
           <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(policy.content) }} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between items-center text-xs text-slate-500">
           <div className="flex items-center gap-1.5">
              <Globe size={12} />
              <span>Governing Law: New South Wales, Australia</span>
           </div>
           <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors">
             Close Document
           </button>
        </div>
      </div>
    </div>
  );
};

export default LegalPolicyViewer;
