import { Invoice, ValidationResult, ValidationSeverity } from '../types';
import { MOCK_POS } from '../constants';

/**
 * SIMULATED LOOKUTWAY SYSTEM VALIDATION
 * 
 * In a production environment, this would:
 * 1. Call the Lookutway API to fetch the PO details.
 * 2. Retrieve the Client's Care Plan / Budget status.
 * 3. Compare strictly against the Invoice data.
 */

export const validateInvoiceAgainstSystem = async (invoice: Invoice): Promise<{ results: ValidationResult[], matchedPo?: string }> => {
  const results: ValidationResult[] = [];
  const poNumber = invoice.poNumberExtracted || invoice.poNumberMatched;
  
  // 1. PO EXISTENCE CHECK
  if (!poNumber) {
    results.push({
      ruleId: 'SYS-PO-MISSING',
      ruleName: 'Lookutway PO Check',
      severity: ValidationSeverity.FAIL,
      result: 'FAIL',
      details: 'No Purchase Order number found on invoice.'
    });
    return { results };
  }

  // Simulate API lookup delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const po = MOCK_POS[poNumber];

  if (!po) {
    results.push({
      ruleId: 'SYS-PO-NOTFOUND',
      ruleName: 'Lookutway PO Check',
      severity: ValidationSeverity.FAIL,
      result: 'FAIL',
      details: `PO '${poNumber}' does not exist in Lookutway active orders.`
    });
    return { results };
  }

  // PO Found - Add success record
  results.push({
    ruleId: 'SYS-PO-FOUND',
    ruleName: 'Lookutway PO Check',
    severity: ValidationSeverity.INFO,
    result: 'PASS',
    details: `Linked to Client ${po.clientId} (Valid: ${po.validFrom} to ${po.validTo})`
  });

  // 2. BUDGET / LIMIT CHECK
  if (invoice.totalAmount > po.budgetRemaining) {
    results.push({
      ruleId: 'SYS-BUDGET-EXCEEDED',
      ruleName: 'Budget Availability',
      severity: ValidationSeverity.FAIL, // Strict fail
      result: 'FAIL',
      details: `Invoice total ($${invoice.totalAmount}) exceeds PO remaining budget ($${po.budgetRemaining}).`
    });
  } else {
    results.push({
      ruleId: 'SYS-BUDGET-OK',
      ruleName: 'Budget Availability',
      severity: ValidationSeverity.INFO,
      result: 'PASS',
      details: `Funds available. Remaining after this: $${(po.budgetRemaining - invoice.totalAmount).toFixed(2)}`
    });
  }

  // 3. SERVICE DATE VALIDITY
  const invDate = new Date(invoice.invoiceDate);
  const validFrom = new Date(po.validFrom);
  const validTo = new Date(po.validTo);

  if (isNaN(invDate.getTime())) {
     results.push({
      ruleId: 'SYS-DATE-INVALID',
      ruleName: 'Service Period Check',
      severity: ValidationSeverity.WARN,
      result: 'FAIL',
      details: `Invoice date '${invoice.invoiceDate}' could not be parsed.`
    });
  } else if (invDate < validFrom || invDate > validTo) {
    results.push({
      ruleId: 'SYS-DATE-RANGE',
      ruleName: 'Service Period Check',
      severity: ValidationSeverity.FAIL,
      result: 'FAIL',
      details: `Service date is outside PO validity period (${po.validFrom} - ${po.validTo}).`
    });
  } else {
    results.push({
      ruleId: 'SYS-DATE-OK',
      ruleName: 'Service Period Check',
      severity: ValidationSeverity.INFO,
      result: 'PASS',
      details: 'Invoice date is within approved service period.'
    });
  }

  // 4. CARE PLAN ALIGNMENT (Approved Service Codes)
  // Check if line items map to codes allowed on the PO
  const unapprovedServices: string[] = [];
  
  invoice.lineItems.forEach(item => {
    // If we have a mapped code, check it. 
    // If no code is mapped, we flag it as potential risk or try to fuzzy match description (omitted for brevity)
    if (item.mappedServiceCode) {
      if (!po.serviceCodes.includes(item.mappedServiceCode)) {
        unapprovedServices.push(`${item.description} (${item.mappedServiceCode})`);
      }
    } else if (item.description) {
        // Simple heuristic: if description contains "Gardening" and PO has "GARD-01", pass it
        // This simulates a mapping engine.
        const isGardening = item.description.toLowerCase().includes('garden') || item.description.toLowerCase().includes('lawn');
        if (isGardening && !po.serviceCodes.includes('GARD-01')) {
             unapprovedServices.push(`${item.description} (Detected: Gardening)`);
        }
    }
  });

  if (unapprovedServices.length > 0) {
    results.push({
      ruleId: 'SYS-CAREPLAN-MISMATCH',
      ruleName: 'Client Care Plan Compliance',
      severity: ValidationSeverity.FAIL,
      result: 'FAIL',
      details: `Services not approved in client plan: ${unapprovedServices.join(', ')}`
    });
  } else {
    results.push({
      ruleId: 'SYS-CAREPLAN-OK',
      ruleName: 'Client Care Plan Compliance',
      severity: ValidationSeverity.INFO,
      result: 'PASS',
      details: 'All services match approved categories in Care Plan.'
    });
  }

  return { results, matchedPo: poNumber };
};