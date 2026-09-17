import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useTenantStore } from '../../app/store/useTenantStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { LayoutDashboard, Users, Car, Settings, LogOut, CarFront, FileText, DollarSign, CreditCard, FileSignature, BarChart3, CalendarDays, Key } from 'lucide-react';
import { auth } from '../../core/firebase/config';
import { signOut } from 'firebase/auth';

export const AppLayout: React.FC = () => {
  const { user } = useAuthStore();
  const { activeCompany } = useTenantStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border p-4 flex flex-col shadow-sm z-20">
        <div className="flex items-center gap-3 mb-8 px-2 mt-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-sm">
            <CarFront size={18} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
            {activeCompany?.name || 'RentCar ERP'}
          </h1>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary text-foreground font-medium transition-colors">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          
          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rental Core</p>
          </div>
          <Link to="/reservations" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <CalendarDays size={18} />
            Reservaciones
          </Link>
          <Link to="/operations" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <Key size={18} />
            Check-In / Out
          </Link>
          <Link to="/contracts" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <FileText size={18} />
            Contratos
          </Link>
          <Link to="/contracts/templates" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors pl-8 text-sm">
            <FileSignature size={16} />
            Plantillas Legales
          </Link>

          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Flota y Clientes</p>
          </div>
          <Link to="/fleet" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <Car size={18} />
            Flota
          </Link>
          <Link to="/customers" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <Users size={18} />
            Clientes
          </Link>

          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Finanzas</p>
          </div>
          <Link to="/finances/overview" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <BarChart3 size={18} />
            Dashboard
          </Link>
          <Link to="/finances/payments" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors pl-8 text-sm">
            <DollarSign size={16} />
            Pagos e Ingresos
          </Link>
          <Link to="/finances/expenses" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors pl-8 text-sm">
            <CreditCard size={16} />
            Gastos Operativos
          </Link>

          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ajustes</p>
          </div>
          <Link to="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <Settings size={18} />
            Configuración
          </Link>
        </nav>

        <div className="mt-auto pt-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors font-medium"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="font-medium text-muted-foreground text-sm">
            {activeCompany ? `Sucursal Principal` : 'Cargando contexto...'}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={handleLogout}
              className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors md:hidden"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto bg-background">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
