import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { db } from '../../core/firebase/config';
import { collection, doc, query, where, serverTimestamp, getDocs, orderBy, runTransaction } from 'firebase/firestore';
import { useCashSessionStore } from './useCashSessionStore';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'DEPOSIT_IN' | 'DEPOSIT_OUT';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';

export interface CashTransaction {
  id: string;
  cashSessionId: string;
  companyId: string;
  branchId: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  originalAmount?: number;
  exchangeRateAtCreation?: number;
  baseCurrencyAmount?: number;
  method: PaymentMethod;
  description: string;
  referenceId?: string;
  userId: string;
  createdAt: any;
}

interface CashState {
  transactions: CashTransaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: (sessionId: string) => Promise<void>;
  addTransaction: (data: Omit<CashTransaction, 'id' | 'cashSessionId' | 'companyId' | 'userId' | 'createdAt'>) => Promise<void>;
}

export const useCashStore = create<CashState>((set) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const txQuery = query(
        collection(db, 'cashTransactions'),
        where('cashSessionId', '==', sessionId),
        orderBy('createdAt', 'desc')
      );
      const txSnapshot = await getDocs(txQuery);
      const transactions = txSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CashTransaction));

      set({ transactions, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addTransaction: async (data) => {
    const { activeSession } = useCashSessionStore.getState();
    const { user } = useAuthStore.getState();
    if (!activeSession || !user?.companyId) throw new Error('No hay turno activo o falta el ID de compañía');

    set({ loading: true, error: null });
    try {
      const txRef = doc(collection(db, 'cashTransactions'));
      
      const newTransaction = {
        ...data,
        cashSessionId: activeSession.id,
        companyId: user.companyId,
        userId: user.uid,
        createdAt: serverTimestamp(),
      };

      // Cálculo del monto en DOP (Moneda Base)
      let amountInDOP = data.amount;
      if (data.currency && data.currency !== 'DOP' && data.originalAmount && data.exchangeRateAtCreation) {
        amountInDOP = data.originalAmount * data.exchangeRateAtCreation;
      }

      await runTransaction(db, async (transaction) => {
        const sessionRef = doc(db, 'cashSessions', activeSession.id);
        const sessionDoc = await transaction.get(sessionRef);

        if (!sessionDoc.exists()) {
          throw new Error("El turno ya no existe.");
        }
        
        const sessionData = sessionDoc.data();
        let { expectedCash, expectedCard, expectedTransfer } = sessionData;

        // Sumar o restar según el método de pago
        // Asumimos que los EGRESOS se hacen de la caja física (CASH)
        const isIncome = (data.type === 'INCOME' || data.type === 'DEPOSIT_IN');
        const modifier = isIncome ? 1 : -1;

        if (data.method === 'CASH') {
          expectedCash += (amountInDOP * modifier);
        } else if (data.method === 'CARD' && isIncome) {
          expectedCard += amountInDOP;
        } else if (data.method === 'TRANSFER' && isIncome) {
          expectedTransfer += amountInDOP;
        }

        // Crear la transacción
        transaction.set(txRef, newTransaction);

        // Actualizar el turno de caja
        transaction.update(sessionRef, {
          expectedCash,
          expectedCard,
          expectedTransfer,
          updatedAt: new Date().toISOString()
        });
      });

      set(state => ({
        transactions: [{ ...newTransaction, id: txRef.id } as CashTransaction, ...state.transactions],
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
