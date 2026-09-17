import { useState } from "react";
import { GlassModal } from "../../../shared/components/ui/GlassModal";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { Wrench, Calendar, DollarSign, PenTool, Activity } from "lucide-react";

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
  onSubmit: (data: any) => Promise<void>;
}

export const MaintenanceForm = ({ isOpen, onClose, vehicle, onSubmit }: MaintenanceFormProps) => {
  const [formData, setFormData] = useState({
    type: "PREVENTIVE" as "PREVENTIVE" | "CORRECTIVE",
    category: "OIL_CHANGE" as "OIL_CHANGE" | "TIRES" | "BRAKES" | "ENGINE" | "TRANSMISSION" | "BODY" | "OTHER",
    date: new Date().toISOString().split('T')[0],
    mileageAtService: vehicle?.currentMileage || 0,
    cost: 0,
    provider: "",
    description: "",
    nextServiceMileage: 0
  });

  const [loading, setLoading] = useState(false);

  // Auto-calculate nextServiceMileage based on category
  const handleCategoryChange = (cat: string) => {
    let nextMileage = 0;
    if (cat === "OIL_CHANGE") {
      nextMileage = formData.mileageAtService + 5000;
    } else if (cat === "TIRES") {
      nextMileage = formData.mileageAtService + 40000;
    } else if (cat === "BRAKES") {
      nextMileage = formData.mileageAtService + 20000;
    }

    setFormData({
      ...formData,
      category: cat as any,
      nextServiceMileage: nextMileage
    });
  };

  const handleMileageChange = (mileage: number) => {
    let nextMileage = 0;
    if (formData.category === "OIL_CHANGE") {
      nextMileage = mileage + 5000;
    } else if (formData.category === "TIRES") {
      nextMileage = mileage + 40000;
    } else if (formData.category === "BRAKES") {
      nextMileage = mileage + 20000;
    }
    setFormData({ ...formData, mileageAtService: mileage, nextServiceMileage: nextMileage });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle) return null;

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Registrar Mantenimiento" width="lg">
      <div className="mb-6 p-4 rounded-xl bg-secondary/50 flex items-start gap-4">
        <div className="p-3 bg-primary/10 text-primary rounded-lg">
          <Wrench size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{vehicle.brand} {vehicle.model}</h3>
          <p className="text-sm text-muted-foreground">Placa: {vehicle.plate} • Kilometraje Actual: {vehicle.currentMileage}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1">Tipo de Servicio</label>
            <select 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value as any})} 
              className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
            >
              <option value="PREVENTIVE">Preventivo (Rutina)</option>
              <option value="CORRECTIVE">Correctivo (Avería)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1">Categoría</label>
            <select 
              value={formData.category} 
              onChange={e => handleCategoryChange(e.target.value)} 
              className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
            >
              <option value="OIL_CHANGE">Cambio de Aceite</option>
              <option value="TIRES">Llantas / Gomas</option>
              <option value="BRAKES">Frenos</option>
              <option value="ENGINE">Motor</option>
              <option value="TRANSMISSION">Transmisión</option>
              <option value="BODY">Desabolladura / Pintura</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Fecha del Servicio" 
            type="date" 
            required 
            value={formData.date} 
            onChange={e => setFormData({...formData, date: e.target.value})} 
            icon={<Calendar size={18} />} 
          />
          <Input 
            label="Costo ($)" 
            type="number" 
            required 
            min="0"
            step="0.01"
            value={formData.cost} 
            onChange={e => setFormData({...formData, cost: Number(e.target.value)})} 
            icon={<DollarSign size={18} />} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Kilometraje al realizar servicio" 
            type="number" 
            required 
            value={formData.mileageAtService} 
            onChange={e => handleMileageChange(Number(e.target.value))} 
            icon={<Activity size={18} />} 
          />
          {formData.type === 'PREVENTIVE' && (
            <Input 
              label="Próximo Servicio (Km)" 
              type="number" 
              value={formData.nextServiceMileage} 
              onChange={e => setFormData({...formData, nextServiceMileage: Number(e.target.value)})} 
              icon={<Activity size={18} />} 
            />
          )}
        </div>

        <Input 
          label="Taller / Proveedor (Opcional)" 
          value={formData.provider} 
          onChange={e => setFormData({...formData, provider: e.target.value})} 
          icon={<PenTool size={18} />} 
        />

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground ml-1">Descripción / Notas</label>
          <textarea 
            required
            placeholder="Ej. Cambio de aceite 10w30 y filtro..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="flex min-h-[80px] w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
          />
        </div>

        <div className="pt-4 border-t border-border mt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Registrar Mantenimiento"}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
};
