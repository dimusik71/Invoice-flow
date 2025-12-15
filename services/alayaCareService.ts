
/**
 * ALAYACARE API SERVICE
 * 
 * Based on AlayaCare External Integration Documentation.
 * Base URL pattern: https://{tenant}.alayacare.com/api/v1
 */

import { AlayaCareConfig } from '../types';

interface AlayaCareClient {
  id: number;
  first_name: string;
  last_name: string;
  status: string;
  funding_source?: string;
}

interface AlayaCareVisit {
  id: number;
  client_id: number;
  start_at: string;
  end_at: string;
  approved: boolean;
}

export const authenticateAlayaCare = async (config: AlayaCareConfig): Promise<boolean> => {
    // SIMULATION: Exchange Client ID/Secret for Bearer Token
    // Endpoint: POST /api/v1/oauth/token (or similar auth endpoint depending on version)
    console.log(`Authenticating with AlayaCare tenant: ${config.tenantUrl}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (config.clientId && config.clientSecret) {
        return true;
    }
    throw new Error("Invalid credentials");
};

export const syncClientsFromAlayaCare = async (config: AlayaCareConfig): Promise<{ count: number, clients: any[] }> => {
    if (!config.connected) throw new Error("AlayaCare not connected");

    // SIMULATION: GET /api/v1/clients
    console.log(`Fetching clients from ${config.tenantUrl}/api/v1/clients...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock Response based on AlayaCare JSON structure
    const mockClients = [
        {
            id: 8821,
            first_name: "Arthur",
            last_name: "Dent",
            email: "arthur@dent.com",
            phone: "0400 123 456",
            status: "active",
            balance: 13000.00
        },
        {
            id: 9932,
            first_name: "Ford",
            last_name: "Prefect",
            email: "ford@prefect.com",
            phone: "0400 999 888",
            status: "active",
            balance: 200.00
        }
    ];

    return {
        count: mockClients.length,
        clients: mockClients
    };
};

export const verifyVisitExists = async (clientId: string, date: string, config: AlayaCareConfig): Promise<boolean> => {
    // SIMULATION: GET /api/v1/visits?client_id={id}&start_date={date}&end_date={date}
    // This checks if a service was actually scheduled/delivered on the invoice date.
    console.log(`Checking visits for Client ${clientId} on ${date}...`);
    
    // Randomly return true for demo purposes
    return true;
};

export const getClientFunding = async (clientId: string, config: AlayaCareConfig) => {
    // SIMULATION: GET /api/v1/clients/{id}/services (or accounting/budgets)
    // Checks available funds.
    return {
        source: 'HCP Level 3',
        budget_remaining: 4500.50
    };
};
