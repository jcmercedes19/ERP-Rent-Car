import { create } from 'zustand';
import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, getDocs, onSnapshot, serverTimestamp, Timestamp } from 'firebase/auth';
import { db } from '../../core/firebase/config';
import { useAuthStore } from './useAuthStore';

// Tipos de Comprobantes Fiscales (Dominican Republic NCF / e-CF)
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
  contractId?: string; // Opcional si es factura de mostrador
  customerId: string;
  ncfType: NCFType;
  ncfNumber: string; // Ej: B0100000001
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED' | 'PAID';
  issueDate: Date;
  dueDate?: Date;
  subtotal: number;
  taxTotal: number; // ITBIS
  discount: number;
  total: number;
  items: InvoiceItem[];
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BillingState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  createInvoice: (data: Omit<Invoice, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'ncfNumber'>) => Promise<string>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
}

// Lógica de simulación para generar el siguiente NCF de la secuencia
const generateNextNCF = (type: NCFType, currentCount: number) => {
  const sequence = String(currentCount + 1).padStart(8, '0');
  return `${type}${sequence}`;
};

export const useBillingStore = create<BillingState>((set, get) => ({
  invoices: [],
  loading: false,
  error: null,

  fetchInvoices: async () => {
    const { user } = useAuthStore.getState();
    if (!user?.companyId) return;

    set({ loading: true, error: null });
    try {
      // In a real scenario we use Firestore 'invoices' collection
      // For now, we simulate basic data fetch structure
      const mockInvoices: Invoice[] = [
        {
          id: 'INV-001',
          companyId: user.companyId,
          customerId: 'CUST-001',
          ncfType: 'B02',
          ncfNumber: 'B0200000001',
          status: 'PAID',
          issueDate: new Date(),
          subtotal: 10000,
          taxTotal: 1800,
          discount: 0,
          total: 11800,
          items: [
            {
              id: 'ITEM-1',
              description: 'Alquiler Toyota Corolla 5 días',
              quantity: 5,
              unitPrice: 2000,
              taxAmount: 1800,
              total: 11800
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      set({ invoices: mockInvoices, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createInvoice: async (data) => {
    const { user } = useAuthStore.getState();
    if (!user?.companyId) throw new Error('No company ID');

    set({ loading: true, error: null });
    try {
      const newId = `INV-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate NCF Sequence generation
      const ncfNumber = generateNextNCF(data.ncfType, get().invoices.length);

      const newInvoice: Invoice = {
        ...data,
        id: newId,
        companyId: user.companyId,
        ncfNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set(state => ({
        invoices: [newInvoice, ...state.invoices],
        loading: false
      }));

      return newId;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateInvoiceStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      set(state => ({
        invoices: state.invoices.map(inv => 
          inv.id === id ? { ...inv, status, updatedAt: new Date() } : inv
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  }
}));
