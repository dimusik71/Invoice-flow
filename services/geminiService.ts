
import { GoogleGenAI } from "@google/genai";
import { Invoice, ValidationResult, ValidationSeverity, PolicyDocument, RiskAssessment, RiskLevel, PurchaseOrder, SpendingAnalysis, Client, ChiefAuditorReview, WeeklySystemAuditReport, RejectionDrafts, ComplianceTemplate, ComplianceField, ComplianceAuditResult } from '../types';
import { MOCK_POS } from '../constants';

// Default fallback key
const DEFAULT_API_KEY = process.env.API_KEY || 'dummy-key'; 

// --- MODEL ROUTING CONFIGURATION ---
// "AI agents will use an LLM that is appropriate to the task to be more efficient and cost efficient."
const MODEL_ROUTER = {
    // TIER 1: HIGH VELOCITY / LOW COST
    // Use for: Simple chat, basic text generation, UI strings.
    // Cost: ~$0.075 / 1M tokens
    FAST: 'gemini-2.5-flash-lite-preview-02-05', 

    // TIER 2: BALANCED / STANDARD TOOLS
    // Use for: OCR, Web Search Grounding, Branding, General Summarization.
    // Cost: ~$0.10 / 1M tokens
    STANDARD: 'gemini-2.5-flash',

    // TIER 3: HIGH INTELLIGENCE / REASONING
    // Use for: Deep Audits, Fraud Detection, Complex Math, Financial Analysis.
    // Cost: ~$1.25 / 1M tokens (Significantly higher, use sparingly)
    COMPLEX: 'gemini-3-pro-preview'
};

type TaskComplexity = 'FAST' | 'STANDARD' | 'COMPLEX';

const getOptimalModel = (complexity: TaskComplexity) => {
    return MODEL_ROUTER[complexity];
};

// Simulated Internal Database of Approved Contractors
const MOCK_APPROVED_CONTRACTORS_DB = `
OFFICIAL APPROVED CONTRACTOR LIST (INTERNAL DB):
1. BrightSide Care Pty Ltd (ABN: 51 824 753 556) - Status: ACTIVE, Compliant
2. Green Thumb Gardening (ABN: 12 345 678 901) - Status: ACTIVE, Compliant
3. Fast Transport Services (ABN: 123 456 789) - Status: ACTIVE, Compliant
4. Support Warriors (ABN: 99 888 777 666) - Status: REVIEW_PENDING (Missing Insurance Cert)
`;

// Government Knowledge Base for AI Context (UPDATED TO SUPPORT AT HOME)
const GOV_RATES_KB = `
GOVERNMENT SUBSIDY & RULE KNOWLEDGE BASE (SUPPORT AT HOME REFORMS 2025):

*** IMPORTANT: HCP HAS BEEN REPLACED BY "SUPPORT AT HOME" (8 CLASSIFICATION LEVELS) ***

SUPPORT AT HOME (SAH) - 8-TIER CLASSIFICATION SYSTEM (OFFICIAL 2025 DAILY RATES):
- Level 1: $29.40 / day (~$10,731 / yr)
- Level 2: $43.93 / day (~$16,034 / yr)
- Level 3: $60.18 / day (~$21,965 / yr)
- Level 4: $81.36 / day (~$29,696 / yr)
- Level 5: $108.76 / day (~$39,697 / yr)
- Level 6: $131.82 / day (~$48,114 / yr)
- Level 7: $159.31 / day (~$58,148 / yr)
- Level 8: $213.99 / day (~$78,106 / yr)

MODIFIED MONASH MODEL (MMM) - REMOTE AREA LOADINGS (Multiplier on Daily Rate):
- MMM 1-4 (Major Cities to Rural): Standard funding (100% of price guide).
- MMM 5 (Remote Fringe): +15% loading.
- MMM 6 (Remote): +40% loading.
- MMM 7 (Very Remote): +50% loading.
AI MUST factor this loading when calculating "Reasonable Price" for services in these areas.

DUAL FUNDING & DISEASE SPECIFIC SCHEMES (DOUBLE DIPPING RULES):
1. CONTINENCE AIDS PAYMENT SCHEME (CAPS):
   - If a client has 'caps_continence' active, they receive a separate annual payment (~$700) for pads/aids.
   - RULE: Do NOT approve bulk invoices for incontinence pads from the SAH Package if the client is receiving CAPS, unless the clinical need EXCEEDS the CAPS allowance. Flag for "Double Dipping Review".

2. STOMA APPLIANCE SCHEME (SAS):
   - If a client has 'sas_stoma' active, stoma bags/appliances are free/subsidized via Stoma Associations.
   - RULE: Reject invoices for "Stoma Bags" billed to the package. The package can pay for *nursing care* to assist with stoma, but NOT the product itself (which is covered by SAS).

3. NATIONAL DIABETES SERVICES SCHEME (NDSS):
   - If a client has 'ndss_diabetes' active, needles/syringes/test strips are subsidized.
   - RULE: Reject invoices for full-price diabetes consumables.

4. HEARING SERVICES PROGRAM (HSP):
   - Covers hearing assessments and devices.
   - RULE: Flag hearing aid invoices to ensure HSP eligibility was utilized first.

5. DVA GOLD CARD: 
   - Covers all clinically necessary health care. 
   - RULE: Reject "Nursing" or "Medical" invoices on SAH package if Gold Card exists.

ALLOWABLE SERVICE GROUPS (QUARTERLY BUDGETS APPLY):
1. Clinical Care (Nursing, Allied Health)
2. Independence (Personal Care, Domestic Assistance)
3. Everyday Living (Meals, Transport, Gardening)

SPECIFIC PROGRAM RULES:
1. Restorative Care (STRC): Time-limited (8 weeks). GOAL: Re-ablement.
2. Palliative Care: GOAL: End-of-life comfort. Priority on pain management/nursing.
3. Assistive Technology (AT) Rules:
   - Low Risk (<$1500): Auto-approve if allowed in Care Plan.
   - Mid/High Risk (>$1500): REQUIRES Specific Written Approval (OT Assessment) attached to client file.

EXCLUSIONS (ALL PACKAGES):
- General income support, Rent, Electricity (unless medically required life support), Gambling, Holidays.
`;

