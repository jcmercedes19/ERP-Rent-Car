import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, query, where, serverTimestamp, onSnapshot } from 'firebase/firestore';

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
  createdAt: any;
}

interface BranchState {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  unsubscribeSnapshot: (() => void) | null;
  fetchBranches: () => void;
  createBranch: (data: Omit<Branch, 'id' | 'companyId' | 'createdAt'>) => Promise<void>;
}

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [],
  loading: false,
  error: null,
  unsubscribeSnapshot: null,

  fetchBranches: () => {
    const { user } = useAuthStore.getState();
    if (!user?.companyId) return;

    const existingUnsubscribe = get().unsubscribeSnapshot;
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'branches'), where('companyId', '==', user.companyId));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const branches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
        set({ branches, loading: false });
      }, (error) => {
        set({ error: error.message, loading: false });
      });

      set({ unsubscribeSnapshot: unsubscribe });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createBranch: async (data) => {
    const { user } = useAuthStore.getState();
    if (!user?.companyId) throw new Error('No company ID');

    set({ loading: true, error: null });
    try {
      const newRef = doc(collection(db, 'branches'));
      const newBranch = {
        ...data,
        id: newRef.id,
        companyId: user.companyId,
        createdAt: serverTimestamp(),
      };

      await setDoc(newRef, newBranch);
      set(state => ({
        branches: [...state.branches, newBranch as any],
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
