
export enum InvoiceStatus {
  RECEIVED = 'RECEIVED',
  EXTRACTED = 'EXTRACTED',
  MATCHED = 'MATCHED',
  VALIDATED = 'VALIDATED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  APPROVED = 'APPROVED',
  POSTED_TO_XERO = 'POSTED_TO_XERO',
  FAILED = 'FAILED'
}

export enum ValidationSeverity {
  INFO = 'INFO',
  WARN = 'WARN',
  FAIL = 'FAIL'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export type NotificationTrigger = 'AUDIT_FAILED' | 'HIGH_RISK_DETECTED' | 'INVOICE_APPROVED' | 'INVOICE_REJECTED';

export interface NotificationRule {
  id: string;
  trigger: NotificationTrigger;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  recipients: string; // Comma separated emails
}

export interface EmailServiceConfig {
  provider: 'emailjs' | 'microsoft' | 'google';
  // EmailJS Specific
  serviceId?: string;
  templateId?: string;
  publicKey?: string;
  // OAuth Specific
  accessToken?: string;
  tokenExpiry?: number;
  userEmail?: string;
  clientId?: string; // Optional: User provided Client ID
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  targetId?: string; // e.g., Invoice ID to navigate to
  targetView?: string; // e.g., 'detail'
}

export interface TenantFeatures {
  aiAudit: boolean;
  xeroIntegration: boolean;
  poMatching: boolean;
  spendingAnalysis: boolean;
  emailIngestion: boolean;
}

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | 'BETA';

export interface DocumentSettings {
  headerText: string;
  subHeaderText: string;
  footerText: string;
  showLogo: boolean;
}

export interface TenantConfig {
  id: string;
  name: string;
  logoUrl?: string; // If undefined, uses text
  primaryColor: string; // Tailwind class-like hex or name, used for gradients
  secondaryColor: string;
  accentColor: string;
  features: TenantFeatures;
  status: TenantStatus;
  createdAt: string;
  documentSettings?: DocumentSettings;
}

export type UserRole = 'superuser' | 'admin' | 'officer' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string; // 'global' for superuser
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0-100
  justification: string;
  actionRecommendation: string;
}

export interface ChiefAuditorReview {
  determination: 'UPHOLD_REJECTION' | 'OVERRIDE_APPROVE' | 'REQUIRE_ADDITIONAL_EVIDENCE';
  confidence: number;
  finalVerdict: string;
  regulatoryCitations: string[];
  auditLogEntry: string;
}

export interface WeeklySystemAuditReport {
  period: string;
  systemHealthScore: number; // 0-100
  agentPerformance: {
    accuracy: number;
    falsePositives: number;
    summary: string;
  };
  humanOversightAnalysis: string; // "Humans overrode AI 12 times, mostly on gardening..."
  fraudTrends: string[];
  criticalRecommendations: string[];
}

export interface SpendingAnalysis {
  status: 'NORMAL' | 'OVERSPEND_RISK' | 'UNDERSPEND_RISK';
  summary: string;
  unspentAmount: number;
  unspentPercentage: number;
  recommendations: string[];
  carePlanReviewNeeded: boolean;
}

export interface ValidationResult {
  ruleId: string;
  ruleName: string;
  severity: ValidationSeverity;
  result: 'PASS' | 'FAIL';
  details?: string;
}

export interface LineItem {
  description: string;
  serviceDate?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  taxCodeGuess?: string;
  mappedServiceCode?: string; // The code mapped to internal system
}

export interface PurchaseOrder {
  poNumber: string;
  clientId: string;
  clientName: string; // Added for display
  serviceCodes: string[];
  budgetRemaining: number;
  
  // Quarterly Budget Tracking
  quarterlyBudgetCap: number;
  currentQuarterSpend: number;
  currentQuarterEnd: string; // YYYY-MM-DD
  
  validFrom: string;
  validTo: string;
}

export interface ClientDocument {
  id: string;
  name: string;
  type: 'CARE_PLAN' | 'SERVICE_AGREEMENT' | 'ASSESSMENT' | 'OTHER';
  uploadDate: string;
  size: number;
  url: string; // Mock URL
}

// Updated to reflect Support at Home 8 Levels + Legacy/Other
export type FundingSource = 
  | 'SAH_LEVEL_1' | 'SAH_LEVEL_2' | 'SAH_LEVEL_3' | 'SAH_LEVEL_4' 
  | 'SAH_LEVEL_5' | 'SAH_LEVEL_6' | 'SAH_LEVEL_7' | 'SAH_LEVEL_8'
  | 'HCP_LEGACY' // For transition period
  | 'CHSP' | 'NDIS' | 'PRIVATE' | 'DVA';

export interface FundingPackage {
  source: FundingSource;
  startDate: string;
  supplements: string[]; // e.g. 'Dementia', 'Oxygen', 'Enteral Feeding'
}

export interface Client {
  id: string;
  tenantId: string; // Data Isolation
  name: string;
  email: string;
  phone: string;
  integrationId?: string; // ID in Lookout/External System
  status: 'ACTIVE' | 'INACTIVE' | 'ON_HOLD';
  totalBudgetCap: number;
  totalBudgetUsed: number;
  budgetRenewalDate: string;
  documents: ClientDocument[];
  activePO: string; // Linked PO Number
  
  // Complex Funding Data
  fundingPackages: FundingPackage[];
  specificApprovals: string[]; 
  
