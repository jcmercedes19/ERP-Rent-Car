import { create } from 'zustand';
import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, query, where, serverTimestamp, onSnapshot } from 'firebase/firestore';

export interface MaintenanceRecord {
  id: string;
  companyId: string;
  vehicleId: string;
  type: 'PREVENTIVE' | 'CORRECTIVE';
  category: 'OIL_CHANGE' | 'TIRES' | 'BRAKES' | 'ENGINE' | 'TRANSMISSION' | 'BODY' | 'OTHER';
  description: string;
  mileageAtService: number;
  cost: number;
  provider?: string; // Taller o mecánico
  date: string;
  nextServiceMileage?: number; // Para mantenimientos preventivos (ej. próximo cambio de aceite a los +5000 km)
  createdAt: any;
}

interface MaintenanceState {
  records: MaintenanceRecord[];
  loading: boolean;
  error: string | null;
  fetchRecords: (companyId: string) => void;
  unsubscribeRecords: () => void;
  addRecord: (data: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => Promise<void>;
}

let recordsUnsubscribe: (() => void) | null = null;

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  records: [],
  loading: false,
  error: null,

  unsubscribeRecords: () => {
    if (recordsUnsubscribe) {
      recordsUnsubscribe();
      recordsUnsubscribe = null;
    }
  },

  fetchRecords: (companyId: string) => {
    set({ loading: true, error: null });

    const q = query(collection(db, 'maintenance_records'), where('companyId', '==', companyId));
    recordsUnsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRecord));
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      set({ records, loading: false });
    }, (error: any) => {
      set({ error: error.message, loading: false });
    });
  },

  addRecord: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRef = doc(collection(db, 'maintenance_records'));
      const newRecord = {
        ...data,
        id: newRef.id,
        createdAt: serverTimestamp(),
      };
      await setDoc(newRef, newRecord);
      set((state) => ({ 
        records: [newRecord as any, ...state.records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