// Helper to get client with optional override
const getAiClient = (apiKeyOverride?: string) => {
    const key = (apiKeyOverride && apiKeyOverride.trim().length > 0) ? apiKeyOverride : DEFAULT_API_KEY;
    return new GoogleGenAI({ apiKey: key });
};

// SIMULATED DATE for consistency with Mock Data (Invoices are Oct 2023)
const SIMULATED_TODAY = '2023-10-28';

/**
 * 1. Image Analysis
 * ROUTING: STANDARD (Gemini Flash)
 * Reasoning: Flash Vision is highly capable of OCR and 10x cheaper/faster than Pro.
 */
export const extractInvoiceDataFromImage = async (base64Image: string, mimeType: string, apiKeyOverride?: string) => {
  try {
    const ai = getAiClient(apiKeyOverride);
    const model = getOptimalModel('STANDARD'); // Use Flash for efficiency
    
    const prompt = `
      You are an expert OCR Specialist for financial documents.
      Analyze this invoice image. Extract the following details in JSON format:
      - supplierName
      - supplierABN (if visible)
      - invoiceNumber
      - invoiceDate
      - totalAmount (numeric)
      - lineItems (array of objects with description, quantity, unitPrice, lineTotal)
      
      Only return valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    return response.text;
  } catch (error) {
    console.error("Image Extraction Error:", error);
    throw error;
  }
};

/**
 * 13. Extract Client Profile from Document (Care Plan / Intake Form)
 * ROUTING: COMPLEX (Gemini 3 Pro)
 * Reasoning: Documents are dense (PDF/Word) and require complex extraction of specific funding codes and dates.
 */
export const extractClientProfileFromDocument = async (
    base64Data: string, 
    mimeType: string, 
    apiKeyOverride?: string
): Promise<Partial<Client> & { 
    fundingSource?: string, 
    mmmLevel?: string, 
    dvaCardType?: string,
    detectedSchemes?: string[],
    detectedSupplements?: string[],
    isIndigenous?: boolean,
    isClaimsConference?: boolean,
    missingData?: string[]
}> => {
    try {
        const ai = getAiClient(apiKeyOverride);
        const model = getOptimalModel('COMPLEX');

        const prompt = `
            You are a Clinical Data Entry Specialist for Aged Care.
            Analyze the attached document (Care Plan, Intake Form, or Funding Agreement).
            
            Extract the following client details into a JSON object. Be extremely precise with Funding Levels and Supplements.
            
            1. Basic Info: Name, Email, Phone, Integration ID (Ref/NDIS No).
            2. Funding Source: 'SAH_LEVEL_1' to 'SAH_LEVEL_8', 'NDIS', 'CHSP', 'DVA'. 
               - Look for "Level 3 Package" -> SAH_LEVEL_3.
            3. MMM Level: Look for "Modified Monash Model" or address based remoteness. Return '1' to '7'. If unsure/not found, return null.
            4. DVA Card: Look for 'Gold Card', 'White Card', 'Orange Card'. Return 'GOLD', 'WHITE', 'ORANGE' or null.
            5. Disease Specific Schemes: Look for keywords: "CAPS", "Continence Aids", "Stoma", "SAS", "NDSS", "Diabetes", "Hearing Services", "HSP".
               - Return array 'detectedSchemes': ['caps_continence', 'sas_stoma', 'ndss_diabetes', 'hsp_hearing'].
            6. Supplements: Look for keywords: "Dementia", "Cognition", "Oxygen", "Enteral Feeding", "Veterans Supplement". Return array 'detectedSupplements': ['dementia_cognition', 'oxygen', 'enteral_feeding', 'veterans_supplement'].
            7. Special Status: 
               - "Aboriginal" or "Torres Strait Islander" -> isIndigenous: true.
               - "Claims Conference" or "Holocaust" -> isClaimsConference: true.
            8. Specific Approvals: Extract high cost items approved (e.g. "Wheelchair approved", "Bathroom Mod").
            9. Missing Data: List any critical fields that appear to be missing from the document (e.g. "Missing Date of Birth", "Missing DVA Number").

            OUTPUT JSON STRICTLY:
            {
                "name": "string",
                "email": "string",
                "phone": "string",
                "integrationId": "string",
                "totalBudgetCap": number,
                "budgetRenewalDate": "YYYY-MM-DD",
                "fundingSource": "string", 
                "mmmLevel": "string",
                "dvaCardType": "string",
                "detectedSchemes": ["string"],
                "detectedSupplements": ["string"],
                "isIndigenous": boolean,
                "isClaimsConference": boolean,
                "specificApprovals": ["string"],
                "missingData": ["string"]
            }
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI extraction");
        
        return JSON.parse(text);

    } catch (error) {
        console.error("Client Profile Extraction Error:", error);
        throw error;
    }
};

/**
 * 2. Deep Audit (Forensic Specialist)
 * ROUTING: COMPLEX (Gemini 3 Pro)
 * Reasoning: Requires deep reasoning, policy cross-referencing, and complex rule adherence. 
 * High cost is justified by risk mitigation value.
 */
