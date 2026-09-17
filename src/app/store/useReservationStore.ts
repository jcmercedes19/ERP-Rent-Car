import { create } from 'zustand';
import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';

export interface Reservation {
  id: string;
  companyId: string;
  customerId: string;
  vehicleId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  extras: string[]; // e.g. ['BABY_SEAT', 'GPS', 'PREMIUM_INSURANCE']
  subtotal: number; // Days * dailyRate + extras
  tax: number; // 18% ITBIS
  deposit: number; // Security deposit
  totalEstimated: number; // subtotal + tax
  notes?: string;
  createdAt: any;
}

interface ReservationState {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  fetchReservations: (companyId: string) => Promise<void>;
  addReservation: (data: Omit<Reservation, 'id' | 'createdAt'>) => Promise<void>;
  updateReservationStatus: (id: string, status: Reservation['status']) => Promise<void>;
  updateReservation: (id: string, data: Partial<Reservation>) => Promise<void>;
  createPublicReservation: (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'companyId'> & { companyId: string }) => Promise<void>;
}

export const useReservationStore = create<ReservationState>((set) => ({
  reservations: [],
  loading: false,
  error: null,

  fetchReservations: async (companyId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'reservations'), where('companyId', '==', companyId));
      const querySnapshot = await getDocs(q);
      const reservations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
      
      set({ reservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addReservation: async (data) => {
    set({ loading: true, error: null });
    try {
      // Very basic overlap validation on frontend side (should ideally be done with security rules or cloud functions for hard guarantees)
      const q = query(collection(db, 'reservations'), 
        where('companyId', '==', data.companyId),
        where('vehicleId', '==', data.vehicleId),
        where('status', 'in', ['PENDING', 'CONFIRMED'])
      );
      
      const querySnapshot = await getDocs(q);
      const existingReservations = querySnapshot.docs.map(doc => doc.data() as Reservation);
      
      const newStart = new Date(data.startDate).getTime();
      const newEnd = new Date(data.endDate).getTime();

      const isOverlapping = existingReservations.some(r => {
        const rStart = new Date(r.startDate).getTime();
        const rEnd = new Date(r.endDate).getTime();
        return (newStart < rEnd && newEnd > rStart); // overlap condition
      });

      if (isOverlapping) {
        throw new Error("El vehículo ya está reservado en estas fechas.");
      }

      const newRef = doc(collection(db, 'reservations'));
      const newReservation = {
        ...data,
        id: newRef.id,
        createdAt: serverTimestamp(),
      };
      
      await setDoc(newRef, newReservation);
      
      set((state) => ({ 
        reservations: [newReservation as any, ...state.reservations],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateReservationStatus: async (id: string, status: Reservation['status']) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'reservations', id), { status });
      set((state) => ({
        reservations: state.reservations.map(r => r.id === id ? { ...r, status } : r),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateReservation: async (id: string, data: Partial<Reservation>) => {
    set({ loading: true, error: null });
    try {
      const ref = doc(db, 'reservations', id);
      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      set((state) => ({
        reservations: state.reservations.map(r => r.id === id ? { ...r, ...data } : r),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createPublicReservation: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRef = doc(collection(db, 'reservations'));
      const newReservation = {
        ...data,
        id: newRef.id,
        status: 'PENDING', // Force this status for public
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(newRef, newReservation);
      
      // We don't automatically add it to the state here if the user is a public guest,
      // because they don't have a logged-in listener state for the whole fleet.
      // But we can set loading to false.
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
