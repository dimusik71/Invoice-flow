
import { Invoice, InvoiceStatus, ValidationSeverity, PurchaseOrder, RiskLevel, Client, TenantConfig } from './types';

// --- INITIAL TENANT BOOTSTRAP DATA ---
export const INITIAL_TENANTS: TenantConfig[] = [
  {
    id: 't-dev-001',
    name: 'InvoiceFlow Labs (BETA)',
    primaryColor: '#7c3aed', // violet-600
    secondaryColor: '#4c1d95', // violet-900
    accentColor: '#d946ef', // fuchsia-500
    features: { aiAudit: true, xeroIntegration: true, poMatching: true, spendingAnalysis: true, emailIngestion: true },
    status: 'BETA',
    createdAt: '2023-01-01',
    documentSettings: {
        headerText: 'InvoiceFlow Labs (BETA)',
        subHeaderText: 'Development Environment',
        footerText: 'Confidential - Internal Use Only | ABN 12 345 678 901',
        showLogo: true
    }
  },
  {
    id: 't-001',
    name: 'CareFirst Solutions',
    primaryColor: '#2563eb', // blue-600
    secondaryColor: '#1e40af', // blue-800
    accentColor: '#3b82f6', // blue-500
    features: { aiAudit: true, xeroIntegration: true, poMatching: true, spendingAnalysis: true, emailIngestion: true },
    status: 'ACTIVE',
    createdAt: '2023-01-15',
    documentSettings: {
        headerText: 'CareFirst Solutions',
        subHeaderText: 'Excellence in Care',
        footerText: 'CareFirst Solutions Pty Ltd | ABN 88 999 111 222 | Privacy Policy available at carefirst.com.au',
        showLogo: true
    }
  },
  {
    id: 't-002',
    name: 'GreenLeaf Support',
    primaryColor: '#059669', // emerald-600
    secondaryColor: '#065f46', // emerald-800
    accentColor: '#10b981', // emerald-500
    features: { aiAudit: true, xeroIntegration: false, poMatching: true, spendingAnalysis: false, emailIngestion: false },
    status: 'ACTIVE',
    createdAt: '2023-03-22',
    documentSettings: {
        headerText: 'GreenLeaf Support Services',
        subHeaderText: 'Supporting Your Independence',
        footerText: 'GreenLeaf Support | Registered NDIS Provider | 1300 000 000',
        showLogo: false
    }
  },
  {
    id: 't-003',
    name: 'Horizon Health',
    primaryColor: '#6366f1', // indigo-500
    secondaryColor: '#312e81', // indigo-900
    accentColor: '#818cf8', // indigo-400
    features: { aiAudit: false, xeroIntegration: true, poMatching: false, spendingAnalysis: false, emailIngestion: true },
    status: 'ACTIVE',
    createdAt: '2023-06-10',
    documentSettings: {
        headerText: 'Horizon Health',
        subHeaderText: '',
        footerText: 'Horizon Health Ltd. All rights reserved.',
        showLogo: true
    }
  }
];

