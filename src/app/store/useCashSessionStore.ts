import { create } from 'zustand';
import { db } from '../../core/firebase/config';
import { collection, doc, setDoc, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuthStore } from './useAuthStore';
import { useTenantStore } from './useTenantStore';

export interface CashSession {
  id: string;
  companyId: string;
  branchId: string;
  cashierId: string;
  cashierName: string;
  openedAt: string; // ISO String
  closedAt: string | null;
  openingAmount: number;
  expectedCash: number;
  expectedCard: number;
  expectedTransfer: number;
  actualCash: number | null;
  actualCard: number | null;
  actualTransfer: number | null;
  difference: number | null;
  status: "open" | "closed";
  closingNotes: string | null;
  denominationBreakdown: {
    bills_2000: number;
    bills_1000: number;
    bills_500: number;
    bills_200: number;
    bills_100: number;
    bills_50: number;
    coins: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface CashSessionState {
  activeSession: CashSession | null;
  loading: boolean;
  error: string | null;
  fetchActiveSession: (companyId: string, branchId: string, cashierId: string) => void;
  openSession: (openingAmount: number) => Promise<void>;
  closeSession: (
    actualCash: number, 
    actualCard: number, 
    actualTransfer: number, 
    notes: string, 
    denominations: CashSession['denominationBreakdown']
  ) => Promise<void>;
}

export const useCashSessionStore = create<CashSessionState>((set, get) => ({
  activeSession: null,
  loading: false,
  error: null,

  fetchActiveSession: (companyId, branchId, cashierId) => {
    set({ loading: true, error: null });
    const q = query(
      collection(db, 'cashSessions'),
      where('companyId', '==', companyId),
      where('branchId', '==', branchId),
      where('cashierId', '==', cashierId),
      where('status', '==', 'open')
    );

    onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        set({ activeSession: { id: docData.id, ...docData.data() } as CashSession, loading: false });
      } else {
        set({ activeSession: null, loading: false });
      }
    }, (error) => {
      set({ error: error.message, loading: false });
    });
  },

  openSession: async (openingAmount) => {
    const { user } = useAuthStore.getState();
    const { activeCompany, activeBranchId } = useTenantStore.getState();

    if (!user || !activeCompany || !activeBranchId) {
      throw new Error("Missing auth or tenant context");
    }

    // Double check there isn't already an open session
    if (get().activeSession) {
      throw new Error("Ya existe un turno abierto para este cajero.");
    }

    set({ loading: true, error: null });
    try {
      const newId = `SESS-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const newSession: CashSession = {
        id: newId,
        companyId: activeCompany.id,
        branchId: activeBranchId,
        cashierId: user.uid,
        cashierName: user.email || 'Cajero',
        openedAt: now,
        closedAt: null,
        openingAmount,
        expectedCash: openingAmount,
        expectedCard: 0,
        expectedTransfer: 0,
        actualCash: null,
        actualCard: null,
        actualTransfer: null,
        difference: null,
        status: "open",
        closingNotes: null,
        denominationBreakdown: null,
        createdAt: now,
        updatedAt: now
      };

      await setDoc(doc(db, 'cashSessions', newId), newSession);
      // activeSession is updated via onSnapshot
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  closeSession: async (actualCash, actualCard, actualTransfer, notes, denominations) => {
    const session = get().activeSession;
    if (!session) throw new Error("No hay turno activo para cerrar.");

    set({ loading: true, error: null });
    try {
      const difference = actualCash - session.expectedCash;

      await updateDoc(doc(db, 'cashSessions', session.id), {
        status: "closed",
        closedAt: new Date().toISOString(),
        actualCash,
        actualCard,
        actualTransfer,
        difference,
        closingNotes: notes,
        denominationBreakdown: denominations,
        updatedAt: new Date().toISOString()
      });

      // activeSession will be nullified by onSnapshot
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
