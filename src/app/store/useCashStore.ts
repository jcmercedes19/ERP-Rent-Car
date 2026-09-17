import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'DEPOSIT_IN' | 'DEPOSIT_OUT';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';

export interface CashTransaction {
  id: string;
  cashRegisterId: string;
  companyId: string;
  type: TransactionType;
  amount: number;
  method: PaymentMethod;
  description: string;
  referenceId?: string; // ContractId o InvoiceId
  userId: string;
  createdAt: Date;
}

export interface CashRegister {
  id: string;
  companyId: string;
  branchId?: string;
  openedBy: string; // UserId
  openedAt: Date;
  closedAt?: Date;
  closedBy?: string;
  status: 'OPEN' | 'CLOSED';
  initialBalance: number;
  expectedBalance?: number;
  actualBalance?: number;
  discrepancy?: number;
  totalIncome: number;
  totalExpense: number;
  totalDeposits: number; // Depósitos retenidos
  totalDepositsReturned: number;
}

interface CashState {
  currentRegister: CashRegister | null;
  transactions: CashTransaction[];
  loading: boolean;
  error: string | null;
  fetchCurrentRegister: () => Promise<void>;
  openRegister: (initialBalance: number) => Promise<void>;
  closeRegister: (actualBalance: number) => Promise<void>;
  addTransaction: (data: Omit<CashTransaction, 'id' | 'cashRegisterId' | 'companyId' | 'userId' | 'createdAt'>) => Promise<void>;
}

export const useCashStore = create<CashState>((set, get) => ({
  currentRegister: null,
  transactions: [],
  loading: false,
  error: null,

  fetchCurrentRegister: async () => {
    const { user } = useAuthStore.getState();
    if (!user?.companyId) return;

    set({ loading: true, error: null });
    try {
      // Mock fetching an open register
      // En la vida real, consultamos Firestore para ver si hay caja abierta hoy para este branch
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  openRegister: async (initialBalance) => {
    const { user } = useAuthStore.getState();
    if (!user?.companyId) throw new Error('No company ID');

    set({ loading: true, error: null });
    try {
      const newRegister: CashRegister = {
        id: `CR-${Date.now()}`,
        companyId: user.companyId,
        openedBy: user.uid,
        openedAt: new Date(),
        status: 'OPEN',
        initialBalance,
        totalIncome: 0,
        totalExpense: 0,
        totalDeposits: 0,
        totalDepositsReturned: 0
      };
      set({ currentRegister: newRegister, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  closeRegister: async (_actualBalance) => {
    const register = get().currentRegister;
    if (!register) throw new Error('No open register');

    set({ loading: true, error: null });
    try {
      
      // const expected = register.initialBalance + register.totalIncome - register.totalExpense + register.totalDeposits - register.totalDepositsReturned;
      
      // const closedRegister: CashRegister = {
      //   ...register,
      //   status: 'CLOSED',
      //   closedAt: new Date(),
      //   closedBy: user?.uid,
      //   expectedBalance: expected,
      //   actualBalance: _actualBalance,
      //   discrepancy: _actualBalance - expected
      // };

      set({ currentRegister: null, loading: false });
      // Here we would save to Firestore history
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addTransaction: async (data) => {
    const register = get().currentRegister;
    const { user } = useAuthStore.getState();
    if (!register || !user?.companyId) throw new Error('No open register or company ID');

    set({ loading: true, error: null });
    try {
      const newTransaction: CashTransaction = {
        ...data,
        id: `TR-${Date.now()}`,
        cashRegisterId: register.id,
        companyId: user.companyId,
        userId: user.uid,
        createdAt: new Date(),
      };

      const updateRegister = { ...register };
      if (data.type === 'INCOME') updateRegister.totalIncome += data.amount;
      if (data.type === 'EXPENSE') updateRegister.totalExpense += data.amount;
      if (data.type === 'DEPOSIT_IN') updateRegister.totalDeposits += data.amount;
      if (data.type === 'DEPOSIT_OUT') updateRegister.totalDepositsReturned += data.amount;

      set(state => ({
        transactions: [newTransaction, ...state.transactions],
        currentRegister: updateRegister,
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
