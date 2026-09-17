import { useState, useEffect } from "react";
import { GlassModal } from "../../../shared/components/ui/GlassModal";
import { Input } from "../../../shared/components/ui/Input";
import { Button } from "../../../shared/components/ui/Button";
import { useReservationStore } from "../../../app/store/useReservationStore";
import { useTenantStore } from "../../../app/store/useTenantStore";
import { useCustomerStore } from "../../../app/store/useCustomerStore";
import { useVehicleStore } from "../../../app/store/useVehicleStore";
import { Calendar as CalendarIcon, User, Car, DollarSign, Package } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date | null;
}

const AVAILABLE_EXTRAS = [
  { id: 'BABY_SEAT', name: 'Silla de Bebé', price: 10 },
  { id: 'GPS', name: 'GPS Navigator', price: 5 },
  { id: 'PREMIUM_INSURANCE', name: 'Seguro Premium', price: 25 },
  { id: 'ADDITIONAL_DRIVER', name: 'Conductor Adicional', price: 15 },
];

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
    extras: [] as string[],
  });

  const [financials, setFinancials] = useState({
    subtotal: 0,
    tax: 0,
    deposit: 0,
    totalEstimated: 0
  });

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
      const days = Math.max(1, differenceInDays(end, start));
      
      const vehicle = vehicles.find(v => v.id === formData.vehicleId);
      if (vehicle) {
        let extrasTotal = 0;
        formData.extras.forEach(extraId => {
          const extra = AVAILABLE_EXTRAS.find(e => e.id === extraId);
          if (extra) extrasTotal += extra.price * days;
        });

        const rentalCost = days * vehicle.dailyRate;
        const subtotal = rentalCost + extrasTotal;
        const tax = subtotal * 0.18; // 18% ITBIS
        
        // Deposit logic: Economy = 200, Compact = 300, SUV/VAN = 500, Luxury = 1000
        let deposit = 200;
        if (vehicle.category === 'COMPACT') deposit = 300;
        if (vehicle.category === 'SUV' || vehicle.category === 'VAN') deposit = 500;
        if (vehicle.category === 'LUXURY') deposit = 1000;

        setFinancials({
          subtotal,
          tax,
          deposit,
          totalEstimated: subtotal + tax
        });
      }
    } else {
      setFinancials({ subtotal: 0, tax: 0, deposit: 0, totalEstimated: 0 });
    }
  }, [formData.startDate, formData.endDate, formData.vehicleId, formData.extras, vehicles]);

  const handleExtraToggle = (extraId: string) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.includes(extraId) 
        ? prev.extras.filter(id => id !== extraId)
        : [...prev.extras, extraId]
    }));
  };

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
        extras: formData.extras,
        subtotal: financials.subtotal,
        tax: financials.tax,
        deposit: financials.deposit,
        totalEstimated: financials.totalEstimated,
        notes: formData.notes
      });
      onClose();
      setFormData({ customerId: "", vehicleId: "", startDate: "", endDate: "", notes: "", extras: [] });
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground ml-1 flex items-center gap-2">
            <Package size={16} /> Extras y Complementos
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_EXTRAS.map(extra => (
              <div 
                key={extra.id}
                onClick={() => handleExtraToggle(extra.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                  formData.extras.includes(extra.id) 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-background/50 border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <span className="text-sm font-medium">{extra.name}</span>
                <span className="text-xs font-bold">+${extra.price}/día</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-4 rounded-xl border border-primary/20 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal (Renta + Extras)</span>
            <span className="font-medium">${financials.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Impuestos (18% ITBIS)</span>
            <span className="font-medium">${financials.tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-amber-500 font-medium flex items-center gap-1">Depósito de Garantía (Retención)</span>
            <span className="font-medium text-amber-500">${financials.deposit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <div className="pt-3 border-t border-border flex justify-between items-center">
            <span className="font-bold text-foreground">Total a Cobrar</span>
            <span className="text-2xl font-bold text-primary flex items-center">
              <DollarSign size={20} />
              {financials.totalEstimated.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </span>
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
