import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { db, functions } from '../../core/firebase/config';
import { collection, addDoc, updateDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export type NCFType = 'B01' | 'B02' | 'B14' | 'B15' | 'E31' | 'E32';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  branchId?: string;
  contractId?: string;
  customerId: string;
  ncfType: NCFType;
  ncfNumber: string;
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED' | 'PAID';
  issueDate: string; // ISO string
  dueDate?: string;  // ISO string
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  items: InvoiceItem[];
  paymentMethod?: string;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

interface BillingState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  fetchInvoices: (companyId: string, branchId?: string | null) => void;
  createInvoice: (data: Omit<Invoice, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'ncfNumber'>) => Promise<string>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
}

export const useBillingStore = create<BillingState>((set) => ({
  invoices: [],
  loading: false,
  error: null,

  fetchInvoices: (companyId, branchId) => {
    set({ loading: true, error: null });
    
    let q = query(
      collection(db, 'invoices'),
      where('companyId', '==', companyId)
    );
    
    if (branchId) {
      q = query(q, where('branchId', '==', branchId));
    }

    // Usamos onSnapshot para tiempo real
    onSnapshot(q, (snapshot) => {
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      
      // Sort in memory by createdAt desc
      invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      set({ invoices, loading: false });
    }, (error) => {
      set({ error: error.message, loading: false });
    });

    // We don't store unsubscribe here, but we could if we want to cleanup. 
    // Usually handled by the component.
  },

  createInvoice: async (data) => {
    const { user } = useAuthStore.getState();
    if (!user?.companyId) throw new Error('No company ID');

    set({ loading: true, error: null });
    try {
      // 1. Llamar a la Cloud Function para generar el NCF (Transaccional)
      const generateNCF = httpsCallable(functions, 'generateNCF');
      
      let ncfString = '';
      try {
        const result = await generateNCF({ companyId: user.companyId, type: data.ncfType });
        ncfString = (result.data as any).ncf;
      } catch (fnError: any) {
        console.warn("First attempt failed, retrying NCF generation...", fnError);
        // Reintento
        const result = await generateNCF({ companyId: user.companyId, type: data.ncfType });
        ncfString = (result.data as any).ncf;
      }

      // 2. Guardar la factura inmutable en Firestore
      const newInvoiceData = {
        ...data,
        companyId: user.companyId,
        ncfNumber: ncfString,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'invoices'), newInvoiceData);

      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateInvoiceStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'invoices', id);
      await updateDoc(docRef, { 
        status, 
        updatedAt: new Date().toISOString() 
      });
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
