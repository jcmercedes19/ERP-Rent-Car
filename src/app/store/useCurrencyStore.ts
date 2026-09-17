import { create } from 'zustand';
import { db } from '../../core/firebase/config';
import { collection, query, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface ExchangeRate {
  id: string; // Ej: "USD_DOP"
  base: string; // Ej: "USD"
  target: string; // Ej: "DOP"
  rate: number; // Ej: 58.50
  source: string;
  updatedAt: any;
}

interface CurrencyState {
  rates: ExchangeRate[];
  loading: boolean;
  error: string | null;
  fetchRates: () => Promise<void>;
  updateRate: (base: string, target: string, rate: number, source?: string) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  rates: [],
  loading: false,
  error: null,

  fetchRates: async () => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'exchangeRates'));
      const snapshot = await getDocs(q);
      const rates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExchangeRate));
      set({ rates, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateRate: async (base, target, rate, source = 'MANUAL') => {
    set({ loading: true, error: null });
    try {
      const id = `${base}_${target}`;
      const docRef = doc(db, 'exchangeRates', id);
      await setDoc(docRef, {
        base,
        target,
        rate,
        source,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Actualizar estado local
      const newRate: ExchangeRate = { id, base, target, rate, source, updatedAt: new Date() };
      const currentRates = get().rates;
      const index = currentRates.findIndex(r => r.id === id);
      
      if (index >= 0) {
        currentRates[index] = newRate;
        set({ rates: [...currentRates], loading: false });
      } else {
        set({ rates: [...currentRates, newRate], loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  }
}));
