import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useReservationStore } from "../../app/store/useReservationStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { useVehicleStore } from "../../app/store/useVehicleStore";
import { useCustomerStore } from "../../app/store/useCustomerStore";
import { ReservationForm } from "./components/ReservationForm";
import { Plus } from "lucide-react";
import { Button } from "../../shared/components/ui/Button";

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const ReservationCalendar = () => {
  const { activeCompany, activeBranchId } = useTenantStore();
  const { reservations, fetchReservations } = useReservationStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { customers, fetchCustomers } = useCustomerStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (activeCompany?.id) {
      fetchReservations(activeCompany.id, activeBranchId);
      fetchVehicles(activeCompany.id, activeBranchId);
      fetchCustomers(activeCompany.id);
    }
  }, [activeCompany?.id, fetchReservations, fetchVehicles, fetchCustomers]);

  const handleSelectSlot = (slotInfo: { start: Date, end: Date }) => {
    setSelectedDate(slotInfo.start);
    setIsFormOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    // We could open a detail modal here
    console.log("Selected Event", event);
  };

  const events = reservations.map(res => {
    const vehicle = vehicles.find(v => v.id === res.vehicleId);
    const customer = customers.find(c => c.id === res.customerId);
    
    return {
      id: res.id,
      title: `${vehicle?.brand} ${vehicle?.model} - ${customer?.firstName} ${customer?.lastName}`,
      start: new Date(res.startDate),
      end: new Date(res.endDate),
      status: res.status,
      resource: res
    };
  });

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3b82f6'; // PENDING - blue
    if (event.status === 'CONFIRMED') backgroundColor = '#10b981'; // emerald
    if (event.status === 'CANCELLED') backgroundColor = '#ef4444'; // red
    if (event.status === 'COMPLETED') backgroundColor = '#6b7280'; // gray

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendario de Reservas</h1>
          <p className="text-sm text-muted-foreground">Gestiona y planifica la disponibilidad de la flota.</p>
        </div>
        <Button onClick={() => { setSelectedDate(new Date()); setIsFormOpen(true); }}>
          <Plus size={18} className="mr-2" />
          Nueva Reserva
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-3 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm font-medium">Pendiente</span>
        </div>
        <div className="glass p-3 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-sm font-medium">Confirmada (Check-in activo)</span>
        </div>
        <div className="glass p-3 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span className="text-sm font-medium">Completada (Check-out)</span>
        </div>
        <div className="glass p-3 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm font-medium">Cancelada</span>
        </div>
      </div>

      <div className="glass p-4 rounded-2xl shadow-apple h-[700px]">
        <style>{`
          .rbc-calendar { font-family: inherit; }
          .rbc-toolbar button { color: var(--foreground); border-color: var(--border); }
          .rbc-toolbar button:active, .rbc-toolbar button.rbc-active { background-color: var(--primary); color: white; border-color: var(--primary); }
          .rbc-toolbar button:hover { background-color: var(--secondary); }
          .rbc-day-bg { border-left-color: var(--border); border-bottom-color: var(--border); }
          .rbc-month-row { border-top-color: var(--border); }
          .rbc-header { border-bottom-color: var(--border); border-left-color: var(--border); padding: 8px 0; font-weight: 600; color: var(--muted-foreground); }
          .rbc-off-range-bg { background-color: var(--secondary); opacity: 0.3; }
          .rbc-today { background-color: rgba(59, 130, 246, 0.05); }
        `}</style>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="es"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          messages={{
            next: "Sig",
            previous: "Ant",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            noEventsInRange: "No hay reservas en este periodo."
          }}
        />
      </div>

      <ReservationForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setSelectedDate(null);
        }} 
        selectedDate={selectedDate}
      />
    </div>
  );
};