// --- GOVERNMENT REFERENCE DATA (Live Schedule 2025) ---
export const GOV_FUNDING_DATA = {
    // Official Daily Rates for Support at Home (2025 Schedule)
    // Annual amounts are calculated as Daily Rate x 365
    SAH_DAILY_RATES: {
        'SAH_LEVEL_1': 29.40,  // ~$10,731.00 / yr
        'SAH_LEVEL_2': 43.93,  // ~$16,034.45 / yr
        'SAH_LEVEL_3': 60.18,  // ~$21,965.70 / yr
        'SAH_LEVEL_4': 81.36,  // ~$29,696.40 / yr
        'SAH_LEVEL_5': 108.76, // ~$39,697.40 / yr
        'SAH_LEVEL_6': 131.82, // ~$48,114.30 / yr
        'SAH_LEVEL_7': 159.31, // ~$58,148.15 / yr
        'SAH_LEVEL_8': 213.99  // ~$78,106.35 / yr
    },
    // Modified Monash Model (MMM) Remote Area Loadings (Multiplier on Base Subsidy)
    MMM_LOADINGS: {
        '1': 1.00, // Major Cities
        '2': 1.00, // Inner Regional
        '3': 1.00, // Outer Regional
        '4': 1.00, // Remote Fringe
        '5': 1.15, // Remote (+15%)
        '6': 1.40, // Remote (+40%)
        '7': 1.50  // Very Remote (+50%)
    },
    // Specific Supplements (Daily Rates)
    SUPPLEMENT_DAILY_RATES: {
        'dementia_cognition': 11.50, // 10% of Level 4 approx (Standard Rate)
        'oxygen': 1.70,              // Standard Oxygen
        'enteral_feeding': 2.10,     // Bolus
        'veterans_supplement': 4.10  // DVA Supplement
    },
    // Specific Disease Schemes
    DISEASE_SCHEMES: {
        'caps_continence': 'Continence Aids Payment Scheme (CAPS)',
        'sas_stoma': 'Stoma Appliance Scheme (SAS)',
        'ndss_diabetes': 'National Diabetes Services Scheme (NDSS)',
        'hsp_hearing': 'Hearing Services Program (HSP)'
    }
};

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'CLIENT-101',
    tenantId: 't-001', // CareFirst
    name: 'Arthur Dent',
    email: 'arthur@dent.com',
    phone: '0400 123 456',
    integrationId: 'LOOK-8821',
    status: 'ACTIVE',
    totalBudgetCap: 78106.35, // Level 8
    totalBudgetUsed: 2000.00,
    budgetRenewalDate: '2023-12-31',
    activePO: 'PO-998877',
    documents: [
      { id: 'doc-1', name: 'Care_Plan_2023.pdf', type: 'CARE_PLAN', size: 1024000, uploadDate: '2023-01-15', url: '#' },
      { id: 'doc-2', name: 'Risk_Assessment.pdf', type: 'ASSESSMENT', size: 500000, uploadDate: '2023-01-15', url: '#' }
    ],
    fundingPackages: [
      { source: 'SAH_LEVEL_8', startDate: '2023-01-01', supplements: ['Dementia and Cognition Supplement', 'Oxygen Supplement'] }
    ],
    specificApprovals: ['Complex Home Modification (Ramp) > $2000'],
    dvaCardType: null,
    mmmLevel: '1',
    activeSchemes: []
  },
  {
    id: 'CLIENT-202',
    tenantId: 't-001', // CareFirst
    name: 'Ford Prefect',
    email: 'ford@prefect.com',
    phone: '0400 999 888',
    integrationId: 'LOOK-9932',
    status: 'ACTIVE',
    totalBudgetCap: 21965.70, // Level 3
    totalBudgetUsed: 2800.00,
    budgetRenewalDate: '2023-12-31',
    activePO: 'PO-554433',
    documents: [
       { id: 'doc-3', name: 'Service_Agreement_Signed.pdf', type: 'SERVICE_AGREEMENT', size: 2400000, uploadDate: '2023-06-01', url: '#' }
    ],
    fundingPackages: [
      { source: 'SAH_LEVEL_3', startDate: '2023-06-01', supplements: [] }
    ],
    specificApprovals: [],
    dvaCardType: 'WHITE',
    mmmLevel: '2',
    activeSchemes: ['ndss_diabetes']
  },
  {
    id: 'CLIENT-303',
    tenantId: 't-002', // GreenLeaf Support (Different Tenant)
    name: 'Zaphod Beeblebrox',
    email: 'zaphod@galaxy.gov',
    phone: '0400 000 001',
    integrationId: 'LOOK-0001',
    status: 'ON_HOLD',
    totalBudgetCap: 50000.00,
    totalBudgetUsed: 49500.00,
    budgetRenewalDate: '2023-11-30',
    activePO: 'PO-111222',
    documents: [],
    fundingPackages: [
      { source: 'NDIS', startDate: '2022-01-01', supplements: [] }
    ],
    specificApprovals: ['Assistive Technology - Comm Device'],
    dvaCardType: null,
    mmmLevel: '1',
    activeSchemes: []
  },
  // ============================================
  // DEV BETA TEST CLIENTS (t-dev-001)
  // ============================================
  {
    id: 'DEV-CLIENT-001',
    tenantId: 't-dev-001',
    name: 'Margaret Thompson',
    email: 'margaret.thompson@email.com.au',
    phone: '0412 345 678',
    integrationId: 'DEV-LOOK-001',
    status: 'ACTIVE',
    totalBudgetCap: 16034.45, // SAH Level 2 Annual
    totalBudgetUsed: 4200.00,
    budgetRenewalDate: '2025-06-30',
    activePO: 'PO-DEV-001',
    documents: [
      { id: 'doc-dev-1', name: 'Care_Plan_Margaret.pdf', type: 'CARE_PLAN', size: 1200000, uploadDate: '2024-07-01', url: '#' }
    ],
    fundingPackages: [
      { source: 'SAH_LEVEL_2', startDate: '2024-07-01', supplements: [] }
    ],
    specificApprovals: [],
    dvaCardType: null,
    mmmLevel: '1',
    isIndigenous: false,
    isClaimsConference: false,
    isPrivateFunded: false,
    activeSchemes: []
  },
  {
    id: 'DEV-CLIENT-002',
    tenantId: 't-dev-001',
    name: 'Harold Chen',
    email: 'harold.chen@outlook.com',
    phone: '0423 456 789',
    integrationId: 'DEV-LOOK-002',
    status: 'ACTIVE',
    totalBudgetCap: 39697.40, // SAH Level 5 Annual
    totalBudgetUsed: 12500.00,
    budgetRenewalDate: '2025-03-31',
    activePO: 'PO-DEV-002',
    documents: [
      { id: 'doc-dev-2a', name: 'Care_Plan_Harold.pdf', type: 'CARE_PLAN', size: 1500000, uploadDate: '2024-04-01', url: '#' },
      { id: 'doc-dev-2b', name: 'DVA_Assessment.pdf', type: 'ASSESSMENT', size: 800000, uploadDate: '2024-04-01', url: '#' }
    ],
    fundingPackages: [
      { source: 'SAH_LEVEL_5', startDate: '2024-04-01', supplements: ['Dementia and Cognition Supplement'] }
    ],
    specificApprovals: ['Respite Care - Up to 63 days annually'],
    dvaCardType: 'GOLD',
    mmmLevel: '2',
    isIndigenous: false,
    isClaimsConference: false,
    isPrivateFunded: false,
    activeSchemes: ['hsp_hearing']
  },
  {
    id: 'DEV-CLIENT-003',
    tenantId: 't-dev-001',
    name: 'Patricia Williams',
    email: 'patricia.williams@gmail.com',
    phone: '0434 567 890',
    integrationId: 'DEV-LOOK-003',
    status: 'ACTIVE',
    totalBudgetCap: 58148.15, // SAH Level 7 Annual
    totalBudgetUsed: 28900.00,
    budgetRenewalDate: '2025-09-30',
    activePO: 'PO-DEV-003',
    documents: [
      { id: 'doc-dev-3a', name: 'Care_Plan_Patricia.pdf', type: 'CARE_PLAN', size: 2100000, uploadDate: '2024-10-01', url: '#' },
      { id: 'doc-dev-3b', name: 'Service_Agreement.pdf', type: 'SERVICE_AGREEMENT', size: 950000, uploadDate: '2024-10-01', url: '#' },
      { id: 'doc-dev-3c', name: 'ACAT_Assessment.pdf', type: 'ASSESSMENT', size: 1100000, uploadDate: '2024-09-15', url: '#' }
    ],
    fundingPackages: [
      { source: 'SAH_LEVEL_7', startDate: '2024-10-01', supplements: ['Oxygen Supplement', 'Enteral Feeding'] },
      { source: 'DVA', startDate: '2024-10-01', supplements: [] }
    ],
    specificApprovals: ['Home Modification - Bathroom Rails > $1500', 'Oxygen Equipment Rental'],
    dvaCardType: 'WHITE',
    mmmLevel: '5',
    isIndigenous: false,
    isClaimsConference: false,
    isPrivateFunded: false,
    activeSchemes: ['caps_continence', 'sas_stoma']
  },
  {
    id: 'DEV-CLIENT-004',
    tenantId: 't-dev-001',
    name: 'Robert Goldstein',
    email: 'robert.goldstein@optusnet.com.au',
    phone: '0445 678 901',
    integrationId: 'DEV-LOOK-004',
    status: 'ACTIVE',
    totalBudgetCap: 78106.35, // SAH Level 8 Annual
    totalBudgetUsed: 45200.00,
    budgetRenewalDate: '2025-12-31',
    activePO: 'PO-DEV-004',
    documents: [
      { id: 'doc-dev-4a', name: 'Complex_Care_Plan_Robert.pdf', type: 'CARE_PLAN', size: 3500000, uploadDate: '2025-01-01', url: '#' },
      { id: 'doc-dev-4b', name: 'Claims_Conference_Approval.pdf', type: 'OTHER', size: 450000, uploadDate: '2025-01-01', url: '#' },
      { id: 'doc-dev-4c', name: 'Service_Agreement_Signed.pdf', type: 'SERVICE_AGREEMENT', size: 1200000, uploadDate: '2025-01-01', url: '#' }
    ],
    fundingPackages: [
      { source: 'SAH_LEVEL_8', startDate: '2025-01-01', supplements: ['Dementia and Cognition Supplement', 'Oxygen Supplement'] },
      { source: 'PRIVATE', startDate: '2025-01-01', supplements: [] }
    ],
    specificApprovals: ['24/7 Personal Care', 'Complex Home Modification - Wheelchair Ramp > $5000', 'Specialized Equipment > $3000'],
    dvaCardType: null,
    mmmLevel: '1',
    isIndigenous: false,
    isClaimsConference: true,
    isPrivateFunded: true,
    activeSchemes: ['ndss_diabetes', 'hsp_hearing']
  },
  {
    id: 'DEV-CLIENT-005',
    tenantId: 't-dev-001',
    name: 'Nancy Yunupingu',
    email: 'nancy.yunupingu@health.gov.au',
    phone: '0456 789 012',
    integrationId: 'DEV-LOOK-005',
    status: 'ACTIVE',
    totalBudgetCap: 117159.53, // SAH Level 8 + 50% MMM-7 Remote Loading
    totalBudgetUsed: 62000.00,
    budgetRenewalDate: '2025-06-30',
    activePO: 'PO-DEV-005',
    documents: [
      { id: 'doc-dev-5a', name: 'Care_Plan_Nancy_Remote.pdf', type: 'CARE_PLAN', size: 2800000, uploadDate: '2024-07-01', url: '#' },
      { id: 'doc-dev-5b', name: 'Indigenous_Assessment.pdf', type: 'ASSESSMENT', size: 1600000, uploadDate: '2024-06-15', url: '#' },
      { id: 'doc-dev-5c', name: 'NDIS_Plan.pdf', type: 'OTHER', size: 2200000, uploadDate: '2024-07-01', url: '#' }
    ],
    fundingPackages: [
      { source: 'SAH_LEVEL_8', startDate: '2024-07-01', supplements: ['Dementia and Cognition Supplement', 'Veterans Supplement'] },
      { source: 'NDIS', startDate: '2023-01-01', supplements: [] },
      { source: 'DVA', startDate: '2020-05-01', supplements: [] }
    ],
    specificApprovals: ['Remote Area Travel Allowance', 'Culturally Appropriate Care Worker', 'Interpreter Services', 'Complex Home Modification > $10000'],
    dvaCardType: 'GOLD',
    mmmLevel: '7',
    isIndigenous: true,
    isClaimsConference: false,
    isPrivateFunded: false,
    activeSchemes: ['caps_continence', 'ndss_diabetes', 'sas_stoma', 'hsp_hearing']
  }
];

