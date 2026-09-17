import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  manager: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
}

interface BranchState {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  fetchBranches: () => Promise<void>;
  createBranch: (data: Omit<Branch, 'id' | 'companyId' | 'createdAt'>) => Promise<void>;
}

export const useBranchStore = create<BranchState>((set) => ({
  branches: [],
  loading: false,
  error: null,

  fetchBranches: async () => {
    const { user } = useAuthStore.getState();
    if (!user?.companyId) return;

    set({ loading: true, error: null });
    try {
      const mockBranches: Branch[] = [
        {
          id: 'BR-001',
          companyId: user.companyId,
          name: 'Sede Principal - Santo Domingo',
          address: 'Av. Winston Churchill 101',
          city: 'Santo Domingo',
          phone: '809-555-1234',
          email: 'sd@rentcar.com',
          manager: 'Juan Pérez',
          status: 'ACTIVE',
          createdAt: new Date()
        }
      ];
      set({ branches: mockBranches, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createBranch: async (data) => {
    const { user } = useAuthStore.getState();
    if (!user?.companyId) throw new Error('No company ID');

    set({ loading: true, error: null });
    try {
      const newBranch: Branch = {
        ...data,
        id: `BR-${Date.now()}`,
        companyId: user.companyId,
        createdAt: new Date(),
      };

      set(state => ({
        branches: [...state.branches, newBranch],
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
