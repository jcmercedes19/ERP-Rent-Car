import { useState, useEffect, useMemo } from "react";
import { useVehicleStore, Vehicle } from "../../app/store/useVehicleStore";
import { useMaintenanceStore } from "../../app/store/useMaintenanceStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { useFinanceStore } from "../../app/store/useFinanceStore";
import { MaintenanceForm } from "./components/MaintenanceForm";
import { Search, Wrench, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const MaintenancePanel = () => {
  const { activeCompany } = useTenantStore();
  const { vehicles, fetchVehicles, updateVehicle } = useVehicleStore();
  const { records, fetchRecords, addRecord } = useMaintenanceStore();
  const { addExpense } = useFinanceStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (activeCompany?.id) {
      fetchVehicles(activeCompany.id);
      fetchRecords(activeCompany.id);
    }
  }, [activeCompany?.id, fetchVehicles, fetchRecords]);

  // Analyzes fleet health
  const fleetHealth = useMemo(() => {
    return vehicles.map(vehicle => {
      const vehicleRecords = records.filter(r => r.vehicleId === vehicle.id && r.type === 'PREVENTIVE');
      
      // Get the latest preventive maintenance
      const latestService = vehicleRecords.length > 0 
        ? vehicleRecords.reduce((latest, current) => 
            new Date(current.date).getTime() > new Date(latest.date).getTime() ? current : latest
          )
        : null;

      let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      let message = "Mantenimiento al día";

      if (latestService?.nextServiceMileage) {
        const remainingMileage = latestService.nextServiceMileage - vehicle.currentMileage;
        if (remainingMileage <= 0) {
          status = 'CRITICAL';
          message = `Mantenimiento vencido por ${Math.abs(remainingMileage)} km`;
        } else if (remainingMileage <= 1000) {
          status = 'WARNING';
          message = `Próximo servicio en ${remainingMileage} km`;
        }
      } else if (vehicle.currentMileage > 5000) {
        // If no records and high mileage
        status = 'CRITICAL';
        message = "Sin registros de servicio inicial";
      }

      return {
        vehicle,
        latestService,
        status,
        message
      };
    }).filter(item => {
      const searchString = `${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.plate}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    }).sort((a, b) => {
      if (a.status === 'CRITICAL' && b.status !== 'CRITICAL') return -1;
      if (a.status !== 'CRITICAL' && b.status === 'CRITICAL') return 1;
      if (a.status === 'WARNING' && b.status === 'HEALTHY') return -1;
      if (a.status === 'HEALTHY' && b.status === 'WARNING') return 1;
      return 0;
    });
  }, [vehicles, records, searchTerm]);

  const handleMaintenanceSubmit = async (formData: any) => {
    if (!activeCompany?.id || !selectedVehicle) return;

    // 1. Add maintenance record
    await addRecord({
      companyId: activeCompany.id,
      vehicleId: selectedVehicle.id,
      ...formData
    });

    // 2. If it has a cost, optionally add it to expenses
    if (formData.cost > 0) {
      const confirmExpense = window.confirm(`¿Deseas registrar este costo ($${formData.cost}) como un gasto automático en el módulo de Finanzas?`);
      if (confirmExpense) {
        await addExpense({
          companyId: activeCompany.id,
          amount: formData.cost,
          category: 'MAINTENANCE',
          description: `Mantenimiento ${formData.type} - ${selectedVehicle.brand} ${selectedVehicle.plate} - ${formData.description}`,
          date: formData.date
        });
      }
    }

    // 3. Update vehicle status if needed
    if (selectedVehicle.status !== 'MAINTENANCE') {
      const changeStatus = window.confirm(`¿Deseas cambiar el estado del vehículo a "EN MANTENIMIENTO" para que no pueda ser rentado?`);
      if (changeStatus) {
        await updateVehicle(selectedVehicle.id, { status: 'MAINTENANCE' });
      }
    } else {
      const markAvailable = window.confirm(`El vehículo está actualmente en mantenimiento. ¿Deseas marcarlo como "DISPONIBLE" nuevamente?`);
      if (markAvailable) {
        await updateVehicle(selectedVehicle.id, { status: 'AVAILABLE' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Taller y Mantenimiento</h1>
          <p className="text-sm text-muted-foreground">Monitoreo de salud de la flota y órdenes de trabajo.</p>
        </div>
      </div>

      <div className="glass p-4 rounded-2xl shadow-apple flex items-center max-w-md">
        <Search className="text-muted-foreground mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar vehículo o placa..." 
          className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fleetHealth.map(({ vehicle, status, message }) => (
          <div key={vehicle.id} className="glass rounded-2xl overflow-hidden shadow-apple hover:shadow-lg transition-all flex flex-col h-full">
            <div className={`h-2 w-full ${
              status === 'CRITICAL' ? 'bg-rose-500' :
              status === 'WARNING' ? 'bg-amber-500' :
              'bg-emerald-500'
            }`} />
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{vehicle.brand} {vehicle.model}</h3>
                  <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                </div>
                <div className={`p-2 rounded-xl ${
                  status === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500' :
                  status === 'WARNING' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {status === 'CRITICAL' ? <AlertTriangle size={20} /> :
                   status === 'WARNING' ? <Clock size={20} /> :
                   <CheckCircle size={20} />}
                </div>
              </div>
              
              <div className="space-y-2 mb-6 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kilometraje Actual:</span>
                  <span className="font-medium text-foreground">{vehicle.currentMileage.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estado Operativo:</span>
                  <span className="font-medium text-foreground">{vehicle.status}</span>
                </div>
                <div className={`text-sm font-medium mt-2 p-2 rounded-lg ${
                  status === 'CRITICAL' ? 'bg-rose-500/5 text-rose-500' :
                  status === 'WARNING' ? 'bg-amber-500/5 text-amber-500' :
                  'bg-emerald-500/5 text-emerald-500'
                }`}>
                  {message}
                </div>
              </div>

              <Button onClick={() => setSelectedVehicle(vehicle)} variant="outline" className="w-full flex justify-center items-center gap-2">
                <Wrench size={16} />
                Registrar Servicio
              </Button>
            </div>
          </div>
        ))}
      </div>

      <MaintenanceForm 
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        vehicle={selectedVehicle}
        onSubmit={handleMaintenanceSubmit}
      />
    </div>
  );
};
