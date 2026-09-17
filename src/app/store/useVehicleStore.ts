import { create } from 'zustand';
import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, getDocs, query, where, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

export interface Vehicle {
  id: string;
  companyId: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  category: 'ECONOMY' | 'COMPACT' | 'SUV' | 'LUXURY' | 'VAN';
  status: 'AVAILABLE' | 'RESERVED' | 'RENTED' | 'DELIVERY' | 'RETURNING' | 'MAINTENANCE' | 'REPAIR' | 'ACCIDENT' | 'OUT_OF_SERVICE' | 'SOLD';
  dailyRate: number;
  currentMileage: number;
  imageUrl?: string;
  color?: string;
  transmission?: 'AUTO' | 'MANUAL';
  fuelType?: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  createdAt: any;
  updatedAt: any;
}

interface VehicleState {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  fetchVehicles: (companyId: string) => Promise<void>;
  addVehicle: (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  loading: false,
  error: null,

  fetchVehicles: async (companyId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'vehicles'), where('companyId', '==', companyId));
      const querySnapshot = await getDocs(q);
      const vehicles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      set({ vehicles, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addVehicle: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRef = doc(collection(db, 'vehicles'));
      const newVehicle = {
        ...data,
        id: newRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(newRef, newVehicle);
      set((state) => ({ 
        vehicles: [newVehicle as any, ...state.vehicles],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateVehicle: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const vRef = doc(db, 'vehicles', id);
      await updateDoc(vRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      set((state) => ({
        vehicles: state.vehicles.map(v => v.id === id ? { ...v, ...data } : v),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteVehicle: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'vehicles', id));
      set((state) => ({
        vehicles: state.vehicles.filter(v => v.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
