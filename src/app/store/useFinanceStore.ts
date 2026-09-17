import { create } from 'zustand';
import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, query, where, serverTimestamp, deleteDoc, onSnapshot } from 'firebase/firestore';

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
  fetchFinances: (companyId: string) => void;
  unsubscribeFinances: () => void;
  addPayment: (data: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

let paymentsUnsubscribe: (() => void) | null = null;
let expensesUnsubscribe: (() => void) | null = null;

export const useFinanceStore = create<FinanceState>((set) => ({
  payments: [],
  expenses: [],
  loading: false,
  error: null,

  unsubscribeFinances: () => {
    if (paymentsUnsubscribe) {
      paymentsUnsubscribe();
      paymentsUnsubscribe = null;
    }
    if (expensesUnsubscribe) {
      expensesUnsubscribe();
      expensesUnsubscribe = null;
    }
  },

  fetchFinances: (companyId: string) => {
    set({ loading: true, error: null });

    // Payments Snapshot
    const qPayments = query(collection(db, 'payments'), where('companyId', '==', companyId));
    paymentsUnsubscribe = onSnapshot(qPayments, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      payments.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      set({ payments, loading: false });
    }, (error: any) => {
      set({ error: error.message, loading: false });
    });

    // Expenses Snapshot
    const qExpenses = query(collection(db, 'expenses'), where('companyId', '==', companyId));
    expensesUnsubscribe = onSnapshot(qExpenses, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      set({ expenses, loading: false });
    }, (error: any) => {
      set({ error: error.message, loading: false });
    });
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
