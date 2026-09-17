import { Outlet, useParams } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { CarFront } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../core/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export const PublicLayout = () => {
  const { companyId } = useParams();
  const [companyName, setCompanyName] = useState('Cargando...');

  useEffect(() => {
    const fetchCompany = async () => {
      if (companyId) {
        try {
          const docRef = doc(db, 'companies', companyId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCompanyName(docSnap.data().name);
          } else {
            setCompanyName('Empresa no encontrada');
          }
        } catch (e) {
          console.error(e);
          setCompanyName('Error');
        }
      }
    };
    fetchCompany();
  }, [companyId]);

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-md">
            <CarFront size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
              {companyName}
            </h1>
            <p className="text-xs text-muted-foreground">Reservas Online</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
      
      <footer className="py-6 border-t border-border bg-card/50 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {companyName}. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};