  // Advanced Classification
  dvaCardType?: 'GOLD' | 'WHITE' | 'ORANGE' | null;
  mmmLevel?: '1' | '2' | '3' | '4' | '5' | '6' | '7'; // Modified Monash Model
  isIndigenous?: boolean;
  isClaimsConference?: boolean; // Holocaust Survivor Funding
  isPrivateFunded?: boolean;
  
  // Disease Specific Schemes
  activeSchemes?: string[]; // e.g. ['caps_continence', 'sas_stoma', 'ndss_diabetes']
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

export interface RejectionDrafts {
  vendorEmail: EmailDraft;
  clientEmail: EmailDraft;
}

export interface Invoice {
  id: string;
  tenantId: string; // Data Isolation
  intakeId: string; // INV-20231027-001
  supplierName: string;
  supplierABN: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  poNumberExtracted?: string;
  poNumberMatched?: string; // Confirmed PO
  status: InvoiceStatus;
  confidenceScore: number; // 0-1
  fileUrl: string; // Mock URL
  lineItems: LineItem[];
  validationResults: ValidationResult[];
  riskAssessment?: RiskAssessment; // AI Triage
  chiefAuditorReview?: ChiefAuditorReview; // The final say
  spendingAnalysis?: SpendingAnalysis; // New AI Component result
  rejectionDrafts?: RejectionDrafts; // AI Generated emails
  rawContent?: string; // For AI context
}

export interface DashboardMetrics {
  totalInvoices: number;
  autoApprovalRate: number;
  pendingReview: number;
  totalPostedValue: number;
}

export interface PolicyDocument {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  data: string; // Base64 encoded string
}

export interface AuditPromptConfig {
  priceReasonableness: string;
  fraudIndicators: string;
  consistencyCheck: string;
  contractorCompliance: string;
  riskAssessment: string;
}

export interface EmailConfig {
  enabled: boolean;
  mode: 'forwarding' | 'connected_account';
  forwardingAddress: string;
  connectedAccount?: {
    provider: 'microsoft' | 'google' | 'imap';
    email: string;
    monitoredFolder: string; // e.g. "Inbox" or "Invoices"
    lastSync: string;
    imapConfig?: {
        host: string;
        port: number;
        secure: boolean;
        username: string;
    };
    ingestionRules?: {
        mustHaveAttachment: boolean;
        allowedDomains: string[]; // e.g. ['@carefirst.com']
        subjectKeywords: string[]; // e.g. ['invoice', 'bill']
    }
  };
}

export interface AlayaCareConfig {
  connected: boolean;
  tenantUrl: string; // e.g. https://acme.alayacare.com
  clientId: string;
  clientSecret: string;
  lastSync?: string;
}

export interface LookoutConfig {
  connected: boolean;
  apiEndpoint: string; // e.g. https://api.thelookoutway.com/v1
  apiKey: string;
  lastSync?: string;
}

export interface AccountingConfig {
  connected: boolean;
  clientId: string;
  clientSecret: string;
  tenantId?: string;
  apiKey?: string;
  apiEndpoint?: string;
  lastSync?: string;
}

export interface ComplianceSettings {
  orgPrivacyPolicyUrl: string;
  orgTermsOfServiceUrl: string;
  dataBreachContactEmail: string;
  dataSovereigntyRegion: 'AU-SYD' | 'GLOBAL';
  auditLogRetentionDays: number;
}

// B2G COMPLIANCE TYPES
export interface ComplianceField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'currency' | 'number' | 'checkbox';
  mappedKey?: string; // e.g., 'invoice.totalAmount' or 'client.ndisNumber'
  value?: string | number | boolean;
  required: boolean;
}

export interface ComplianceTemplate {
  id: string;
  name: string; // e.g., "NDIS Payment Request 2024"
  description: string;
  authority: 'SERVICES_AUSTRALIA' | 'NDIS' | 'DVA' | 'OTHER';
  fields: ComplianceField[];
  createdAt: string;
}

export interface ComplianceIssue {
  fieldId: string;
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  suggestedFix?: any; // The proposed value to fix the error
}

export interface ComplianceAuditResult {
  passed: boolean; // Can only submit if true
  issues: ComplianceIssue[];
  summary: string;
}

export interface AppSettings {
  // Integrations
  xero: AccountingConfig;
  myob: AccountingConfig;
  quickbooks: AccountingConfig;
  epicor: AccountingConfig;
  sap: AccountingConfig;
  
  // CMS Integrations
  lookout: LookoutConfig;
  alayaCare: AlayaCareConfig;

  storageProvider: 'onedrive' | 'gdrive';
  storageConnected: boolean;
  
  // Email Ingestion
  emailConfig: EmailConfig;
  
  // Notifications
  notificationRules: NotificationRule[];
  emailServiceConfig: EmailServiceConfig;

  // Compliance
  compliance: ComplianceSettings;
  
  // B2G Templates
  complianceTemplates?: ComplianceTemplate[]; // Custom templates

  // LLM Keys
  llmKeys: {
    gemini: string;
    openai: string;
    anthropic: string;
    grok: string;
    perplexity: string;
  };

  // AI Config
  auditPrompt: AuditPromptConfig; // Structured prompt sections
  policyDocuments: string; // The text-based "Organisational Documentation"
  policyFiles: PolicyDocument[]; // Uploaded PDF policies
  extractionPrompt: string;
}
