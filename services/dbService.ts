
import { supabase } from './supabaseClient';
import { Client, TenantConfig, TenantFeatures, TenantStatus } from '../types';
import { INITIAL_TENANTS } from '../constants';

// --- CONNECTION CHECK ---
export const checkDatabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Attempt to fetch a single row from tenants to verify access
    const { data, error } = await supabase.from('tenants').select('count', { count: 'exact', head: true });
    
    if (error) {
        console.error("Supabase Connection Check Failed:", error);
        return { success: false, message: `Error: ${error.message}` };
    }
    
    return { success: true, message: 'Connected to Supabase' };
  } catch (e: any) {
    console.error("Supabase Network Error:", e);
    return { success: false, message: `Network Error: ${e.message || 'Unknown'}` };
  }
};

// --- TENANT SERVICES ---

export const fetchTenants = async (): Promise<TenantConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase: Fetch tenants failed', JSON.stringify(error, null, 2));
      throw error;
    }

    // STRICT MODE: Return exactly what is in the DB. No mock fallbacks.
    return data.map(t => ({
      id: t.id,
      name: t.name,
      status: t.status,
      createdAt: t.created_at,
      // Map JSONB columns back to TS interfaces
      primaryColor: t.config?.primaryColor || '#3b82f6',
      secondaryColor: t.config?.secondaryColor || '#1e40af',
      accentColor: t.config?.accentColor || '#3b82f6',
      logoUrl: t.config?.logoUrl,
      features: t.config?.features || { aiAudit: true, xeroIntegration: false },
      documentSettings: t.config?.documentSettings
    }));
  } catch (err) {
    console.error('Supabase: Network/Client error', err);
    return []; // Return empty if failed, do not fall back to mocks to avoid confusion
  }
};

export const createTenantInDb = async (tenant: Omit<TenantConfig, 'id' | 'createdAt' | 'status'>) => {
  const newTenantId = crypto.randomUUID();
  
  try {
    const { error } = await supabase
      .from('tenants')
      .insert({
        id: newTenantId,
        name: tenant.name,
        status: 'ACTIVE',
        // Store UI config and features in a JSONB column 'config'
        config: {
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          accentColor: tenant.accentColor,
          logoUrl: tenant.logoUrl,
          features: tenant.features,
          documentSettings: tenant.documentSettings
        }
      });

    if (error) {
        console.error("Supabase: Create Tenant Failed", JSON.stringify(error));
        throw error;
    }
    return newTenantId;
  } catch (e) {
      console.error("Supabase Write Failed", e);
      throw e; 
  }
};

export const updateTenantInDb = async (id: string, updates: Partial<TenantConfig>) => {
  try {
    // First fetch existing to merge config
    const { data: existing, error: fetchError } = await supabase.from('tenants').select('config').eq('id', id).single();
    
    if (fetchError || !existing) {
        console.warn("Supabase: Update failed - Tenant not found or DB error");
        return; 
    }

    const newConfig = {
        ...existing.config,
        ...(updates.primaryColor && { primaryColor: updates.primaryColor }),
        ...(updates.secondaryColor && { secondaryColor: updates.secondaryColor }),
        ...(updates.accentColor && { accentColor: updates.accentColor }),
        ...(updates.logoUrl !== undefined && { logoUrl: updates.logoUrl }),
        ...(updates.features && { features: updates.features }),
        ...(updates.documentSettings && { documentSettings: updates.documentSettings }),
    };

    const dbUpdates: any = { config: newConfig };
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.status) dbUpdates.status = updates.status;

    const { error } = await supabase
      .from('tenants')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
  } catch (e) {
      console.error("Supabase Update Failed", e);
      throw e;
  }
};

export const deleteTenantInDb = async (id: string) => {
  try {
    const { error } = await supabase.from('tenants').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
      console.error("Supabase Delete Failed", e);
      throw e;
  }
};

// --- CLIENT SERVICES ---

export const fetchClientsForTenant = async (tenantId: string): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Supabase: Error fetching clients', JSON.stringify(error));
      throw error;
    }

    return data.map(c => ({
      id: c.id,
      tenantId: c.tenant_id,
      name: c.name,
      email: c.email,
      phone: c.phone || '',
      integrationId: c.integration_id,
      status: c.status,
      totalBudgetCap: c.details?.totalBudgetCap || 0,
      totalBudgetUsed: c.details?.totalBudgetUsed || 0,
      budgetRenewalDate: c.details?.budgetRenewalDate || new Date().toISOString().split('T')[0],
      documents: c.details?.documents || [],
      activePO: c.details?.activePO || '',
      fundingPackages: c.details?.fundingPackages || [],
      specificApprovals: c.details?.specificApprovals || [],
      dvaCardType: c.details?.dvaCardType,
      mmmLevel: c.details?.mmmLevel,
      isIndigenous: c.details?.isIndigenous,
      isClaimsConference: c.details?.isClaimsConference,
      isPrivateFunded: c.details?.isPrivateFunded,
      activeSchemes: c.details?.activeSchemes || []
    }));
  } catch (err) {
      console.error('Supabase: Network error fetching clients', err);
      return [];
  }
};

export const createClientInDb = async (client: Client) => {
  try {
    const { error } = await supabase
      .from('clients')
      .insert({
        id: client.id, 
        tenant_id: client.tenantId,
        name: client.name,
        email: client.email,
        phone: client.phone,
        integration_id: client.integrationId,
        status: client.status,
        // Store complex nested objects in JSONB 'details'
        details: {
          totalBudgetCap: client.totalBudgetCap,
          totalBudgetUsed: client.totalBudgetUsed,
          budgetRenewalDate: client.budgetRenewalDate,
          documents: client.documents,
          activePO: client.activePO,
          fundingPackages: client.fundingPackages,
          specificApprovals: client.specificApprovals,
          dvaCardType: client.dvaCardType,
          mmmLevel: client.mmmLevel,
          isIndigenous: client.isIndigenous,
          isClaimsConference: client.isClaimsConference,
          isPrivateFunded: client.isPrivateFunded,
          activeSchemes: client.activeSchemes
        }
      });

    if (error) throw error;
  } catch (e) {
      console.error("Supabase: Create Client Failed", e);
      throw e;
  }
};

export const updateClientInDb = async (client: Client) => {
  try {
    const { error } = await supabase
      .from('clients')
      .update({
        name: client.name,
        email: client.email,
        phone: client.phone,
        integration_id: client.integrationId,
        status: client.status,
        details: {
          totalBudgetCap: client.totalBudgetCap,
          totalBudgetUsed: client.totalBudgetUsed,
          budgetRenewalDate: client.budgetRenewalDate,
          documents: client.documents,
          activePO: client.activePO,
          fundingPackages: client.fundingPackages,
          specificApprovals: client.specificApprovals,
          dvaCardType: client.dvaCardType,
          mmmLevel: client.mmmLevel,
          isIndigenous: client.isIndigenous,
          isClaimsConference: client.isClaimsConference,
          isPrivateFunded: client.isPrivateFunded,
          activeSchemes: client.activeSchemes
        }
      })
      .eq('id', client.id);

    if (error) throw error;
  } catch (e) {
      console.error("Supabase: Update Client Failed", e);
      throw e;
  }
};
