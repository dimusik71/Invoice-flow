
import { AuditPromptConfig } from '../types';

export const assembleAuditPrompt = (config: AuditPromptConfig, policyDocuments: string = ''): string => {
  // Filter out empty prompt sections to allow for granular enabling/disabling
  const tasks = [
    config.priceReasonableness,
    config.fraudIndicators,
    config.contractorCompliance,
    config.consistencyCheck,
    config.riskAssessment
  ].filter(task => task && task.trim().length > 0);

  return `
    Perform a deep forensic audit of this invoice for a "Support at Home" scheme.
    
    Task:
    ${tasks.map((task, index) => `${index + 1}. ${task}`).join('\n    ')}
    
    ${policyDocuments ? `\nCRITICAL: Refer to the following ORGANISATIONAL POLICIES (Text Snippets) when auditing:\n${policyDocuments}\n` : ''}
  `;
};
