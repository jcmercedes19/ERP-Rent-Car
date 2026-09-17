import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useTenantStore } from '../../app/store/useTenantStore';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuthStore();
  const { activeCompany, setTenantContext, setMemberships } = useTenantStore();

  useEffect(() => {
    if (!user) return;
    
    // Fetch user memberships and tenant context
    const fetchContext = async () => {
      try {
        const memRef = collection(db, 'memberships');
        const q = query(memRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const memberships: any[] = [];
        querySnapshot.forEach((document) => memberships.push({ id: document.id, ...document.data() }));
        
        setMemberships(memberships);

        if (memberships.length > 0 && !activeCompany) {
          // Auto select the first company available for now (until we build a tenant selector)
          const companyId = memberships[0].companyId;
          const compDoc = await getDoc(doc(db, 'companies', companyId));
          if (compDoc.exists()) {
            setTenantContext({ id: compDoc.id, ...compDoc.data() } as any, memberships[0].branchIds[0] || '');
          }
        } else if (memberships.length === 0) {
          console.error("Este usuario no tiene ninguna empresa asignada.");
        }
      } catch (error) {
        console.error("Error fetching context", error);
      }
    };

    fetchContext();
  }, [user, activeCompany, setTenantContext, setMemberships]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
