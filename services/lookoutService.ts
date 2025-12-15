
/**
 * LOOKOUT WAY API SERVICE
 * 
 * Integration layer for The Lookout Way (Support at Home / HCP software).
 * Standard Endpoint: https://api.thelookoutway.com/v1 (Simulation)
 */

import { LookoutConfig } from '../types';

export const authenticateLookout = async (config: LookoutConfig): Promise<boolean> => {
    // SIMULATION: Verify API Key against Lookout Auth Service
    console.log(`Authenticating with Lookout Endpoint: ${config.apiEndpoint}`);
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Basic validation
    if (config.apiKey && config.apiKey.length > 5) {
        return true;
    }
    throw new Error("Invalid API Key");
};

export const syncClientsFromLookout = async (config: LookoutConfig): Promise<{ count: number, clients: any[] }> => {
    if (!config.connected) throw new Error("Lookout not connected");

    // SIMULATION: GET /v1/clients
    console.log(`Fetching clients from Lookout...`);
    await new Promise(resolve => setTimeout(resolve, 1800));

    // Mock Response mimicking Lookout's structure
    const mockClients = [
        {
            id: "LOOK-8821",
            first_name: "Arthur",
            last_name: "Dent",
            status: "active",
            funding_package: "HCP Level 3",
            current_balance: 13000.00
        },
        {
            id: "LOOK-9932",
            first_name: "Ford",
            last_name: "Prefect",
            status: "active",
            funding_package: "CHSP",
            current_balance: 200.00
        },
        {
            id: "LOOK-0001",
            first_name: "Zaphod",
            last_name: "Beeblebrox",
            status: "suspended",
            funding_package: "Private",
            current_balance: 0.00
        }
    ];

    return {
        count: mockClients.length,
        clients: mockClients
    };
};

export const getLookoutPurchaseOrders = async (config: LookoutConfig) => {
    // SIMULATION: GET /v1/purchase_orders?status=active
    // This connects the 'Validation Service' to real PO data.
    console.log(`Fetching active Purchase Orders from Lookout...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
        { po_number: 'PO-998877', client_id: 'LOOK-8821', amount_cap: 15000, valid_until: '2023-12-31' },
        { po_number: 'PO-554433', client_id: 'LOOK-9932', amount_cap: 3000, valid_until: '2024-06-01' }
    ];
};
