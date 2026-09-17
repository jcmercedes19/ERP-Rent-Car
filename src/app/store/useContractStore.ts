import { create } from 'zustand';
import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, getDocs, query, where, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

export interface RentalContract {
  id: string;
  companyId: string;
  customerId: string;
  vehicleId: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  dailyRate: number;
  totalDays: number;
  subtotal: number;
  depositAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

interface ContractState {
  contracts: RentalContract[];
  loading: boolean;
  error: string | null;
  fetchContracts: (companyId: string) => Promise<void>;
  addContract: (data: Omit<RentalContract, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContract: (id: string, data: Partial<RentalContract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
}

export const useContractStore = create<ContractState>((set) => ({
  contracts: [],
  loading: false,
  error: null,

  fetchContracts: async (companyId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'rentalContracts'), where('companyId', '==', companyId));
      const querySnapshot = await getDocs(q);
      const contracts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RentalContract));
      // Ordenar por fecha de creación (más recientes primero) asumiendo createdAt es Timestamp, pero si no, es en cliente
      contracts.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      set({ contracts, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addContract: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRef = doc(collection(db, 'rentalContracts'));
      const newContract = {
        ...data,
        id: newRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(newRef, newContract);
      
      // Si el estado es ACTIVE, actualizamos el estado del vehículo a RENTED
      if (data.status === 'ACTIVE') {
        const vRef = doc(db, 'vehicles', data.vehicleId);
        await updateDoc(vRef, { status: 'RENTED', updatedAt: serverTimestamp() });
      }

      set((state) => ({ 
        contracts: [newContract as any, ...state.contracts],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateContract: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const cRef = doc(db, 'rentalContracts', id);
      await updateDoc(cRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      
      // Si el contrato cambia a COMPLETED o CANCELLED, liberar el vehículo a AVAILABLE
      if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
        // Necesitamos saber qué vehículo es, para eso lo buscaremos en el state
      }

      set((state) => {
        const contractIndex = state.contracts.findIndex(c => c.id === id);
        if (contractIndex === -1) return state;
        
        const oldContract = state.contracts[contractIndex];
        const newContracts = [...state.contracts];
        newContracts[contractIndex] = { ...oldContract, ...data };

        // Si el estado cambió, gestionamos el vehículo de forma asíncrona pero sin bloquear la UI
        if (data.status && data.status !== oldContract.status) {
          const vRef = doc(db, 'vehicles', oldContract.vehicleId);
          if (data.status === 'ACTIVE') {
            updateDoc(vRef, { status: 'RENTED', updatedAt: serverTimestamp() }).catch(console.error);
          } else if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
            updateDoc(vRef, { status: 'AVAILABLE', updatedAt: serverTimestamp() }).catch(console.error);
          }
        }

        return { contracts: newContracts, loading: false };
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteContract: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'rentalContracts', id));
      set((state) => ({
        contracts: state.contracts.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
