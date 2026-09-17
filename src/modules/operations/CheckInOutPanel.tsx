import { useState, useEffect } from "react";
import { useReservationStore, type Reservation } from "../../app/store/useReservationStore";
import { useVehicleStore } from "../../app/store/useVehicleStore";
import { useCustomerStore } from "../../app/store/useCustomerStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { useFinanceStore } from "../../app/store/useFinanceStore";
import { InspectionForm } from "./components/InspectionForm";
import { PaymentModal } from "./components/PaymentModal";
import { Search, LogIn, LogOut, Clock, AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';

export const CheckInOutPanel = () => {
  const { activeCompany, activeBranchId } = useTenantStore();
  const { reservations, fetchReservations, updateReservationStatus } = useReservationStore();
  const { vehicles, fetchVehicles, updateVehicle } = useVehicleStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { addPayment } = useFinanceStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeInspection, setActiveInspection] = useState<{
    reservation: Reservation;
    vehicle: any;
    type: 'CHECK_IN' | 'CHECK_OUT';
  } | null>(null);
  const [sharingLinkId, setSharingLinkId] = useState<string | null>(null);
  const [activePaymentReservation, setActivePaymentReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (activeCompany?.id) {
      fetchReservations(activeCompany.id, activeBranchId);
      fetchVehicles(activeCompany.id, activeBranchId);
      fetchCustomers(activeCompany.id);
    }
  }, [activeCompany?.id, fetchReservations, fetchVehicles, fetchCustomers]);

  const handleSharePreCheckIn = async (res: Reservation, customer: any) => {
    try {
      setSharingLinkId(res.id);
      let url = '';
      if (res.preCheckInToken) {
        url = `${window.location.origin}/precheckin/${res.id}/${res.preCheckInToken}`;
      } else {
        url = await useReservationStore.getState().generatePreCheckInLink(res.id);
      }
      
      if (customer?.phone) {
        const cleanPhone = customer.phone.replace(/\D/g, '');
        const message = `¡Hola! Antes de retirar tu vehículo, por favor completa tu Pre-Check-In requerido por el INTRANT aquí: ${url}`;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      } else {
        // Fallback copy to clipboard
        navigator.clipboard.writeText(url);
        alert('Enlace copiado al portapapeles. El cliente no tiene teléfono configurado.');
      }
    } catch (e: any) {
      alert("Error al generar el enlace: " + e.message);
    } finally {
      setSharingLinkId(null);
    }
  };

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

      if (!activeCompany?.id) return;

      if (type === 'CHECK_OUT') {
        // Pasa de PENDING a CONFIRMED
        await updateReservationStatus(reservation.id, 'CONFIRMED');
        // Vehículo pasa a RENTED
        await updateVehicle(vehicle.id, { status: 'RENTED', currentMileage: inspectionData.mileage });
      } else {
        // CHECK_IN
        // Pasa de CONFIRMED a COMPLETED
        await updateReservationStatus(reservation.id, 'COMPLETED');
        // Vehículo pasa a AVAILABLE (o NEEDS_CLEANING)
        await updateVehicle(vehicle.id, { 
          status: 'AVAILABLE', 
          currentMileage: inspectionData.mileage 
        });

        // Automatización de Penalidades (Si hay daños nuevos o falta combustible)
        let penaltyAmount = 0;
        let penaltyDescription = "Penalidad por: ";
        
        if (inspectionData.damages && inspectionData.damages.length > 0) {
          penaltyAmount += 150; // Flat fee penalidad por daños (se ajustará luego en finanzas)
          penaltyDescription += `Nuevos daños reportados en ${inspectionData.damages.join(', ')}. `;
        }
        if (inspectionData.fuelLevel !== "8/8" && inspectionData.fuelLevel !== "7/8") {
          penaltyAmount += 25; // Penalidad por combustible
          penaltyDescription += `Combustible incompleto (${inspectionData.fuelLevel}). `;
        }

        if (penaltyAmount > 0) {
          const confirmPenalty = window.confirm(`El vehículo presenta novedades durante el Check-In.\n\n${penaltyDescription}\n\n¿Deseas generar automáticamente un cargo de penalidad por $${penaltyAmount} en el estado de cuenta del cliente?`);
          
          if (confirmPenalty) {
            await addPayment({
              companyId: activeCompany.id,
              contractId: reservation.id,
              amount: penaltyAmount,
              method: 'CASH', // Asumimos efectivo por defecto para que lo edite después
              type: 'PENALTY',
              reference: `Penalidad Auto-generada`,
              notes: `Reserva ${reservation.id.slice(0,8)} - ${penaltyDescription}`
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
                    <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                      {isPending ? 'Entrega de Vehículo (Check-Out)' : 'Recepción de Vehículo (Check-In)'}
                      {res.preCheckInStatus === 'completed' && (
                        <span className="bg-emerald-500/20 text-emerald-500 text-xs px-2 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle size={12} /> Pre-Check-In Listo
                        </span>
                      )}
                      {res.preCheckInStatus === 'pending' && (
                        <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded-full border border-yellow-500/30 flex items-center gap-1">
                          <Clock size={12} /> Pre-Check-In Pnd.
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">{customer?.firstName} {customer?.lastName}</span> • {vehicle?.brand} {vehicle?.model} ({vehicle?.plate})
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fechas: {new Date(res.startDate).toLocaleDateString()} - {new Date(res.endDate).toLocaleDateString()}
                    </p>
                    
                    {/* INTRANT Validation Warnings */}
                    {res.preCheckInData && (
                      <div className="mt-2 text-xs">
                        {new Date(res.preCheckInData.driverLicenseExpiry) < new Date(res.startDate) ? (
                          <p className="text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> Vencimiento de Licencia ANTES del alquiler. <b>(NO AUTORIZADO)</b></p>
                        ) : new Date(res.preCheckInData.driverLicenseExpiry) < new Date(res.endDate) ? (
                          <p className="text-amber-500 flex items-center gap-1"><AlertTriangle size={12}/> Precaución: La licencia vence DURANTE el período de renta.</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {isPending && res.preCheckInStatus !== 'completed' && (
                    <button
                      onClick={() => handleSharePreCheckIn(res, customer)}
                      disabled={sharingLinkId === res.id}
                      className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      {sharingLinkId === res.id ? 'Generando...' : 'Pedir Pre-Check-In'}
                    </button>
                  )}
                  {isPending && (
                    <button
                      onClick={() => setActivePaymentReservation(res)}
                      className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                    >
                      <CreditCard size={16} />
                      Cobrar con Tarjeta
                    </button>
                  )}
                  {isPending ? (
                    <button
                      onClick={() => {
                        if (res.preCheckInStatus !== 'completed') {
                          if(!window.confirm("El cliente NO ha completado el Pre-Check-In digital obligatorio. ¿Desea continuar con el Check-Out manual bajo su responsabilidad?")) return;
                        }
                        setActiveInspection({ reservation: res, vehicle, type: 'CHECK_OUT' })
                      }}
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

      {activePaymentReservation && (
        <PaymentModal
          isOpen={!!activePaymentReservation}
          onClose={() => setActivePaymentReservation(null)}
          reservation={activePaymentReservation}
        />
      )}
    </div>
  );
};
