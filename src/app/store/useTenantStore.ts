import { create } from 'zustand';

export interface Membership {
  companyId: string;
  roleId: string;
  branchIds: string[];
}

export interface Company {
  id: string;
  name: string;
  tradeName?: string;
  logo?: string;
}

interface TenantState {
  activeCompany: Company | null;
  activeBranchId: string | null;
  memberships: Membership[];
  setTenantContext: (company: Company, branchId: string) => void;
  setActiveBranch: (branchId: string) => void;
  setMemberships: (memberships: Membership[]) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  activeCompany: null,
  activeBranchId: null,
  memberships: [],
  setTenantContext: (company, branchId) => set({ activeCompany: company, activeBranchId: branchId }),
  setActiveBranch: (branchId) => set({ activeBranchId: branchId }),
  setMemberships: (memberships) => set({ memberships }),
  clearTenant: () => set({ activeCompany: null, activeBranchId: null, memberships: [] }),
}));
