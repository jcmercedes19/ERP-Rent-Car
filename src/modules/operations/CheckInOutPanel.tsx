import { useState, useEffect } from "react";
import { useReservationStore } from "../../app/store/useReservationStore";
import { useVehicleStore } from "../../app/store/useVehicleStore";
import { useCustomerStore } from "../../app/store/useCustomerStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { useFinanceStore } from "../../app/store/useFinanceStore";
import { InspectionForm } from "./components/InspectionForm";
import { Search, LogOut, LogIn, Clock } from "lucide-react";

export const CheckInOutPanel = () => {
  const { activeCompany } = useTenantStore();
  const { reservations, fetchReservations, updateReservationStatus } = useReservationStore();
  const { vehicles, fetchVehicles, updateVehicle } = useVehicleStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { addTransaction } = useFinanceStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeInspection, setActiveInspection] = useState<{
    reservation: any;
    vehicle: any;
    type: 'CHECK_IN' | 'CHECK_OUT';
  } | null>(null);

  useEffect(() => {
    if (activeCompany?.id) {
      fetchReservations(activeCompany.id);
      fetchVehicles(activeCompany.id);
      fetchCustomers(activeCompany.id);
    }
  }, [activeCompany?.id, fetchReservations, fetchVehicles, fetchCustomers]);

  // We are only interested in PENDING and CONFIRMED reservations for this panel, or reservations starting/ending "today"
  const activeReservations = reservations.filter(r => r.status === 'PENDING' || r.status === 'CONFIRMED');
  
  const filteredReservations = activeReservations.filter(r => {
    const customer = customers.find(c => c.id === r.customerId);
    const vehicle = vehicles.find(v => v.id === r.vehicleId);
    const searchString = `${customer?.firstName} ${customer?.lastName} ${vehicle?.plate} ${r.id}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const handleInspectionComplete = async (inspectionData: any) => {
    if (!activeInspection) return;
    
    try {
      const { type, reservation, vehicle } = activeInspection;
      
      // En un sistema real, guardaríamos el inspectionData en una colección 'inspections'
      console.log("Datos de inspección:", inspectionData);

      if (type === 'CHECK_OUT') {
        // Pasa de PENDING a CONFIRMED
        await updateReservationStatus(reservation.id, 'CONFIRMED');
        // Vehículo pasa a RENTED
        await updateVehicle(vehicle.id, { status: 'RENTED', mileage: data.mileage });
      } else {
        // CHECK_IN
        // Pasa de CONFIRMED a COMPLETED
        await updateReservationStatus(reservation.id, 'COMPLETED');
        // Vehículo pasa a AVAILABLE (o NEEDS_CLEANING)
        await updateVehicle(vehicle.id, { 
          status: 'AVAILABLE', 
          mileage: data.mileage 
        });

        // Automatización de Penalidades (Si hay daños nuevos o falta combustible)
        let penaltyAmount = 0;
        let penaltyDescription = "Penalidad por: ";
        
        if (data.damages && data.damages.length > 0) {
          penaltyAmount += 150; // Flat fee penalidad por daños (se ajustará luego en finanzas)
          penaltyDescription += `Nuevos daños reportados en ${data.damages.join(', ')}. `;
        }
        if (data.fuelLevel !== "8/8" && data.fuelLevel !== "7/8") {
          penaltyAmount += 25; // Penalidad por combustible
          penaltyDescription += `Combustible incompleto (${data.fuelLevel}). `;
        }

        if (penaltyAmount > 0) {
          const confirmPenalty = window.confirm(`El vehículo presenta novedades durante el Check-In.\n\n${penaltyDescription}\n\n¿Deseas generar automáticamente un cargo de penalidad por $${penaltyAmount} en el estado de cuenta del cliente?`);
          
          if (confirmPenalty) {
            await addTransaction({
              companyId: activeCompany.id,
              type: 'INCOME',
              category: 'PENALTY',
              amount: penaltyAmount,
              date: new Date().toISOString(),
              description: `Reserva ${reservation.id.slice(0,8)} - ${penaltyDescription}`,
              referenceId: reservation.id
            });
            alert("Penalidad generada exitosamente en el módulo de Finanzas.");
          }
        }
      }
      
      alert(`Flujo de ${type === 'CHECK_OUT' ? 'Entrega' : 'Recepción'} completado exitosamente.`);
    } catch (error) {
      alert("Error al completar la operación.");
    } finally {
      setActiveInspection(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operaciones (Check-In / Out)</h1>
          <p className="text-sm text-muted-foreground">Gestiona la entrega y recepción física de los vehículos.</p>
        </div>
      </div>

      <div className="glass p-4 rounded-2xl shadow-apple flex items-center max-w-md">
        <Search className="text-muted-foreground mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por cliente, placa o reserva..." 
          className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredReservations.length === 0 ? (
          <div className="glass p-8 rounded-2xl text-center flex flex-col items-center justify-center text-muted-foreground">
            <Clock size={48} className="mb-4 opacity-50" />
            <p>No hay entregas ni recepciones pendientes.</p>
          </div>
        ) : (
          filteredReservations.map(res => {
            const customer = customers.find(c => c.id === res.customerId);
            const vehicle = vehicles.find(v => v.id === res.vehicleId);
            const isPending = res.status === 'PENDING';
            
            return (
              <div key={res.id} className="glass p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${isPending ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {isPending ? <LogOut size={24} /> : <LogIn size={24} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {isPending ? 'Entrega de Vehículo (Check-Out)' : 'Recepción de Vehículo (Check-In)'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">{customer?.firstName} {customer?.lastName}</span> • {vehicle?.brand} {vehicle?.model} ({vehicle?.plate})
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fechas: {new Date(res.startDate).toLocaleDateString()} - {new Date(res.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isPending ? (
                    <button 
                      onClick={() => setActiveInspection({ reservation: res, vehicle, type: 'CHECK_OUT' })}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Iniciar Check-Out
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveInspection({ reservation: res, vehicle, type: 'CHECK_IN' })}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
                    >
                      <LogIn size={16} />
                      Iniciar Check-In
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeInspection && (
        <InspectionForm 
          isOpen={!!activeInspection}
          onClose={() => setActiveInspection(null)}
          reservation={activeInspection.reservation}
          vehicle={activeInspection.vehicle}
          type={activeInspection.type}
          onComplete={handleInspectionComplete}
        />
      )}
    </div>
  );
};
