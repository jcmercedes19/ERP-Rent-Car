import { create } from 'zustand';
import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, getDocs, query, where, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

export interface Customer {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentId: string; // Cédula/Pasaporte
  licenseNumber: string;
  address: string;
  dateOfBirth?: string;
  nationality?: string;
  company?: string;
  jobTitle?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: 'active' | 'inactive';
  photoUrl?: string; // URL estática
  createdAt: any;
  updatedAt: any;
}

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  fetchCustomers: (companyId: string) => Promise<void>;
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  loading: false,
  error: null,

  fetchCustomers: async (companyId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'customers'), where('companyId', '==', companyId));
      const querySnapshot = await getDocs(q);
      const customers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      set({ customers, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addCustomer: async (data) => {
    set({ loading: true, error: null });
    try {
      const newCustomerRef = doc(collection(db, 'customers'));
      const newCustomer = {
        ...data,
        id: newCustomerRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(newCustomerRef, newCustomer);
      set((state) => ({ 
        customers: [newCustomer as any, ...state.customers],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCustomer: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const customerRef = doc(db, 'customers', id);
      await updateDoc(customerRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'customers', id));
      set((state) => ({
        customers: state.customers.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
