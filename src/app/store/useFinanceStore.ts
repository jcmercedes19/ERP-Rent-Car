import { create } from 'zustand';
import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, deleteDoc } from 'firebase/firestore';

export interface Payment {
  id: string;
  companyId: string;
  contractId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'TRANSFER';
  type: 'RENT' | 'DEPOSIT' | 'PENALTY';
  reference?: string; // NCF, comprobante de transferencia, etc.
  notes?: string;
  createdAt: any;
}

export interface Expense {
  id: string;
  companyId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: any;
}

interface FinanceState {
  payments: Payment[];
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  fetchFinances: (companyId: string) => Promise<void>;
  addPayment: (data: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  payments: [],
  expenses: [],
  loading: false,
  error: null,

  fetchFinances: async (companyId: string) => {
    set({ loading: true, error: null });
    try {
      // Fetch Payments
      const qPayments = query(collection(db, 'payments'), where('companyId', '==', companyId));
      const paySnapshot = await getDocs(qPayments);
      const payments = paySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      
      // Fetch Expenses
      const qExpenses = query(collection(db, 'expenses'), where('companyId', '==', companyId));
      const expSnapshot = await getDocs(qExpenses);
      const expenses = expSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));

      // Ordenar por más recientes
      payments.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      set({ payments, expenses, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addPayment: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRef = doc(collection(db, 'payments'));
      const newPayment = {
        ...data,
        id: newRef.id,
        createdAt: serverTimestamp(),
      };
      await setDoc(newRef, newPayment);
      set((state) => ({ 
        payments: [newPayment as any, ...state.payments],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deletePayment: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'payments', id));
      set((state) => ({
        payments: state.payments.filter(p => p.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addExpense: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRef = doc(collection(db, 'expenses'));
      const newExpense = {
        ...data,
        id: newRef.id,
        createdAt: serverTimestamp(),
      };
      await setDoc(newRef, newExpense);
      set((state) => ({ 
        expenses: [newExpense as any, ...state.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'expenses', id));
      set((state) => ({
        expenses: state.expenses.filter(e => e.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