export const performDeepAudit = async (
  invoice: Invoice, 
  policyContext: string = "", 
  customPromptOverride?: string,
  policyFiles: PolicyDocument[] = [],
  apiKeyOverride?: string,
  client?: Client // New optional Client Context
): Promise<{ report: string; validationResults: ValidationResult[]; riskAssessment?: RiskAssessment }> => {
  try {
    const ai = getAiClient(apiKeyOverride);
    const model = getOptimalModel('COMPLEX'); // Use Pro for Auditing
    const invoiceContext = JSON.stringify(invoice, null, 2);
    
    // Inject PO Context for budget check
    const poNumber = invoice.poNumberMatched || invoice.poNumberExtracted;
    const poContext = poNumber && MOCK_POS[poNumber] ? JSON.stringify(MOCK_POS[poNumber], null, 2) : "NO_PO_FOUND";

    // Inject Client Funding Context with detailed financial tracking
    // UPDATED: Now includes MMM, DVA, and Specific Supplements logic
    const clientFundingContext = client ? `
      CLIENT SPECIFIC FUNDING PROFILE (CRITICAL FOR VALIDATION):
      - Name: ${client.name}
      - Status: ${client.status}
      - Primary Funding: ${client.fundingPackages.map(p => p.source).join(', ')} (Levels 1-8 determine permitted scope).
      - MMM Location: ${client.mmmLevel || '1'}. (If >= 5, allow +15-50% price loading on services).
      - DVA Status: ${client.dvaCardType || 'None'}. (If GOLD, medical/nursing items should often be billed to DVA, NOT the package. Flag potential dual-funding error).
      - Active Disease Schemes: ${client.activeSchemes?.join(', ') || 'None'}. (If present, CHECK FOR DOUBLE DIPPING. E.g. If 'caps_continence' is active, do not allow bulk pads on package).
      - Active Supplements: ${client.fundingPackages.flatMap(p => p.supplements).join(', ') || 'None'}. (e.g. 'Oxygen' permits oxygen tank rental).
      - Special Status: Indigenous: ${client.isIndigenous}, Claims Conf: ${client.isClaimsConference}.
      - Specific Approvals (Care Plan): ${client.specificApprovals?.join(', ') || 'None'}. (Items >$1500 MUST be here).
      - Budget: Cap $${client.totalBudgetCap}, Used $${client.totalBudgetUsed}.
    ` : "NO_CLIENT_LINKED - Assume Standard Level 3 Rules for generic audit. No client-specific overrides available.";

    const basePrompt = customPromptOverride || `
      You are a Forensic Audit AI Specialist with deep expertise in Australian Government Subsidies (Aged Care/NDIS).
      Your goal is to detect Fraud, Waste, and Abuse (FWA) with extreme precision.

      Task: Perform a deep forensic audit of this invoice.
      
      1. PRICE REASONABLENESS (Forensic Check):
         - Compare unit prices against the NDIS Price Guide 2023-24 (latest available equivalents) and Market Rates.
         - CHECK CLIENT MMM LEVEL: If Client MMM is 5, 6, or 7, allow higher prices (Remote Area Loading). Do not flag as overprice if within loading limits (MMM 6 = +40%, MMM 7 = +50%).
         - Flag any service > 10% above benchmark (adjusted for MMM).
         - Analyze 'Weekend' or 'After Hours' loadings. Verify if the 'serviceDate' was actually a weekend/public holiday.

      2. FRAUD INDICATORS (Red Flags):
         - Round dollar amounts (e.g. $500.00 exactly).
         - Sequential invoice numbers from the same supplier in short succession.
         - Vague descriptions (e.g. "Services Rendered" or "Consulting").
         - Duplicate line items.

      3. CONTRACTOR COMPLIANCE:
         - Check supplier against the 'OFFICIAL APPROVED CONTRACTOR LIST'.
         - Verify ABN validity format.
         - Flag if the supplier name suggests a conflict of interest (e.g. same surname as client - requires manual check).

      4. FUNDING PACKAGE SCOPE & DOUBLE DIPPING CHECK (Critical):
         - Use the "CLIENT SPECIFIC FUNDING PROFILE".
         - CHECK ACTIVE SCHEMES: If client has 'sas_stoma' (Stoma Scheme) or 'caps_continence' (CAPS), STRICTLY REJECT invoices for products covered by those schemes (stoma bags, pads) unless justification is provided.
         - DUAL FUNDING CHECK: If Client has DVA GOLD CARD and invoice is for "Nursing" or "Medical", FLAG WARN: "Potential DVA overlap. Check if this should be claimed via DVA."
         - SPECIFIC APPROVALS: Any item >$1500 MUST exist in 'Specific Approvals'. If missing, FAIL.

      5. POLICY COMPLIANCE:
         - Cross-reference with the provided 'ORGANISATIONAL POLICIES' and attached PDF rules.
         - Strict adherence to Rate Caps and Prohibited Items.

      6. RISK SCORING:
         - Assign a risk score (0-100).
         - Score > 70 is HIGH.
         - Score > 30 is MEDIUM.
         - Provide a granular justification citing specific rules (e.g. "Violation of Rule 4.2 in Procurement Policy").
    `;

    const finalPrompt = `
      Current Simulation Date: ${SIMULATED_TODAY}

      ${basePrompt}

      ${MOCK_APPROVED_CONTRACTORS_DB}

      ${GOV_RATES_KB}

      ${clientFundingContext}

      ${policyContext ? `\n\nCRITICAL: Refer to the following ORGANISATIONAL POLICIES (Text Snippets) when auditing:\n${policyContext}\n` : ''}
      
      ${policyFiles.length > 0 ? `\n\n[PRIORITY INSTRUCTION: PDF POLICY ANALYSIS]\nAttached are ${policyFiles.length} PDF document(s) representing the OFFICIAL ORGANISATIONAL POLICIES. \n\nYOU MUST:\n1.  Read the attached PDF files.\n2.  Extract specific rules such as Rate Caps (e.g., max hourly rates), Mileage limits, and Prohibited Items.\n3.  Strictly cross-reference every invoice line item against these extracted rules.\n4.  If a violation is found (e.g., unit price exceeds PDF rate cap), you MUST flag it in 'AI-POLICY-COMPLIANCE' and cite the specific PDF page or section if possible.` : ''}

      7. ADVANCED BUDGET & FUNDING ANALYSIS (MANDATORY):
      Analyze the financial impact using the provided 'Purchase Order Data' and 'Client Funding Profile'.
      
      A. QUARTERLY CAP CHECK (Purchase Order Limits):
         - Look at 'quarterlyBudgetCap' and 'currentQuarterSpend' in PO Data.
         - Calculate: New Total = Current Quarter Spend + Invoice Total.
         - RULE: If New Total > Quarterly Cap -> Flag 'AI-BUDGET-CHECK' as FAIL. Severity: HIGH. Details: "Invoice causes quarterly cap breach by $X".
         - RULE: If New Total > 90% of Quarterly Cap -> Flag 'AI-BUDGET-CHECK' as WARN. Severity: WARN. Details: "Approaching quarterly limit (X% used)".

      B. ANNUAL CAP CHECK (Client Limits):
         - Look at 'Total Annual Budget Cap' and 'Funds Used Year-to-Date' in Client Profile.
         - RULE: If (Funds Used YTD + Invoice Total) > Total Annual Budget Cap -> Flag 'AI-BUDGET-CHECK' as FAIL. Severity: HIGH. Details: "Invoice causes Annual Budget cap breach".

      C. PACKAGE LEVEL COST ALIGNMENT:
         - Check 'Funding Classification' in Client Profile (e.g., SAH_LEVEL_1).
         - RULE: If Level 1 or 2 AND Invoice Total > $400 -> Flag 'AI-FUNDING-ALIGNMENT' as WARN. Justification: "High single invoice amount ($X) for low-level support package (Level 1/2). Risk of rapid fund depletion."
         - RULE: If Level 3+ AND Single Line Item > $1000 AND NOT in 'Specific Approvals' -> Flag 'AI-FUNDING-ALIGNMENT' as WARN. Justification: "High value item > $1000 requires explicit care plan approval."

      Purchase Order Data:
      ${poContext}

      Invoice Data:
      ${invoiceContext}
      
      IMPORTANT FORMATTING INSTRUCTION: 
      - The 'report' field MUST be PLAIN TEXT only. Do NOT use Markdown (no asterisks, no hashes, no bold/italic). Use only standard spacing, bullet points (using dashes -), and newlines for structure.
      
      You MUST output a JSON object with the following structure:
      {
        "report": "A detailed plain text analysis of the findings.",
        "riskAssessment": {
          "level": "LOW" | "MEDIUM" | "HIGH",
          "score": 0-100,
          "justification": "Detailed explanation in plain text...",
          "actionRecommendation": "Auto-Approve" | "Manual Review" | "Reject"
        },
        "validationResults": [
          {
            "ruleId": "AI-AGING-CHECK",
            "ruleName": "Invoice Aging (60 Days)",
            "severity": "FAIL" | "WARN" | "INFO",
            "result": "PASS" | "FAIL",
            "details": "..."
          },
          {
            "ruleId": "AI-FRAUD-CHECK",
            "ruleName": "AI Fraud Detection",
            "severity": "FAIL" | "WARN" | "INFO",
            "result": "PASS" | "FAIL",
            "details": "..."
          },
          {
            "ruleId": "AI-PRICE-CHECK",
            "ruleName": "Price Reasonableness",
            "severity": "FAIL" | "WARN" | "INFO",
            "result": "PASS" | "FAIL",
            "details": "..."
          },
           {
            "ruleId": "AI-BUDGET-CHECK",
            "ruleName": "Budget Sufficiency Check (Quarterly & Annual)",
            "severity": "FAIL" | "WARN" | "INFO",
            "result": "PASS" | "FAIL",
            "details": "..."
          },
          {
            "ruleId": "AI-CONTRACTOR-CHECK",
            "ruleName": "Contractor Compliance",
            "severity": "FAIL" | "WARN" | "INFO",
            "result": "PASS" | "FAIL",
            "details": "..."
          },
          {
            "ruleId": "AI-POLICY-COMPLIANCE",
            "ruleName": "Policy Compliance",
            "severity": "FAIL" | "WARN" | "INFO",
            "result": "PASS" | "FAIL",
            "details": "..."
          },
          {
            "ruleId": "AI-FUNDING-ALIGNMENT",
            "ruleName": "Support at Home (8-Level) Alignment",
            "severity": "FAIL" | "WARN" | "INFO",
            "result": "PASS" | "FAIL",
            "details": "..."
          }
        ]
      }
    `;

    // Construct message parts: Prompt Text + PDF Files
    const parts: any[] = [{ text: finalPrompt }];

    // Append policy files as inline data (Base64)
    if (policyFiles && policyFiles.length > 0) {
      policyFiles.forEach(file => {
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        });
      });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 16384 },
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Deep Audit Error:", error);
    return {
      report: "Deep audit service unavailable due to an error.",
      riskAssessment: {
        level: RiskLevel.MEDIUM,
        score: 50,
        justification: "Audit service failed, defaulting to manual review.",
        actionRecommendation: "Manual Review"
      },
      validationResults: [{
        ruleId: 'AI-ERROR',
        ruleName: 'AI Audit Service',
        severity: ValidationSeverity.WARN,
        result: 'FAIL',
        details: 'Service unavailable. ' + error
      }]
    };
  }
};

