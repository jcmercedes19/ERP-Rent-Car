import { create } from 'zustand';


export interface TrafficFine {
  id: string;
  vehicleId: string;
  contractId?: string;
  customerId?: string;
  amount: number;
  date: Date;
  description: string;
  status: 'PENDING' | 'PAID' | 'DISPUTED';
}

export interface AccidentReport {
  id: string;
  vehicleId: string;
  contractId?: string;
  customerId?: string;
  date: Date;
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
      // Simular carga
      set({ 
        fines: [
          {
            id: 'F-001',
            vehicleId,
            amount: 1500,
            date: new Date(),
            description: 'Exceso de velocidad en Autopista Duarte',
            status: 'PENDING'
          }
        ],
        accidents: [],
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addFine: async (data) => {
    set({ loading: true, error: null });
    try {
      const newFine = { ...data, id: `F-${Date.now()}` };
      set(state => ({ fines: [...state.fines, newFine], loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addAccident: async (data) => {
    set({ loading: true, error: null });
    try {
      const newAccident = { ...data, id: `A-${Date.now()}` };
      set(state => ({ accidents: [...state.accidents, newAccident], loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
