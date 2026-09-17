import { create } from 'zustand';
import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, getDocs, query, where, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

export interface ContractTemplate {
  id: string;
  companyId: string;
  title: string;
  content: string;
  createdAt: any;
  updatedAt: any;
}

interface ContractTemplateState {
  templates: ContractTemplate[];
  loading: boolean;
  error: string | null;
  fetchTemplates: (companyId: string) => Promise<void>;
  addTemplate: (data: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTemplate: (id: string, data: Partial<ContractTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useContractTemplateStore = create<ContractTemplateState>((set) => ({
  templates: [],
  loading: false,
  error: null,

  fetchTemplates: async (companyId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'contractTemplates'), where('companyId', '==', companyId));
      const querySnapshot = await getDocs(q);
      const templates = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContractTemplate));
      
      // Sort by creation date
      templates.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      set({ templates, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addTemplate: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRef = doc(collection(db, 'contractTemplates'));
      const newTemplate = {
        ...data,
        id: newRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(newRef, newTemplate);
      
      set((state) => ({ 
        templates: [newTemplate as any, ...state.templates],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateTemplate: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const tRef = doc(db, 'contractTemplates', id);
      await updateDoc(tRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      
      set((state) => ({
        templates: state.templates.map(t => t.id === id ? { ...t, ...data } : t),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteTemplate: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'contractTemplates', id));
      set((state) => ({
        templates: state.templates.filter(t => t.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
