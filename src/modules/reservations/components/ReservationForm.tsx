import { useState, useEffect } from "react";
import { GlassModal } from "../../../shared/components/ui/GlassModal";
import { Input } from "../../../shared/components/ui/Input";
import { Button } from "../../../shared/components/ui/Button";
import { useReservationStore } from "../../../app/store/useReservationStore";
import { useTenantStore } from "../../../app/store/useTenantStore";
import { useCustomerStore } from "../../../app/store/useCustomerStore";
import { useVehicleStore } from "../../../app/store/useVehicleStore";
import { Calendar as CalendarIcon, User, Car, DollarSign } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date | null;
}

export const ReservationForm = ({ isOpen, onClose, selectedDate }: ReservationFormProps) => {
  const { addReservation, loading } = useReservationStore();
  const { activeCompany } = useTenantStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { vehicles, fetchVehicles } = useVehicleStore();

  const [formData, setFormData] = useState({
    customerId: "",
    vehicleId: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const [totalEstimated, setTotalEstimated] = useState(0);

  useEffect(() => {
    if (activeCompany?.id) {
      fetchCustomers(activeCompany.id);
      fetchVehicles(activeCompany.id);
    }
  }, [activeCompany?.id, fetchCustomers, fetchVehicles]);

  useEffect(() => {
    if (selectedDate) {
      const start = selectedDate.toISOString().split('T')[0];
      const end = new Date(selectedDate.getTime() + 86400000).toISOString().split('T')[0]; // Next day
      setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
    } else {
      setFormData(prev => ({ ...prev, startDate: "", endDate: "" }));
    }
  }, [selectedDate, isOpen]);

  // Calculate total automatically
  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.vehicleId) {
      const start = parseISO(formData.startDate);
      const end = parseISO(formData.endDate);
      const days = differenceInDays(end, start);
      
      if (days > 0) {
        const vehicle = vehicles.find(v => v.id === formData.vehicleId);
        if (vehicle) {
          setTotalEstimated(days * vehicle.dailyRate);
        }
      } else {
        setTotalEstimated(0);
      }
    }
  }, [formData.startDate, formData.endDate, formData.vehicleId, vehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany?.id) return;

    try {
      await addReservation({
        companyId: activeCompany.id,
        customerId: formData.customerId,
        vehicleId: formData.vehicleId,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        status: 'PENDING',
        totalEstimated,
        notes: formData.notes
      });
      onClose();
      setFormData({ customerId: "", vehicleId: "", startDate: "", endDate: "", notes: "" });
    } catch (error: any) {
      alert(error.message || "Error al crear la reservación");
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Nueva Reservación" width="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 w-full">
            <label className="text-sm font-medium text-foreground ml-1">Cliente</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><User size={18} /></div>
              <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11">
                <option value="">Seleccione un cliente...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.documentId})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1 w-full">
            <label className="text-sm font-medium text-foreground ml-1">Vehículo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><Car size={18} /></div>
              <select required value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11">
                <option value="">Seleccione un vehículo...</option>
                {vehicles.filter(v => v.status !== 'SOLD' && v.status !== 'OUT_OF_SERVICE').map(v => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} - {v.plate} (${v.dailyRate}/día)</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Fecha de Inicio" type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} icon={<CalendarIcon size={18} />} />
          <Input label="Fecha de Fin" type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} icon={<CalendarIcon size={18} />} />
        </div>

        <div className="glass p-4 rounded-xl border border-primary/20 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Estimado</p>
            <p className="text-xs text-muted-foreground">Calculado automáticamente por tarifa diaria</p>
          </div>
          <div className="text-2xl font-bold text-primary flex items-center">
            <DollarSign size={24} />
            {totalEstimated.toLocaleString()}
          </div>
        </div>

        <Input label="Notas (Opcional)" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Vuelo AA1054, silla de bebé requerida..." />

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Confirmar Reserva</Button>
        </div>
      </form>
    </GlassModal>
  );
};