/**
 * 3. Spending Analysis (Actuarial Care Analyst)
 * ROUTING: COMPLEX (Gemini 3 Pro)
 * Reasoning: Involves mathematical reasoning and strategic care planning.
 */
export const analyzeSpendingPatterns = async (
  po: PurchaseOrder, 
  invoiceAmount: number, 
  apiKeyOverride?: string
): Promise<SpendingAnalysis> => {
  try {
     const ai = getAiClient(apiKeyOverride);
     const model = getOptimalModel('COMPLEX');
     
     const prompt = `
        You are a Senior Financial Care Analyst acting as an Actuary.
        
        Task: Analyze spending velocity and liquidity risk for client "${po.clientName}".

        Client Financial Data:
        - Quarterly Budget Cap: $${po.quarterlyBudgetCap}
        - Current Quarter Spend: $${po.currentQuarterSpend}
        - Current Invoice Amount: $${invoiceAmount}
        - Quarter End Date: ${po.currentQuarterEnd}
        - Current Simulation Date: ${SIMULATED_TODAY}

        Analysis Requirements:
        1. Calculate 'Run Rate' vs 'Ideal Burn Rate'.
        2. Identify 'Underspend Risk': If >15% funds remain with <3 weeks left, flag as risk of losing government entitlement (clawback).
        3. Identify 'Overspend Risk': If projected spend exceeds cap before renewal.
        4. Prioritize Critical Care: If overspending, suggest cutting 'Domestic Assistance' before 'Personal Care'.

        Provide strategic recommendations to the Care Manager.
        IMPORTANT: Output strings in PLAIN TEXT ONLY. NO MARKDOWN formatting.

        OUTPUT JSON:
        {
           "status": "NORMAL" | "OVERSPEND_RISK" | "UNDERSPEND_RISK",
           "summary": "Actuarial summary of the financial situation.",
           "unspentAmount": number,
           "unspentPercentage": number,
           "recommendations": [
              "Strategy 1",
              "Strategy 2"
           ],
           "carePlanReviewNeeded": boolean
        }
     `;

    const response = await ai.models.generateContent({
      model: model,
      contents: { text: prompt },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI Analysis");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Spending Analysis Error:", error);
    return {
        status: 'NORMAL',
        summary: 'Analysis unavailable.',
        unspentAmount: 0,
        unspentPercentage: 0,
        recommendations: ['Manual review required due to system error.'],
        carePlanReviewNeeded: true
    };
  }
};

/**
 * 4. NEW: Chief Auditor Review (The "Last Say")
 * ROUTING: COMPLEX (Gemini 3 Pro)
 * Reasoning: Persona-based nuanced decision making requiring thinking budget.
 */
export const reviewComplexCase = async (
    invoice: Invoice,
    client: Client | undefined,
    previousAudit: RiskAssessment,
    apiKeyOverride?: string
): Promise<ChiefAuditorReview> => {
    try {
        const ai = getAiClient(apiKeyOverride);
        const model = getOptimalModel('COMPLEX');

        const prompt = `
            You are the Chief Financial Auditor (CFA) for a government oversight body.
            PROFILE: 30 years of experience across Federal Government Audit, Big 4 Consulting (Forensic Accounting), and Healthcare Regulation.
            
            YOUR ROLE: You verify the work of junior AI agents. You have the final say on complex or high-risk cases.
            
            CASE DATA:
            - Invoice Total: $${invoice.totalAmount}
            - Supplier: ${invoice.supplierName}
            - Service Description: ${invoice.lineItems.map(l => l.description).join(', ')}
            - Client Funding: ${client ? client.fundingPackages.map(p => p.source).join(', ') : 'Unknown'}
            
            JUNIOR AGENT FINDING:
            - Risk Score: ${previousAudit.score}/100
            - Justification: ${previousAudit.justification}
            - Recommendation: ${previousAudit.actionRecommendation}

            TASK:
            Review the evidence. Is the Junior Agent correct? 
            - If the Junior Agent flagged "Potential Fraud" but it looks like a legitimate "Assistive Tech" purchase within guidelines, OVERRIDE to Approve.
            - If the Junior Agent flagged "Low Risk" but you see a "Conflict of Interest" or "Scope Creep" (e.g. Gardening for a Level 8 Palliative client), OVERRIDE to Reject.
            - Be extremely strict on "Scope of Practice" and "Value for Money" principles (PGPA Act).

            IMPORTANT: Output all text fields as PLAIN TEXT ONLY. NO MARKDOWN (no **, ##).

            OUTPUT JSON:
            {
                "determination": "UPHOLD_REJECTION" | "OVERRIDE_APPROVE" | "REQUIRE_ADDITIONAL_EVIDENCE",
                "confidence": 0-100,
                "finalVerdict": "A definitive, authoritative statement explaining your ruling.",
                "regulatoryCitations": ["Aged Care Act 2024 Section X", "NDIS Pricing Arrangements"],
                "auditLogEntry": "Formal log entry for the permanent record."
            }
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: { text: prompt },
            config: {
                thinkingConfig: { thinkingBudget: 16384 },
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from Chief Auditor");
        return JSON.parse(text);

    } catch (error) {
        console.error("Chief Auditor Error", error);
        throw error;
    }
}

/**
 * 5. NEW: Weekly System Audit (The "Scrutiny")
 * ROUTING: COMPLEX (Gemini 3 Pro)
 * Reasoning: Large context window analysis of multiple records.
 */
export const performWeeklySystemAudit = async (
    invoices: Invoice[],
    apiKeyOverride?: string
): Promise<WeeklySystemAuditReport> => {
    try {
        const ai = getAiClient(apiKeyOverride);
        const model = getOptimalModel('COMPLEX');

        // Prepare a summary of the week's data
        const summaryData = invoices.map(inv => ({
            id: inv.id,
            supplier: inv.supplierName,
            amount: inv.totalAmount,
            status: inv.status,
            riskScore: inv.riskAssessment?.score,
            autoDecision: inv.riskAssessment?.actionRecommendation
        }));

        const prompt = `
            You are the Chief Financial Auditor performing a WEEKLY SYSTEM INTEGRITY AUDIT.
            
            DATASET: ${summaryData.length} Invoices processed this week.
            RAW DATA: ${JSON.stringify(summaryData.slice(0, 50))} (Truncated to last 50 for token limit).

            OBJECTIVE:
            Scrutinize the performance of the sub-agents and human approvers.
            1. Identify Systemic Drift: Are we approving too many high-risk items?
            2. Detect Fraud Rings: Are there recurring suppliers across multiple clients with borderline invoices?
            3. Evaluate AI Performance: Did the AI flag items that humans ultimately rejected? Or did humans override the AI frequently?

            IMPORTANT: Output all text fields as PLAIN TEXT ONLY. NO MARKDOWN (no **, ##).

            OUTPUT JSON:
            {
                "period": "Week ending ${SIMULATED_TODAY}",
                "systemHealthScore": 0-100,
                "agentPerformance": {
                    "accuracy": 0-100,
                    "falsePositives": 0,
                    "summary": "Assessment of junior AI performance."
                },
                "humanOversightAnalysis": "Analysis of how humans interacted with AI decisions.",
                "fraudTrends": ["Trend 1", "Trend 2"],
                "criticalRecommendations": ["Rec 1", "Rec 2"]
            }
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: { text: prompt },
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from Weekly Audit");
        return JSON.parse(text);

    } catch (error) {
        console.error("Weekly Audit Error", error);
        throw error;
    }
}

/**
 * 6. Generate Rejection Drafts
 * ROUTING: COMPLEX (Gemini 3 Pro)
 * Reasoning: Requires legislative knowledge, empathy, and professional communication.
 */
export const generateRejectionDrafts = async (
    invoice: Invoice,
    client: Client | undefined,
    apiKeyOverride?: string
): Promise<RejectionDrafts> => {
    try {
        const ai = getAiClient(apiKeyOverride);
        const model = getOptimalModel('COMPLEX');

        // AGGREGATE REASONS: Combine system validation failures with AI risk assessment
        const failedValidationRules = invoice.validationResults
            .filter(r => r.result === 'FAIL')
            .map(r => `• System Rule '${r.ruleName}' Failed: ${r.details || 'Criteria not met'}`)
            .join('\n');

        const aiRiskJustification = invoice.riskAssessment?.justification 
            ? `• AI Risk Analysis: ${invoice.riskAssessment.justification}`
            : '';

        const fullRejectionContext = [failedValidationRules, aiRiskJustification]
            .filter(Boolean)
            .join('\n\n') || "Non-compliance with internal procurement policies.";

        const prompt = `
            You are an expert Caseworker and Accounts Payable Officer for an Australian Aged Care provider.
            
            SCENARIO: An invoice has been REJECTED. You must draft TWO DISTINCT emails for different audiences.
            
            CONTEXT DATA:
            - Invoice Number: ${invoice.invoiceNumber || 'Unknown'}
            - Supplier: ${invoice.supplierName || 'Vendor'}
            - Client: ${client ? client.name : 'Unidentified Client (PO Missing)'}
            - Funding Program: ${client ? client.fundingPackages.map(p => p.source).join(', ') : 'Support at Home (General)'}
            - Invoice Total: $${invoice.totalAmount}
            
            REJECTION REASONS (CRITICAL):
            ${fullRejectionContext}
            
            ---
            
            TASK 1: VENDOR EMAIL (STRICTLY PROFESSIONAL/TECHNICAL)
            - Goal: Technical resolution and correction.
            - Tone: Professional, firm, transactional.
            - Content Instructions:
              1. Explicitly request clarification and a corrected invoice/credit note.
              2. Explain exactly why it was rejected based on the reasons above.
              3. Reference government rules (e.g., 'A New Tax System (GST) Act 1999' for invalid ABNs, 'NDIS Pricing Arrangements' for price caps).
              4. Reference 'Organisational Procurement Policy' (e.g., missing PO numbers).
            
            TASK 2: CLIENT EMAIL (STRICTLY SIMPLE/SUPPORTIVE)
            - Goal: Transparency, education, and reassurance.
            - Tone: Empathetic, VERY SIMPLE language (Grade 8 reading level), supportive.
            - Content Instructions:
              1. Explain clearly WHY it was rejected using simple terms (e.g., instead of "Invalid GST calculation", say "The tax amount on the bill was incorrect").
              2. Provide justification by referencing legislation/rules but keeping it simple (e.g. "Under the Support at Home rules, we cannot pay for...").
              3. Explain what we have done to rectify the issue (e.g., "We have contacted the provider to ask for a fixed invoice").
              4. Explain next steps (e.g., "You do not need to do anything right now. We will process payment once the provider fixes this").
              5. MANDATORY: Provide options for feedback and complaint to external agencies.
                 - Include: "If you are unhappy with this decision, you can contact the Aged Care Quality and Safety Commission (ACQSC) on 1800 951 822 or visit www.agedcarequality.gov.au".
            
            IMPORTANT: The content of these two emails must be COMPLETELY DIFFERENT. Do not copy paste. The client email must feel personal and caring. The vendor email must feel strict and business-like.
            
            ---
            
            CRITICAL FORMATTING INSTRUCTION: 
            - OUTPUT PLAIN TEXT ONLY. 
            - NO MARKDOWN (no asterisks **, no headers ##). 
            - Use only standard spacing and newlines.
            
            OUTPUT JSON STRICTLY:
            {
                "vendorEmail": {
                    "to": "${invoice.supplierName} Accounts Dept",
                    "subject": "ACTION REQUIRED: Invoice ${invoice.invoiceNumber} Rejected - ${invoice.supplierName}",
                    "body": "Full text of vendor email..."
                },
                "clientEmail": {
                    "to": "${client ? client.email : 'Client Email'}",
                    "subject": "Update regarding invoice from ${invoice.supplierName}",
                    "body": "Full text of client email..."
                }
            }
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: { text: prompt },
            config: {
                thinkingConfig: { thinkingBudget: 16384 },
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI for Rejection Drafts");
        return JSON.parse(text);

    } catch (error) {
        console.error("Rejection Draft Gen Error", error);
        throw error;
    }
};

/**
 * 7. B2G COMPLIANCE: Template Analyzer
 * ROUTING: STANDARD (Gemini Flash)
 * Reasoning: Flash Vision is efficient for analyzing form layouts and detecting fields.
 */
export const parseComplianceTemplate = async (
    base64Image: string, 
    mimeType: string, 
    apiKeyOverride?: string
): Promise<{ fields: ComplianceField[], templateName: string, authority: string }> => {
    try {
        const ai = getAiClient(apiKeyOverride);
        const model = getOptimalModel('STANDARD');

        const prompt = `
            You are a Government Form Digitization Specialist.
            Analyze the attached form image (e.g., Services Australia, NDIS Claim).
            
            Your goal is to extract the input schema so we can recreate this form digitally.
            
            Tasks:
            1. Identify the FORM NAME (e.g., "NDIS Payment Request Form").
            2. Identify the AUTHORITY (e.g., "Services Australia", "NDIS", "DVA").
            3. Detect all input fields required. For each field:
               - Create an ID (camelCase).
               - Determine the Label.
               - Determine Type (text, date, currency, checkbox).
               - GUESS a 'mappedKey' from our internal system if obvious. 
                 Available Keys: 'client.name', 'client.ndisNumber', 'invoice.totalAmount', 'invoice.date', 'invoice.supplierName', 'invoice.number'.
                 If no obvious map, leave mappedKey null.
            
            OUTPUT JSON:
            {
                "templateName": "Form Name",
                "authority": "Authority Name",
                "fields": [
                    { "id": "claimAmount", "label": "Claim Amount", "type": "currency", "required": true, "mappedKey": "invoice.totalAmount" },
                    ...
                ]
            }
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Image } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from Form Analyzer");
        return JSON.parse(text);

    } catch (error) {
        console.error("Compliance Template Parse Error:", error);
        throw error;
    }
};

/**
 * 8. B2G COMPLIANCE: Superagent Auditor
 * ROUTING: COMPLEX (Gemini 3 Pro)
 * Reasoning: Requires high precision, calculation checks, and logical consistency verification.
 */
export const auditComplianceForm = async (
    formData: Record<string, any>,
    template: ComplianceTemplate,
    invoice: Invoice,
    apiKeyOverride?: string
): Promise<ComplianceAuditResult> => {
    try {
        const ai = getAiClient(apiKeyOverride);
        const model = getOptimalModel('COMPLEX');

        const prompt = `
            You are an AI Superagent for Government Compliance Auditing (Services Australia / NDIS / DVA).
            Your job is to prevent form rejection by validating data BEFORE submission.
            
            INPUT DATA:
            1. Form Data (User Input): ${JSON.stringify(formData)}
            2. Form Template Schema: ${JSON.stringify(template.fields)}
            3. Original Invoice Source Truth: ${JSON.stringify(invoice)}
            
            TASK:
            Perform a strict row-by-row and field-by-field compliance check.
            
            RULES:
            1. **Missing Data**: Flag any field marked 'required' in schema that is empty or null.
            2. **Format Errors**: Check if 'date' fields match YYYY-MM-DD or DD/MM/YYYY standards. Check if 'currency' is numeric.
            3. **Consistency Check**: 
               - Compare 'claimAmount' (or similar money fields) in Form Data vs 'totalAmount' in Invoice Source Truth. If they differ > $0.01, flag CRITICAL.
               - Check if 'supplierName' matches approximately.
            4. **Logic Checks**: 
               - If the form has a 'Total' field, verify it equals the sum of line items (if applicable).
            5. **Sanity Check**: Flag unrealistic dates (e.g. future service dates, or dates > 1 year old).
            
            IMPORTANT: Output all text strings in PLAIN TEXT ONLY. NO MARKDOWN.

            OUTPUT JSON STRICTLY:
            {
                "passed": boolean, // True ONLY if NO Critical issues found.
                "summary": "Brief executive summary of findings.",
                "issues": [
                    {
                        "fieldId": "field_id_from_schema",
                        "severity": "CRITICAL" | "WARNING",
                        "message": "Specific error explanation",
                        "suggestedFix": "The corrected value (optional, ONLY if you are 100% sure, e.g. from Source Invoice)"
                    }
                ]
            }
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: { text: prompt },
            config: {
                thinkingConfig: { thinkingBudget: 16384 },
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI Auditor");
        return JSON.parse(text);

    } catch (error) {
        console.error("Compliance Audit Error:", error);
        throw error;
    }
};

/**
 * 9. Fast Responses (Chat)
 * ROUTING: FAST (Gemini 2.5 Flash Lite)
 * Reasoning: Chat requires low latency. Flash Lite is extremely efficient.
 */
export const quickChat = async (history: string[], newMessage: string, invoiceContext: string, apiKeyOverride?: string) => {
  try {
    const ai = getAiClient(apiKeyOverride);
    const model = getOptimalModel('FAST'); // Flash Lite for speed/cost
    
    // Construct simplified history context
    const chatHistory = history.map((msg, i) => `${i % 2 === 0 ? 'User' : 'AI'}: ${msg}`).join('\n');

    const prompt = `
      Context: ${invoiceContext}
      
      Chat History:
      ${chatHistory}
      
      User: ${newMessage}
      
      Answer briefly and accurately as a helpful assistant.
      IMPORTANT: Output PLAIN TEXT ONLY. NO MARKDOWN (no asterisks, bold, etc).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Quick Chat Error:", error);
    return "I couldn't generate a fast response at this time.";
  }
};

/**
 * 10. Search Grounding
 * ROUTING: STANDARD (Gemini 2.5 Flash)
 * Reasoning: Requires Google Search Tool which is optimal on Flash Standard.
 */
export const verifySupplierWeb = async (supplierName: string, apiKeyOverride?: string) => {
  try {
    const ai = getAiClient(apiKeyOverride);
    const model = getOptimalModel('STANDARD'); // Flash Standard supports Search tool well
    const prompt = `Perform a background check on "${supplierName}". 
    1. Is this a legitimate active business? 
    2. What are their primary services? 
    3. Do they seem relevant to 'Support at Home' (aged care/disability)?
    Provide a concise 2-3 sentence summary. Do not explicitly list sources in the text response as they are provided automatically.
    IMPORTANT: Output PLAIN TEXT ONLY. NO MARKDOWN.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return {
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Search Grounding Error:", error);
    throw error;
  }
};

/**
 * 11. Specialized Support Agent
 * ROUTING: STANDARD (Gemini 2.5 Flash)
 * Reasoning: Requires search for latest legislation updates, good balance of cost/intelligence.
 */
export const consultAccountantSupport = async (
  history: {role: 'user' | 'model', text: string}[], 
  userMessage: string, 
  apiKeyOverride?: string
) => {
  try {
    const ai = getAiClient(apiKeyOverride);
    const model = getOptimalModel('STANDARD'); // Flash is sufficient for chat with tools
    const currentDate = new Date().toDateString();

    const systemInstruction = `
      You are 'Marcus', a Senior Software Support Specialist with over 20 years of experience dedicated to supporting accountants, bookkeepers, and financial officers.
      
      CURRENT DATE: ${currentDate}

      CORE INSTRUCTIONS:
      1. FORMATTING: You must output PLAIN TEXT ONLY. Do not use Markdown (no asterisks, no hashes, no bold/italic). Use only standard spacing and newlines for structure.
      2. PERSONA: Professional, calm, and articulate. You value data integrity. You speak the language of accountants (e.g., 'reconciliation', 'variance', 'compliance').
      3. KNOWLEDGE BASE: You have deep knowledge of 'InvoiceFlow' (the current app) AND Australian Legislation.
      4. LEGISLATIVE CURRENCY: You must ALWAYS verify your advice against the most current legislation. Do not rely on outdated acts.
      5. PRIVACY: Adhere to Australian Privacy Principles (APP). Do not ask for or store PII (Personally Identifiable Information) in chat. Advise users that data is processed locally for sovereignty.

      LEGISLATIVE REFERENCE GUIDE (CRITICAL UPDATE):
      - Aged Care: Refer strictly to the 'Aged Care Act 2024' (New Act) and the 'Support at Home' program reforms. Do NOT reference the 1997 Act unless explaining historical context.
      - Tax: Refer to 'A New Tax System (Goods and Services Tax) Act 1999' for GST queries.
      - NDIS: Refer to 'NDIS Pricing Arrangements and Price Limits' (Current Financial Year).
      - Business Check: Refer to 'Australian Business Register (ABR)' requirements for ABN validation.

      APP CONTEXT:
      - Features: OCR Extraction, Deep Audit (Gemini 3 Pro), Xero Integration (Draft Bills), PO Matching (Lookutway).
      - If a user asks about an error, explain the likely accounting impact (e.g. "This extraction error will cause a variance in your Sub-ledger if not corrected").
      
      TOOL USAGE:
      - You have access to Google Search. If you are unsure about a specific legislative change (e.g., "What is the 2024 cap for personal care?"), you MUST use the search tool to verify before answering.

      GOAL: Guide the user through the system while ensuring they feel legally and financially compliant.
    `;
    
    // Construct the conversation history string
    const conversation = history.map(msg => `${msg.role === 'user' ? 'User' : 'Marcus'}: ${msg.text}`).join('\n');
    
    const prompt = `
      ${conversation}
      User: ${userMessage}
      Marcus:
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }], // Enable search for real-time checking
      }
    });

    return response.text;
  } catch (error) {
    console.error("Support Agent Error:", error);
    return "I apologize, but I am currently unable to access the support knowledge base. Please ensure your API key is configured correctly.";
  }
};

