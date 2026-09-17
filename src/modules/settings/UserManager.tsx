import { useState } from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import type { AppUser } from '../../app/store/useAuthStore';
import { Users, Shield, Plus, Mail } from 'lucide-react';
import { GlassTable } from '../../shared/components/ui/GlassTable';

export function UserManager() {
  const { user } = useAuthStore();
  const [users] = useState<AppUser[]>([
    {
      uid: user?.uid || '1',
      email: user?.email || 'admin@empresa.com',
      displayName: user?.displayName || 'Administrador',
      role: 'ADMIN',
      branchId: 'Todas',
      companyId: user?.companyId
    },
    {
      uid: '2',
      email: 'caja@empresa.com',
      displayName: 'Carlos Cajero',
      role: 'CASHIER',
      branchId: 'BR-001',
      companyId: user?.companyId
    },
    {
      uid: '3',
      email: 'taller@empresa.com',
      displayName: 'Mecánico Jefe',
      role: 'MAINTENANCE',
      branchId: 'BR-001',
      companyId: user?.companyId
    }
  ]);

  const columns = [
    {
      header: 'Usuario',
      accessor: (u: AppUser) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {u.displayName?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-medium text-foreground">{u.displayName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail size={12} /> {u.email}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Rol (RBAC)',
      accessor: (u: AppUser) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
          ${u.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : ''}
          ${u.role === 'CASHIER' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}
          ${u.role === 'MAINTENANCE' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : ''}
        `}>
          <Shield size={14} />
          {u.role}
        </span>
      )
    },
    {
      header: 'Sucursal',
      accessor: (u: AppUser) => u.branchId
    },
    {
      header: '',
      accessor: () => (
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
            Editar Rol
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="text-primary" />
            Usuarios y Permisos
          </h1>
          <p className="text-muted-foreground">Administra quién tiene acceso a qué módulos.</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={18} />
          Invitar Usuario
        </button>
      </div>

      <GlassTable
        data={users}
        columns={columns}
        emptyMessage="No hay usuarios registrados."
      />
    </div>
  );
}
