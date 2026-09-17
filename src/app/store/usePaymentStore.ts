import { create } from 'zustand';
import { db, functions } from '../../core/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export interface PaymentIntent {
  id: string;
  companyId: string;
  branchId: string;
  reservationId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'failed' | 'cancelled';
  gateway: string;
  gatewayReference: string;
  paymentUrl: string;
  createdAt: any;
  updatedAt: any;
}

interface PaymentState {
  loading: boolean;
  error: string | null;
  createPaymentIntent: (reservationId: string, amount: number, currency: string) => Promise<PaymentIntent>;
  listenToPaymentIntent: (intentId: string, callback: (intent: PaymentIntent) => void) => () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  loading: false,
  error: null,

  createPaymentIntent: async (reservationId, amount, currency) => {
    set({ loading: true, error: null });
    try {
      const createFn = httpsCallable<
        { reservationId: string; amount: number; currency: string },
        { paymentIntent: PaymentIntent }
      >(functions, 'createPaymentIntent');

      const result = await createFn({ reservationId, amount, currency });
      set({ loading: false });
      return result.data.paymentIntent;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  listenToPaymentIntent: (intentId, callback) => {
    const unsub = onSnapshot(doc(db, 'paymentIntents', intentId), (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as PaymentIntent);
      }
    });
    return unsub;
  }
}));