/**
 * 12. AI Branding Generator
 * ROUTING: FAST (Gemini 2.5 Flash Lite)
 * Reasoning: Simple JSON generation, does not require complex reasoning.
 */
export const generateBrandingProfile = async (
  websiteUrl: string,
  logoBase64: string | null,
  apiKeyOverride?: string
): Promise<{ primaryColor: string, secondaryColor: string, accentColor: string }> => {
  try {
    const ai = getAiClient(apiKeyOverride);
    // Use FAST model if no website search needed, else STANDARD for tool support
    const model = websiteUrl ? getOptimalModel('STANDARD') : getOptimalModel('FAST');

    const parts: any[] = [];
    
    // Add Logo if available
    if (logoBase64) {
       parts.push({
          inlineData: {
             mimeType: 'image/png', // Assuming PNG/JPG generic handling
             data: logoBase64
          }
       });
    }

    const promptText = `
      You are a UI/UX Brand Expert.
      Analyze the visual identity based on the following inputs:
      ${websiteUrl ? `1. Website URL: ${websiteUrl} (Use Google Search to find the brand visual style)` : ''}
      ${logoBase64 ? `2. The attached logo image.` : ''}

      TASK:
      Generate a professional color palette for a corporate dashboard application.
      
      OUTPUT JSON STRICTLY:
      {
        "primaryColor": "#hex", // The dominant brand color
        "secondaryColor": "#hex", // A darker, complementary shade for sidebars/headers
        "accentColor": "#hex" // A vibrant, high-contrast color for buttons/highlights
      }
      
      Rules:
      - Ensure 'secondaryColor' is dark enough for white text to be readable.
      - Ensure 'primaryColor' is not pure white or pure black.
    `;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            tools: websiteUrl ? [{ googleSearch: {} }] : undefined
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);

  } catch (error) {
      console.error("Branding Gen Error:", error);
      // Fallback
      return {
          primaryColor: '#3b82f6',
          secondaryColor: '#1e3a8a',
          accentColor: '#f59e0b'
      };
  }
};