export const MOCK_POS: Record<string, PurchaseOrder> = {
  'PO-998877': {
    poNumber: 'PO-998877',
    clientId: 'CLIENT-101',
    clientName: 'Arthur Dent',
    serviceCodes: ['SAH-001', 'SAH-002', 'TRANS-01'],
    budgetRemaining: 1500.00,
    
    // Setup for UNDERSPEND Risk (High Cap, Low Spend, Quarter ending soon)
    quarterlyBudgetCap: 19526.59, // Level 8 Quarterly
    currentQuarterSpend: 2000.00, 
    currentQuarterEnd: '2023-11-15', // Assume current date is late Oct 2023

    validFrom: '2023-01-01',
    validTo: '2023-12-31'
  },
  'PO-554433': {
    poNumber: 'PO-554433',
    clientId: 'CLIENT-202',
    clientName: 'Ford Prefect',
    serviceCodes: ['GARD-01'],
    budgetRemaining: 200.00,

    // Setup for OVERSPEND Risk (Low Cap, High Spend)
    quarterlyBudgetCap: 5491.43, // Level 3 Quarterly
    currentQuarterSpend: 5300.00, // Near limit
    currentQuarterEnd: '2023-12-31',

    validFrom: '2023-06-01',
    validTo: '2024-06-01'
  },
  // ============================================
  // DEV BETA TEST PURCHASE ORDERS (t-dev-001)
  // ============================================
  'PO-DEV-001': {
    poNumber: 'PO-DEV-001',
    clientId: 'DEV-CLIENT-001',
    clientName: 'Margaret Thompson',
    serviceCodes: ['SAH-DOM-01', 'SAH-SOCIAL-01'],
    budgetRemaining: 2958.61,
    quarterlyBudgetCap: 4008.61, // Level 2 Quarterly
    currentQuarterSpend: 1050.00,
    currentQuarterEnd: '2025-03-31',
    validFrom: '2024-07-01',
    validTo: '2025-06-30'
  },
  'PO-DEV-002': {
    poNumber: 'PO-DEV-002',
    clientId: 'DEV-CLIENT-002',
    clientName: 'Harold Chen',
    serviceCodes: ['SAH-PC-01', 'SAH-RESP-01', 'SAH-TRANS-01', 'SAH-MEAL-01'],
    budgetRemaining: 6924.35,
    quarterlyBudgetCap: 9924.35, // Level 5 Quarterly
    currentQuarterSpend: 3000.00,
    currentQuarterEnd: '2025-03-31',
    validFrom: '2024-04-01',
    validTo: '2025-03-31'
  },
  'PO-DEV-003': {
    poNumber: 'PO-DEV-003',
    clientId: 'DEV-CLIENT-003',
    clientName: 'Patricia Williams',
    serviceCodes: ['SAH-PC-01', 'SAH-PC-02', 'SAH-NURSING-01', 'SAH-OXY-01', 'SAH-ENTERAL-01', 'SAH-MOD-01'],
    budgetRemaining: 7312.04,
    quarterlyBudgetCap: 14537.04, // Level 7 Quarterly
    currentQuarterSpend: 7225.00,
    currentQuarterEnd: '2025-03-31',
    validFrom: '2024-10-01',
    validTo: '2025-09-30'
  },
  'PO-DEV-004': {
    poNumber: 'PO-DEV-004',
    clientId: 'DEV-CLIENT-004',
    clientName: 'Robert Goldstein',
    serviceCodes: ['SAH-PC-24HR', 'SAH-RESP-01', 'SAH-MOD-01', 'SAH-EQUIP-01', 'SAH-ALLIED-01', 'SAH-TRANS-01', 'SAH-MEAL-01'],
    budgetRemaining: 8226.59,
    quarterlyBudgetCap: 19526.59, // Level 8 Quarterly
    currentQuarterSpend: 11300.00,
    currentQuarterEnd: '2025-03-31',
    validFrom: '2025-01-01',
    validTo: '2025-12-31'
  },
  'PO-DEV-005': {
    poNumber: 'PO-DEV-005',
    clientId: 'DEV-CLIENT-005',
    clientName: 'Nancy Yunupingu',
    serviceCodes: ['SAH-PC-24HR', 'SAH-REMOTE-01', 'SAH-CULTURAL-01', 'SAH-INTERP-01', 'SAH-MOD-01', 'SAH-NURSING-01', 'SAH-ALLIED-01', 'NDIS-01'],
    budgetRemaining: 13789.88,
    quarterlyBudgetCap: 29289.88, // Level 8 + MMM-7 50% Loading Quarterly
    currentQuarterSpend: 15500.00,
    currentQuarterEnd: '2025-03-31',
    validFrom: '2024-07-01',
    validTo: '2025-06-30'
  }
};

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    tenantId: 't-001',
    intakeId: 'INV-20231027-001',
    supplierName: 'BrightSide Care Pty Ltd',
    supplierABN: '51 824 753 556',
    invoiceNumber: 'BS-9921',
    invoiceDate: '2023-10-25',
    totalAmount: 450.00,
    poNumberExtracted: 'PO-998877',
    poNumberMatched: 'PO-998877',
    status: InvoiceStatus.NEEDS_REVIEW,
    confidenceScore: 0.92,
    fileUrl: 'https://picsum.photos/600/800',
    lineItems: [
      { description: 'Personal Care - Morning Shift', serviceDate: '2023-10-20', qty: 2, unitPrice: 100, lineTotal: 200, mappedServiceCode: 'SAH-001' },
      { description: 'Personal Care - Evening Shift', serviceDate: '2023-10-20', qty: 2, unitPrice: 125, lineTotal: 250, mappedServiceCode: 'SAH-001' }
    ],
    riskAssessment: {
        level: RiskLevel.MEDIUM,
        score: 65,
        justification: "Unit price for Personal Care ($100) exceeds typical policy cap ($68), but within allowable variance for weekends.",
        actionRecommendation: "Manual Review"
    },
    validationResults: [
      { ruleId: 'R-01', ruleName: 'ABN_VALID', severity: ValidationSeverity.FAIL, result: 'PASS' },
      { ruleId: 'R-02', ruleName: 'PO_EXISTS', severity: ValidationSeverity.FAIL, result: 'PASS' },
      { ruleId: 'R-03', ruleName: 'GST_RECONCILES', severity: ValidationSeverity.WARN, result: 'FAIL', details: 'Calculated tax $40.91 does not match line items' },
      { ruleId: 'R-04', ruleName: 'SERVICE_CODE_APPROVED', severity: ValidationSeverity.FAIL, result: 'PASS' },
    ]
  },
  {
    id: 'inv-002',
    tenantId: 't-001',
    intakeId: 'INV-20231027-002',
    supplierName: 'Green Thumb Gardening',
    supplierABN: '12 345 678 901',
    invoiceNumber: 'GTG-4004',
    invoiceDate: '2023-10-26',
    totalAmount: 180.00,
    poNumberExtracted: 'PO-554433',
    poNumberMatched: 'PO-554433',
    status: InvoiceStatus.POSTED_TO_XERO,
    confidenceScore: 0.98,
    fileUrl: 'https://picsum.photos/600/801',
    lineItems: [
      { description: 'Lawn Mowing', serviceDate: '2023-10-22', qty: 1, unitPrice: 180, lineTotal: 180, mappedServiceCode: 'GARD-01' }
    ],
    validationResults: [
      { ruleId: 'R-ALL', ruleName: 'ALL_CHECKS', severity: ValidationSeverity.INFO, result: 'PASS' }
    ]
  },
  {
    id: 'inv-003',
    tenantId: 't-001',
    intakeId: 'INV-20231028-005',
    supplierName: 'Fast Transport Services',
    supplierABN: '',
    invoiceNumber: 'FT-888',
    invoiceDate: '2023-10-27',
    totalAmount: 55.00,
    poNumberExtracted: undefined,
    status: InvoiceStatus.FAILED,
    confidenceScore: 0.45,
    fileUrl: 'https://picsum.photos/600/802',
    lineItems: [],
    validationResults: [
      { ruleId: 'R-01', ruleName: 'ABN_PRESENT', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'No ABN found on document' },
      { ruleId: 'R-02', ruleName: 'PO_PRESENT', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'No PO number found' }
    ]
  },
   {
    id: 'inv-004',
    tenantId: 't-001',
    intakeId: 'INV-20231028-006',
    supplierName: 'Support Warriors',
    supplierABN: '99 888 777 666',
    invoiceNumber: 'SW-101',
    invoiceDate: '2023-10-28',
    totalAmount: 1200.00,
    poNumberExtracted: 'PO-998877',
    poNumberMatched: 'PO-998877',
    status: InvoiceStatus.NEEDS_REVIEW,
    confidenceScore: 0.88,
    fileUrl: 'https://picsum.photos/600/803',
    lineItems: [
         { description: 'Complex Home Mod', serviceDate: '2023-10-25', qty: 1, unitPrice: 1200, lineTotal: 1200, mappedServiceCode: 'UNKNOWN' }
    ],
    riskAssessment: {
        level: RiskLevel.HIGH,
        score: 95,
        justification: "Item 'Complex Home Mod' ($1200) not on approved service list for this PO. High dollar value and vague description suggests potential unauthorized work.",
        actionRecommendation: "Reject or Request Info"
    },
    validationResults: [
      { ruleId: 'R-01', ruleName: 'ABN_VALID', severity: ValidationSeverity.FAIL, result: 'PASS' },
       { ruleId: 'R-04', ruleName: 'SERVICE_CODE_APPROVED', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Service "Complex Home Mod" not in PO approved list' },
       { ruleId: 'R-05', ruleName: 'AMOUNT_WITHIN_LIMITS', severity: ValidationSeverity.WARN, result: 'FAIL', details: 'Invoice total consumes >80% of remaining PO budget' }
    ]
  },
  {
      id: 'inv-005',
      tenantId: 't-002', // Hidden from t-001 user
      intakeId: 'INV-999',
      supplierName: 'Secret Supplier',
      supplierABN: '00 000 000 000',
      invoiceNumber: 'SEC-1',
      invoiceDate: '2023-11-01',
      totalAmount: 1000.00,
      status: InvoiceStatus.RECEIVED,
      confidenceScore: 1.0,
      fileUrl: '',
      lineItems: [],
      validationResults: []
  },
  // ============================================
  // DEV BETA TEST INVOICES (t-dev-001)
  // 10 Complex Invoices covering all audit scenarios
  // ============================================
  
  // INV-DEV-001: Clean invoice - Simple domestic assistance (Margaret)
  {
    id: 'inv-dev-001',
    tenantId: 't-dev-001',
    intakeId: 'INV-20251210-001',
    supplierName: 'Sunshine Cleaning Services Pty Ltd',
    supplierABN: '45 123 456 789',
    invoiceNumber: 'SCS-2025-0412',
    invoiceDate: '2025-12-10',
    totalAmount: 165.00,
    poNumberExtracted: 'PO-DEV-001',
    poNumberMatched: 'PO-DEV-001',
    status: InvoiceStatus.VALIDATED,
    confidenceScore: 0.97,
    fileUrl: 'https://picsum.photos/600/810',
    lineItems: [
      { description: 'Domestic Assistance - House Cleaning', serviceDate: '2025-12-09', qty: 3, unitPrice: 55.00, lineTotal: 165.00, mappedServiceCode: 'SAH-DOM-01' }
    ],
    riskAssessment: {
      level: RiskLevel.LOW,
      score: 8,
      justification: "All validation rules passed. Standard domestic assistance at compliant hourly rate ($55/hr within $55 cap).",
      actionRecommendation: "Auto-Approve"
    },
    validationResults: [
      { ruleId: 'R-01', ruleName: 'ABN_VALID', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'R-02', ruleName: 'PO_EXISTS', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'R-03', ruleName: 'SERVICE_CODE_APPROVED', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'R-04', ruleName: 'PRICE_REASONABLE', severity: ValidationSeverity.INFO, result: 'PASS' }
    ]
  },

  // INV-DEV-002: Price overcharge - Personal care above cap (Harold)
  {
    id: 'inv-dev-002',
    tenantId: 't-dev-001',
    intakeId: 'INV-20251211-002',
    supplierName: 'Premium Care Australia',
    supplierABN: '67 234 567 890',
    invoiceNumber: 'PCA-8891',
    invoiceDate: '2025-12-11',
    totalAmount: 540.00,
    poNumberExtracted: 'PO-DEV-002',
    poNumberMatched: 'PO-DEV-002',
    status: InvoiceStatus.NEEDS_REVIEW,
    confidenceScore: 0.91,
    fileUrl: 'https://picsum.photos/600/811',
    lineItems: [
      { description: 'Personal Care - Showering Assistance', serviceDate: '2025-12-10', qty: 4, unitPrice: 85.00, lineTotal: 340.00, mappedServiceCode: 'SAH-PC-01' },
      { description: 'Personal Care - Medication Prompt', serviceDate: '2025-12-10', qty: 2, unitPrice: 100.00, lineTotal: 200.00, mappedServiceCode: 'SAH-PC-01' }
    ],
    riskAssessment: {
      level: RiskLevel.MEDIUM,
      score: 45,
      justification: "AI-PRICE-CHECK: FAIL (+30 points). Personal Care rate of $85-$100/hr exceeds policy cap of $68/hr. Total overcharge: $94.00. No weekend/after-hours justification provided.",
      actionRecommendation: "Request itemized justification for premium rates"
    },
    validationResults: [
      { ruleId: 'R-01', ruleName: 'ABN_VALID', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'R-02', ruleName: 'PO_EXISTS', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'AI-PRICE-CHECK', ruleName: 'PRICE_REASONABLE', severity: ValidationSeverity.WARN, result: 'FAIL', details: 'Unit prices exceed policy caps. Personal Care: $85-$100/hr vs cap $68/hr' }
    ]
  },

  // INV-DEV-003: Fraud indicators - Round amounts + suspicious description (Margaret)
  {
    id: 'inv-dev-003',
    tenantId: 't-dev-001',
    intakeId: 'INV-20251212-003',
    supplierName: 'ABC Consulting Services',
    supplierABN: '78 345 678 901',
    invoiceNumber: 'ABC-1000',
    invoiceDate: '2025-12-12',
    totalAmount: 500.00,
    poNumberExtracted: 'PO-DEV-001',
    poNumberMatched: 'PO-DEV-001',
    status: InvoiceStatus.NEEDS_REVIEW,
    confidenceScore: 0.72,
    fileUrl: 'https://picsum.photos/600/812',
    lineItems: [
      { description: 'Consulting Services', serviceDate: '2025-12-11', qty: 1, unitPrice: 500.00, lineTotal: 500.00, mappedServiceCode: 'UNKNOWN' }
    ],
    riskAssessment: {
      level: RiskLevel.HIGH,
      score: 100,
      justification: "AI-FRAUD-CHECK: FAIL. Multiple fraud indicators detected: (1) Exact round dollar amount $500.00, (2) Vague description 'Consulting Services' not typical for aged care, (3) Service code not in approved list. AI-PRICE-CHECK: FAIL.",
      actionRecommendation: "Reject - Request detailed breakdown and service verification"
    },
    validationResults: [
      { ruleId: 'AI-FRAUD-CHECK', ruleName: 'FRAUD_INDICATORS', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Round dollar amount ($500.00) and vague description flagged as potential fraud' },
      { ruleId: 'R-04', ruleName: 'SERVICE_CODE_APPROVED', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Service "Consulting Services" not in approved service list for aged care' },
      { ruleId: 'AI-PRICE-CHECK', ruleName: 'PRICE_REASONABLE', severity: ValidationSeverity.WARN, result: 'FAIL', details: 'Cannot validate price without proper service categorization' }
    ]
  },

  // INV-DEV-004: DVA dual-funding error - Medical billed to package instead of DVA (Harold - Gold Card)
  {
    id: 'inv-dev-004',
    tenantId: 't-dev-001',
    intakeId: 'INV-20251213-004',
    supplierName: 'MediSupply Direct',
    supplierABN: '89 456 789 012',
    invoiceNumber: 'MSD-7742',
    invoiceDate: '2025-12-13',
    totalAmount: 890.00,
    poNumberExtracted: 'PO-DEV-002',
    poNumberMatched: 'PO-DEV-002',
    status: InvoiceStatus.NEEDS_REVIEW,
    confidenceScore: 0.85,
    fileUrl: 'https://picsum.photos/600/813',
    lineItems: [
      { description: 'Wound Dressings - Premium', serviceDate: '2025-12-12', qty: 20, unitPrice: 25.00, lineTotal: 500.00, mappedServiceCode: 'SAH-NURSING-01' },
      { description: 'Blood Pressure Monitor', serviceDate: '2025-12-12', qty: 1, unitPrice: 290.00, lineTotal: 290.00, mappedServiceCode: 'SAH-EQUIP-01' },
      { description: 'Hearing Aid Batteries', serviceDate: '2025-12-12', qty: 10, unitPrice: 10.00, lineTotal: 100.00, mappedServiceCode: 'SAH-ALLIED-01' }
    ],
    riskAssessment: {
      level: RiskLevel.HIGH,
      score: 95,
      justification: "AI-DVA-CHECK: FAIL (+50 points). Client has DVA GOLD card - medical/nursing supplies MUST be billed to DVA, not Home Care Package. Potential dual-funding violation. AI-SCHEME-CHECK: FAIL (+45 points). Client has active HSP (Hearing Services) scheme - hearing aid batteries should not be on package.",
      actionRecommendation: "Reject - Redirect supplier to bill DVA directly for medical items. Redirect hearing items to HSP scheme."
    },
    validationResults: [
      { ruleId: 'R-01', ruleName: 'ABN_VALID', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'AI-DVA-CHECK', ruleName: 'DVA_COMPLIANCE', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Client has DVA GOLD card. Medical supplies must be billed to DVA, not package funds.' },
      { ruleId: 'AI-SCHEME-CHECK', ruleName: 'DISEASE_SCHEME_OVERLAP', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Hearing items should be claimed via active HSP scheme, not package.' }
    ]
  },

  // INV-DEV-005: Aging invoice - Over 60 days old (Patricia)
  {
    id: 'inv-dev-005',
    tenantId: 't-dev-001',
    intakeId: 'INV-20251001-005',
    supplierName: 'Country Care Nursing',
    supplierABN: '90 567 890 123',
    invoiceNumber: 'CCN-5521',
    invoiceDate: '2025-10-01',
    totalAmount: 1250.00,
    poNumberExtracted: 'PO-DEV-003',
    poNumberMatched: 'PO-DEV-003',
    status: InvoiceStatus.NEEDS_REVIEW,
    confidenceScore: 0.89,
    fileUrl: 'https://picsum.photos/600/814',
    lineItems: [
      { description: 'Registered Nurse Visit - Wound Care', serviceDate: '2025-09-28', qty: 5, unitPrice: 150.00, lineTotal: 750.00, mappedServiceCode: 'SAH-NURSING-01' },
      { description: 'Oxygen Equipment Check', serviceDate: '2025-09-28', qty: 2, unitPrice: 250.00, lineTotal: 500.00, mappedServiceCode: 'SAH-OXY-01' }
    ],
    riskAssessment: {
      level: RiskLevel.HIGH,
      score: 80,
      justification: "AI-AGING-CHECK: FAIL (+80 points). Invoice dated 2025-10-01 is 77 days old (>60 day threshold). Late submission may indicate billing irregularities or attempt to use expired budget period funds.",
      actionRecommendation: "Request explanation for late submission before processing"
    },
    validationResults: [
      { ruleId: 'R-01', ruleName: 'ABN_VALID', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'R-02', ruleName: 'PO_EXISTS', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'AI-AGING-CHECK', ruleName: 'INVOICE_AGING', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Invoice is 77 days old. Exceeds 60-day submission threshold.' }
    ]
  },

  // INV-DEV-006: Weekend/After-hours fraud - Weekday billed as weekend (Robert)
  {
    id: 'inv-dev-006',
    tenantId: 't-dev-001',
    intakeId: 'INV-20251215-006',
    supplierName: 'Elite Home Care Services',
    supplierABN: '01 678 901 234',
    invoiceNumber: 'EHCS-3344',
    invoiceDate: '2025-12-15',
    totalAmount: 780.00,
    poNumberExtracted: 'PO-DEV-004',
    poNumberMatched: 'PO-DEV-004',
    status: InvoiceStatus.NEEDS_REVIEW,
    confidenceScore: 0.88,
    fileUrl: 'https://picsum.photos/600/815',
    lineItems: [
      { description: 'Personal Care - Weekend Rate', serviceDate: '2025-12-11', qty: 4, unitPrice: 95.00, lineTotal: 380.00, mappedServiceCode: 'SAH-PC-01' },
      { description: 'Personal Care - After Hours Surcharge', serviceDate: '2025-12-11', qty: 4, unitPrice: 100.00, lineTotal: 400.00, mappedServiceCode: 'SAH-PC-01' }
    ],
    riskAssessment: {
      level: RiskLevel.HIGH,
      score: 100,
      justification: "AI-FRAUD-CHECK: FAIL. Service date 2025-12-11 is a THURSDAY (weekday), but billed at 'Weekend Rate' and includes 'After Hours Surcharge'. This is a clear fraudulent billing pattern. AI-PRICE-CHECK: FAIL.",
      actionRecommendation: "Reject - Fraudulent weekend/after-hours billing on weekday service"
    },
    validationResults: [
      { ruleId: 'AI-FRAUD-CHECK', ruleName: 'FRAUD_INDICATORS', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Weekend/After-hours surcharge applied to Thursday (2025-12-11) service - potential billing fraud' },
      { ruleId: 'AI-PRICE-CHECK', ruleName: 'PRICE_REASONABLE', severity: ValidationSeverity.WARN, result: 'FAIL', details: 'Combined rate $195/hr far exceeds any allowable cap' }
    ]
  },

  // INV-DEV-007: Continence supplies on package - Should use CAPS scheme (Patricia)
  {
    id: 'inv-dev-007',
    tenantId: 't-dev-001',
    intakeId: 'INV-20251214-007',
    supplierName: 'Healthcare Supplies Australia',
    supplierABN: '12 789 012 345',
    invoiceNumber: 'HSA-9001',
    invoiceDate: '2025-12-14',
    totalAmount: 420.00,
    poNumberExtracted: 'PO-DEV-003',
    poNumberMatched: 'PO-DEV-003',
    status: InvoiceStatus.NEEDS_REVIEW,
    confidenceScore: 0.82,
    fileUrl: 'https://picsum.photos/600/816',
    lineItems: [
      { description: 'Continence Pads - Bulk Pack (120)', serviceDate: '2025-12-13', qty: 3, unitPrice: 120.00, lineTotal: 360.00, mappedServiceCode: 'UNKNOWN' },
      { description: 'Stoma Bags - Monthly Supply', serviceDate: '2025-12-13', qty: 1, unitPrice: 60.00, lineTotal: 60.00, mappedServiceCode: 'UNKNOWN' }
    ],
    riskAssessment: {
      level: RiskLevel.HIGH,
      score: 95,
      justification: "AI-SCHEME-CHECK: FAIL (+95 points). Client has active CAPS (Continence Aids Payment Scheme) and SAS (Stoma Appliance Scheme). These items MUST NOT be billed to package - this is double-dipping from government schemes.",
      actionRecommendation: "Reject - Redirect supplier to bill CAPS/SAS schemes directly"
    },
    validationResults: [
      { ruleId: 'AI-SCHEME-CHECK', ruleName: 'DISEASE_SCHEME_OVERLAP', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Client has active CAPS scheme. Continence supplies must be claimed via CAPS, not package funds.' },
      { ruleId: 'AI-SCHEME-CHECK', ruleName: 'DISEASE_SCHEME_OVERLAP', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Client has active SAS scheme. Stoma supplies must be claimed via SAS, not package funds.' }
    ]
  },

  // INV-DEV-008: Remote area valid loading - MMM-7 client (Nancy)
  {
    id: 'inv-dev-008',
    tenantId: 't-dev-001',
    intakeId: 'INV-20251216-008',
    supplierName: 'Outback Care Services',
    supplierABN: '23 890 123 456',
    invoiceNumber: 'OCS-1155',
    invoiceDate: '2025-12-16',
    totalAmount: 2850.00,
    poNumberExtracted: 'PO-DEV-005',
    poNumberMatched: 'PO-DEV-005',
    status: InvoiceStatus.VALIDATED,
    confidenceScore: 0.94,
    fileUrl: 'https://picsum.photos/600/817',
    lineItems: [
      { description: 'Personal Care - Remote Area Rate', serviceDate: '2025-12-15', qty: 10, unitPrice: 102.00, lineTotal: 1020.00, mappedServiceCode: 'SAH-PC-01' },
      { description: 'Cultural Care Worker - Interpreter', serviceDate: '2025-12-15', qty: 8, unitPrice: 95.00, lineTotal: 760.00, mappedServiceCode: 'SAH-CULTURAL-01' },
      { description: 'Remote Travel Allowance', serviceDate: '2025-12-15', qty: 350, unitPrice: 0.92, lineTotal: 322.00, mappedServiceCode: 'SAH-REMOTE-01' },
      { description: 'Nursing - Wound Care (Remote)', serviceDate: '2025-12-15', qty: 3, unitPrice: 249.33, lineTotal: 748.00, mappedServiceCode: 'SAH-NURSING-01' }
    ],
    riskAssessment: {
      level: RiskLevel.LOW,
      score: 15,
      justification: "All validations PASS. Client is MMM-7 (Very Remote) which permits +50% loading on standard rates. Personal Care $102/hr is within $68 x 1.5 = $102 cap. Travel allowance at $0.92/km is exactly at policy limit. Cultural/Interpreter services pre-approved.",
      actionRecommendation: "Auto-Approve - Remote loadings correctly applied"
    },
    validationResults: [
      { ruleId: 'R-01', ruleName: 'ABN_VALID', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'R-02', ruleName: 'PO_EXISTS', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'AI-MMM-CHECK', ruleName: 'REMOTE_LOADING_VALID', severity: ValidationSeverity.INFO, result: 'PASS', details: 'MMM-7 loading of 50% correctly applied to all service rates' },
      { ruleId: 'AI-PRICE-CHECK', ruleName: 'PRICE_REASONABLE', severity: ValidationSeverity.INFO, result: 'PASS' }
    ]
  },

  // INV-DEV-009: Unapproved high-value item without specific approval (Robert)
  {
    id: 'inv-dev-009',
    tenantId: 't-dev-001',
    intakeId: 'INV-20251217-009',
    supplierName: 'Mobility Solutions Australia',
    supplierABN: '34 901 234 567',
    invoiceNumber: 'MSA-4422',
    invoiceDate: '2025-12-17',
    totalAmount: 4500.00,
    poNumberExtracted: 'PO-DEV-004',
    poNumberMatched: 'PO-DEV-004',
    status: InvoiceStatus.NEEDS_REVIEW,
    confidenceScore: 0.86,
    fileUrl: 'https://picsum.photos/600/818',
    lineItems: [
      { description: 'Electric Hospital Bed - Full Adjustable', serviceDate: '2025-12-16', qty: 1, unitPrice: 4500.00, lineTotal: 4500.00, mappedServiceCode: 'SAH-EQUIP-01' }
    ],
    riskAssessment: {
      level: RiskLevel.HIGH,
      score: 85,
      justification: "AI-APPROVAL-CHECK: FAIL (+50 points). Item 'Electric Hospital Bed' ($4500) exceeds $1500 threshold and requires specific care plan approval. Client has approval for 'Specialized Equipment > $3000' but this item is $1500 over the approved limit. AI-PRICE-CHECK: WARN (+35 points).",
      actionRecommendation: "Hold - Verify updated care plan approval for $4500 equipment"
    },
    validationResults: [
      { ruleId: 'R-01', ruleName: 'ABN_VALID', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'R-02', ruleName: 'PO_EXISTS', severity: ValidationSeverity.INFO, result: 'PASS' },
      { ruleId: 'AI-APPROVAL-CHECK', ruleName: 'SPECIFIC_APPROVAL_REQUIRED', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Equipment $4500 exceeds approved limit of $3000. Requires updated care plan approval.' },
      { ruleId: 'R-05', ruleName: 'AMOUNT_WITHIN_LIMITS', severity: ValidationSeverity.WARN, result: 'FAIL', details: 'Single invoice consumes 55% of remaining quarterly budget' }
    ]
  },

  // INV-DEV-010: Multi-issue complex invoice - Multiple violations (Nancy)
  {
    id: 'inv-dev-010',
    tenantId: 't-dev-001',
    intakeId: 'INV-20251218-010',
    supplierName: 'Questionable Care Pty Ltd',
    supplierABN: '45 012 345 678',
    invoiceNumber: 'QC-0001',
    invoiceDate: '2025-12-18',
    totalAmount: 3500.00,
    poNumberExtracted: 'PO-DEV-005',
    poNumberMatched: 'PO-DEV-005',
    status: InvoiceStatus.NEEDS_REVIEW,
    confidenceScore: 0.65,
    fileUrl: 'https://picsum.photos/600/819',
    lineItems: [
      { description: 'Administrative Services', serviceDate: '2025-12-17', qty: 1, unitPrice: 1000.00, lineTotal: 1000.00, mappedServiceCode: 'UNKNOWN' },
      { description: 'Gift Vouchers for Client Wellbeing', serviceDate: '2025-12-17', qty: 5, unitPrice: 100.00, lineTotal: 500.00, mappedServiceCode: 'UNKNOWN' },
      { description: 'Weekend Personal Care', serviceDate: '2025-12-16', qty: 10, unitPrice: 200.00, lineTotal: 2000.00, mappedServiceCode: 'SAH-PC-01' }
    ],
    riskAssessment: {
      level: RiskLevel.HIGH,
      score: 100,
      justification: "CRITICAL: Multiple severe violations detected. AI-FRAUD-CHECK: FAIL - Round $1000 amount, vague 'Administrative Services'. AI-POLICY-COMPLIANCE: FAIL - 'Gift Vouchers' are FORBIDDEN items per policy. AI-FRAUD-CHECK: FAIL - 2025-12-16 is MONDAY, not weekend. AI-PRICE-CHECK: FAIL - $200/hr personal care rate is 3x policy cap.",
      actionRecommendation: "REJECT IMMEDIATELY - Multiple fraud indicators and policy violations. Flag supplier for review."
    },
    validationResults: [
      { ruleId: 'AI-FRAUD-CHECK', ruleName: 'FRAUD_INDICATORS', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Round $1000 amount and vague "Administrative Services" description' },
      { ruleId: 'AI-POLICY-COMPLIANCE', ruleName: 'FORBIDDEN_ITEMS', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Gift vouchers/gift cards are FORBIDDEN per procurement policy' },
      { ruleId: 'AI-FRAUD-CHECK', ruleName: 'WEEKEND_BILLING', severity: ValidationSeverity.FAIL, result: 'FAIL', details: '2025-12-16 (Monday) billed as weekend - fraudulent surcharge' },
      { ruleId: 'AI-PRICE-CHECK', ruleName: 'PRICE_REASONABLE', severity: ValidationSeverity.FAIL, result: 'FAIL', details: 'Personal Care at $200/hr is 294% above $68/hr policy cap' },
      { ruleId: 'AI-CONTRACTOR-CHECK', ruleName: 'CONTRACTOR_VERIFICATION', severity: ValidationSeverity.WARN, result: 'FAIL', details: 'Supplier "Questionable Care Pty Ltd" not found on approved contractor list' }
    ]
  }
];
