import { create } from 'zustand';


export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  companyId?: string;
  role?: string;
  branchId?: string;
}

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));
