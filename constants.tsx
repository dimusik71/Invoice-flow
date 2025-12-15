
import { Invoice, InvoiceStatus, ValidationSeverity, PurchaseOrder, RiskLevel, Client } from './types';

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'CLIENT-101',
    tenantId: 't-001', // CareFirst
    name: 'Arthur Dent',
    email: 'arthur@dent.com',
    phone: '0400 123 456',
    integrationId: 'LOOK-8821',
    status: 'ACTIVE',
    totalBudgetCap: 15000.00,
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
    specificApprovals: ['Complex Home Modification (Ramp) > $2000']
  },
  {
    id: 'CLIENT-202',
    tenantId: 't-001', // CareFirst
    name: 'Ford Prefect',
    email: 'ford@prefect.com',
    phone: '0400 999 888',
    integrationId: 'LOOK-9932',
    status: 'ACTIVE',
    totalBudgetCap: 3000.00,
    totalBudgetUsed: 2800.00,
    budgetRenewalDate: '2023-12-31',
    activePO: 'PO-554433',
    documents: [
       { id: 'doc-3', name: 'Service_Agreement_Signed.pdf', type: 'SERVICE_AGREEMENT', size: 2400000, uploadDate: '2023-06-01', url: '#' }
    ],
    fundingPackages: [
      { source: 'SAH_LEVEL_3', startDate: '2023-06-01', supplements: [] }
    ],
    specificApprovals: []
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
    specificApprovals: ['Assistive Technology - Comm Device']
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
    quarterlyBudgetCap: 15000.00,
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
    quarterlyBudgetCap: 3000.00,
    currentQuarterSpend: 2800.00,
    currentQuarterEnd: '2023-12-31',

    validFrom: '2023-06-01',
    validTo: '2024-06-01'
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
  }
];
