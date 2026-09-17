import { useEffect, useState } from 'react';
import type { Vehicle } from '../../../app/store/useVehicleStore';
import { useFleetOpsStore } from '../../../app/store/useFleetOpsStore';
import { X, ShieldAlert, BadgeDollarSign, Wrench, Activity } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export function VehicleOperationsModal({ isOpen, onClose, vehicle }: Props) {
  const { fines, accidents, fetchOpsData, loading } = useFleetOpsStore();
  const [activeTab, setActiveTab] = useState<'FINES' | 'ACCIDENTS' | 'MAINTENANCE'>('FINES');

  useEffect(() => {
    if (isOpen && vehicle) {
      fetchOpsData(vehicle.id);
    }
  }, [isOpen, vehicle, fetchOpsData]);

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col border border-border">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="text-primary" />
              Operaciones Satélite: {vehicle.brand} {vehicle.model}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Placa: {vehicle.plate}</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button 
            onClick={() => setActiveTab('FINES')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'FINES' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <BadgeDollarSign size={16} />
              Multas de Tránsito
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('ACCIDENTS')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ACCIDENTS' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <ShieldAlert size={16} />
              Accidentes / Siniestros
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('MAINTENANCE')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'MAINTENANCE' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Wrench size={16} />
              Partes (Gomas/Batería)
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40 text-muted-foreground">Cargando operaciones...</div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'FINES' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Historial de Multas</h3>
                    <button className="text-sm text-primary hover:underline">Registrar Multa</button>
                  </div>
                  {fines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay multas registradas para este vehículo.</p>
                  ) : (
                    fines.map(fine => (
                      <div key={fine.id} className="p-4 border border-border rounded-lg mb-3">
                        <div className="flex justify-between">
                          <span className="font-medium">{fine.description}</span>
                          <span className="font-bold text-red-500">${fine.amount}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Fecha: {new Date(fine.date).toLocaleDateString()} | Estado: {fine.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {activeTab === 'ACCIDENTS' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Siniestros Reportados</h3>
                    <button className="text-sm text-primary hover:underline">Reportar Accidente</button>
                  </div>
                  {accidents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay accidentes registrados.</p>
                  ) : (
                    accidents.map(acc => (
                      <div key={acc.id} className="p-4 border border-border rounded-lg mb-3">
                        <div className="font-medium">{acc.description}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Lugar: {acc.location} | Estado: {acc.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'MAINTENANCE' && (
                <div>
                  <h3 className="font-semibold mb-4">Mantenimiento de Partes</h3>
                  <p className="text-sm text-muted-foreground">El seguimiento de vida útil de neumáticos, aceite y batería se encuentra en desarrollo.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
