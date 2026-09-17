import { create } from 'zustand';

import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
export interface TrafficFine {
  id: string;
  vehicleId: string;
  contractId?: string;
  customerId?: string;
  amount: number;
  date: any;
  description: string;
  status: 'PENDING' | 'PAID' | 'DISPUTED';
}

export interface AccidentReport {
  id: string;
  vehicleId: string;
  contractId?: string;
  customerId?: string;
  date: any;
  location: string;
  description: string;
  status: 'REPORTED' | 'INVESTIGATION' | 'INSURANCE' | 'REPAIRING' | 'RESOLVED';
  damageCost?: number;
}

interface FleetOpsState {
  fines: TrafficFine[];
  accidents: AccidentReport[];
  loading: boolean;
  error: string | null;
  fetchOpsData: (vehicleId: string) => Promise<void>;
  addFine: (fine: Omit<TrafficFine, 'id'>) => Promise<void>;
  addAccident: (accident: Omit<AccidentReport, 'id'>) => Promise<void>;
}

export const useFleetOpsStore = create<FleetOpsState>((set) => ({
  fines: [],
  accidents: [],
  loading: false,
  error: null,

  fetchOpsData: async (vehicleId) => {
    set({ loading: true, error: null });
    try {
      const finesQuery = query(collection(db, 'fines'), where('vehicleId', '==', vehicleId));
      const accidentsQuery = query(collection(db, 'accidents'), where('vehicleId', '==', vehicleId));

      const [finesSnapshot, accidentsSnapshot] = await Promise.all([
        getDocs(finesQuery),
        getDocs(accidentsQuery)
      ]);

      const fines = finesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrafficFine));
      const accidents = accidentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccidentReport));

      set({ fines, accidents, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addFine: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRef = doc(collection(db, 'fines'));
      const newFine = { ...data, id: newRef.id, date: data.date instanceof Date ? data.date : new Date() };
      await setDoc(newRef, newFine);
      set(state => ({ fines: [...state.fines, newFine as any], loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addAccident: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRef = doc(collection(db, 'accidents'));
      const newAccident = { ...data, id: newRef.id, date: data.date instanceof Date ? data.date : new Date() };
      await setDoc(newRef, newAccident);
      set(state => ({ accidents: [...state.accidents, newAccident as any], loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
