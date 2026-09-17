import { useEffect } from 'react';
import { useBranchStore } from '../../app/store/useBranchStore';
import { Building, Plus, MapPin, Phone, Mail, User } from 'lucide-react';

export function BranchManager() {
  const { branches, fetchBranches } = useBranchStore();

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building className="text-primary" />
            Sucursales
          </h1>
          <p className="text-muted-foreground">Administra las localidades físicas de tu empresa.</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={18} />
          Nueva Sucursal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <div key={branch.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-foreground">{branch.name}</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                branch.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {branch.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>{branch.address}, {branch.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>{branch.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>{branch.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary shrink-0" />
                <span>Gerente: {branch.manager}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border flex justify-end gap-2">
              <button className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
