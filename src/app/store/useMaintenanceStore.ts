import { create } from 'zustand';
import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

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
  fetchRecords: (companyId: string) => Promise<void>;
  addRecord: (data: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  records: [],
  loading: false,
  error: null,

  fetchRecords: async (companyId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'maintenance_records'), where('companyId', '==', companyId));
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRecord));
      
      // Ordenar por fecha descendente
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      set({ records, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
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
