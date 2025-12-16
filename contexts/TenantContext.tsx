
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { TenantConfig, TenantFeatures, TenantStatus } from '../types';
import { fetchTenants, createTenantInDb, updateTenantInDb, deleteTenantInDb } from '../services/dbService';

interface TenantContextType {
  tenant: TenantConfig | null; // The currently active tenant for the view
  setTenant: (tenant: TenantConfig | null) => void;
  tenants: TenantConfig[]; // Master list for Superuser
  isLoading: boolean;
  createTenant: (config: Omit<TenantConfig, 'id' | 'createdAt' | 'status'>) => Promise<string | null>;
  updateTenantFeatures: (id: string, features: TenantFeatures) => Promise<void>;
  updateTenantStatus: (id: string, status: TenantStatus) => Promise<void>;
  updateTenantDetails: (id: string, updates: Partial<TenantConfig>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  brandColor: (opacity?: number) => string;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Load from Supabase
  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTenants();
      setTenants(data);
      // Auto-select first tenant if none selected and not superuser mode? 
      // We'll leave selection logic to Login/App component
    } catch (error) {
      console.error("Failed to load tenants", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const createTenant = async (config: Omit<TenantConfig, 'id' | 'createdAt' | 'status'>): Promise<string | null> => {
    try {
      const newId = await createTenantInDb(config);
      await loadTenants(); // Refresh list
      return newId;
    } catch (e) {
      console.error("Failed to create tenant", e);
      throw e;
    }
  };

  const updateTenantFeatures = async (id: string, features: TenantFeatures) => {
    try {
      // Optimistic update
      setTenants(prev => prev.map(t => t.id === id ? { ...t, features } : t));
      if (tenant && tenant.id === id) setTenant({ ...tenant, features });
      
      await updateTenantInDb(id, { features });
    } catch (e) {
      console.error("Failed to update features", e);
      loadTenants(); // Revert on error
    }
  };

  const updateTenantStatus = async (id: string, status: TenantStatus) => {
    try {
      setTenants(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      if (tenant && tenant.id === id) setTenant({ ...tenant, status });

      await updateTenantInDb(id, { status });
    } catch (e) {
      console.error("Failed to update status", e);
      loadTenants();
    }
  };

  const updateTenantDetails = async (id: string, updates: Partial<TenantConfig>) => {
    try {
      setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      if (tenant && tenant.id === id) setTenant({ ...tenant, ...updates });

      await updateTenantInDb(id, updates);
    } catch (e) {
      console.error("Failed to update details", e);
      loadTenants();
    }
  };

  const deleteTenant = async (id: string) => {
    try {
      await deleteTenantInDb(id);
      setTenants(prev => prev.filter(t => t.id !== id));
      if (tenant && tenant.id === id) setTenant(null);
    } catch (e) {
      console.error("Failed to delete tenant", e);
    }
  };

  // Helper to generate dynamic styles
  const brandColor = (opacity: number = 1) => {
    if (!tenant) return `rgba(37, 99, 235, ${opacity})`;
    // Convert hex to rgb for opacity if needed, or simple return if opacity 1
    // Simplified for now
    return tenant.primaryColor;
  };

  return (
    <TenantContext.Provider value={{ 
        tenant, setTenant, tenants, isLoading, 
        createTenant, updateTenantFeatures, updateTenantStatus, 
        updateTenantDetails, deleteTenant, brandColor, refreshTenants: loadTenants 
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
