import { useState, useEffect } from "react";
import { GlassModal } from "../../../shared/components/ui/GlassModal";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { Car, Camera, Fuel, Activity, FileText } from "lucide-react";

interface InspectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: any;
  vehicle: any;
  type: 'CHECK_IN' | 'CHECK_OUT';
  onComplete: (data: any) => void;
}

export const InspectionForm = ({ isOpen, onClose, reservation, vehicle, type, onComplete }: InspectionFormProps) => {
  const [formData, setFormData] = useState({
    fuelLevel: "8/8", // Full
    mileage: vehicle?.mileage || 0,
    hasDamages: false,
    damageNotes: "",
    signature: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ ...formData, type, timestamp: new Date().toISOString() });
    onClose();
  };

  if (!reservation || !vehicle) return null;

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={`Inspección de ${type === 'CHECK_OUT' ? 'Entrega' : 'Recepción'}`} width="md">
      <div className="mb-6 p-4 rounded-xl bg-secondary/50 flex items-start gap-4">
        <div className="p-3 bg-primary/10 text-primary rounded-lg">
          <Car size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{vehicle.brand} {vehicle.model} - {vehicle.plate}</h3>
          <p className="text-sm text-muted-foreground">Reserva: {reservation.id.slice(0,8)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1">Nivel de Combustible</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><Fuel size={18} /></div>
              <select value={formData.fuelLevel} onChange={e => setFormData({...formData, fuelLevel: e.target.value})} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11">
                <option value="8/8">Lleno (8/8)</option>
                <option value="7/8">7/8</option>
                <option value="6/8">3/4 (6/8)</option>
                <option value="4/8">Medio (4/8)</option>
                <option value="2/8">1/4 (2/8)</option>
                <option value="1/8">Reserva</option>
              </select>
            </div>
          </div>
          <Input 
            label="Kilometraje Actual" 
            type="number" 
            value={formData.mileage} 
            onChange={e => setFormData({...formData, mileage: Number(e.target.value)})} 
            icon={<Activity size={18} />} 
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input 
            type="checkbox" 
            id="hasDamages" 
            checked={formData.hasDamages} 
            onChange={e => setFormData({...formData, hasDamages: e.target.checked})}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
          />
          <label htmlFor="hasDamages" className="text-sm text-foreground">¿El vehículo presenta daños o detalles?</label>
        </div>

        {formData.hasDamages && (
          <div className="space-y-3 animate-in slide-in-from-top-2">
            <div className="glass p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-500">
              Por favor, documenta cualquier rayón, golpe, abolladura o daño interior en el recuadro de abajo. 
            </div>
            <textarea 
              placeholder="Ej. Rayón en la puerta del pasajero. Falta tapa de válvula frontal izquierda..."
              required
              value={formData.damageNotes}
              onChange={e => setFormData({...formData, damageNotes: e.target.value})}
              className="flex min-h-[100px] w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
            />
          </div>
        )}

        <div className="pt-4 border-t border-border mt-4">
          <Input 
            label="Nombre o Firma Digital (Operador/Cliente)" 
            value={formData.signature} 
            onChange={e => setFormData({...formData, signature: e.target.value})} 
            icon={<FileText size={18} />} 
            required
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">
            {type === 'CHECK_OUT' ? 'Confirmar Entrega' : 'Confirmar Recepción'}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
};
