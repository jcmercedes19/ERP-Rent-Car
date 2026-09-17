import { useState, useEffect } from "react";
import { GlassModal } from "../../../shared/components/ui/GlassModal";
import { Input } from "../../../shared/components/ui/Input";
import { Button } from "../../../shared/components/ui/Button";
import { useVehicleStore, type Vehicle } from "../../../app/store/useVehicleStore";
import { useTenantStore } from "../../../app/store/useTenantStore";
import { Car, Hash, DollarSign, Activity, Image as ImageIcon, PaintBucket, Gauge, Settings2, Calendar } from "lucide-react";

interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleToEdit?: Vehicle | null;
}

export const VehicleForm = ({ isOpen, onClose, vehicleToEdit }: VehicleFormProps) => {
  const { addVehicle, updateVehicle, loading } = useVehicleStore();
  const { activeCompany } = useTenantStore();

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    plate: "",
    category: "ECONOMY" as Vehicle["category"],
    status: "AVAILABLE" as Vehicle["status"],
    dailyRate: 0,
    currentMileage: 0,
    imageUrl: "",
    color: "",
    transmission: "AUTO" as "AUTO" | "MANUAL",
    fuelType: "GASOLINE" as "GASOLINE" | "DIESEL" | "ELECTRIC" | "HYBRID",
  });

  useEffect(() => {
    if (vehicleToEdit) {
      setFormData({
        brand: vehicleToEdit.brand || "",
        model: vehicleToEdit.model || "",
        year: vehicleToEdit.year || new Date().getFullYear(),
        plate: vehicleToEdit.plate || "",
        category: vehicleToEdit.category || "ECONOMY",
        status: vehicleToEdit.status || "AVAILABLE",
        dailyRate: vehicleToEdit.dailyRate || 0,
        currentMileage: vehicleToEdit.currentMileage || 0,
        imageUrl: vehicleToEdit.imageUrl || "",
        color: vehicleToEdit.color || "",
        transmission: vehicleToEdit.transmission || "AUTO",
        fuelType: vehicleToEdit.fuelType || "GASOLINE",
      });
    } else {
      setFormData({
        brand: "", model: "", year: new Date().getFullYear(), plate: "",
        category: "ECONOMY", status: "AVAILABLE", dailyRate: 0, currentMileage: 0,
        imageUrl: "", color: "", transmission: "AUTO", fuelType: "GASOLINE",
      });
    }
  }, [vehicleToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany?.id) {
      alert("Error: No hay una empresa activa seleccionada en el sistema.");
      return;
    }

    try {
      if (vehicleToEdit) {
        await updateVehicle(vehicleToEdit.id, formData);
      } else {
        await addVehicle({ ...formData, companyId: activeCompany.id });
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving vehicle:", error);
      alert(`Ocurrió un error al guardar: ${error.message}`);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicleToEdit ? "Editar Vehículo" : "Nuevo Vehículo"}
      width="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Marca" name="brand" value={formData.brand} onChange={handleChange} icon={<Car size={18} />} required />
            <Input label="Modelo" name="model" value={formData.model} onChange={handleChange} icon={<Car size={18} />} required />
            <Input label="Año" name="year" type="number" value={formData.year} onChange={handleChange} icon={<Calendar size={18} />} required />
            <Input label="Placa / Matrícula" name="plate" value={formData.plate} onChange={handleChange} icon={<Hash size={18} />} required />
            <Input label="Tarifa Diaria ($)" name="dailyRate" type="number" step="0.01" value={formData.dailyRate} onChange={handleChange} icon={<DollarSign size={18} />} required />
            <Input label="Kilometraje Actual" name="currentMileage" type="number" value={formData.currentMileage} onChange={handleChange} icon={<Activity size={18} />} required />
          </div>
        </div>

        <div className="pt-4 border-t border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Detalles Técnicos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Color" name="color" value={formData.color} onChange={handleChange} icon={<PaintBucket size={18} />} />
            
            <div className="space-y-1 w-full">
              <label className="text-sm font-medium text-foreground ml-1">Transmisión</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><Settings2 size={18} /></div>
                <select name="transmission" value={formData.transmission} onChange={handleChange} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11">
                  <option value="AUTO">Automática</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 w-full">
              <label className="text-sm font-medium text-foreground ml-1">Combustible</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><Gauge size={18} /></div>
                <select name="fuelType" value={formData.fuelType} onChange={handleChange} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11">
                  <option value="GASOLINE">Gasolina</option>
                  <option value="DIESEL">Diésel</option>
                  <option value="HYBRID">Híbrido</option>
                  <option value="ELECTRIC">Eléctrico</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 w-full">
              <label className="text-sm font-medium text-foreground ml-1">Categoría</label>
              <select name="category" value={formData.category} onChange={handleChange} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all">
                <option value="ECONOMY">Económico</option>
                <option value="COMPACT">Compacto</option>
                <option value="SUV">SUV</option>
                <option value="LUXURY">Lujo</option>
                <option value="VAN">Van / Minivan</option>
              </select>
            </div>
            
            <div className="space-y-1 w-full">
              <label className="text-sm font-medium text-foreground ml-1">Estado</label>
              <select name="status" value={formData.status} onChange={handleChange} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all">
                <option value="AVAILABLE">Disponible</option>
                <option value="RENTED">Rentado</option>
                <option value="MAINTENANCE">En Mantenimiento</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50">
          <Input label="URL Foto del Vehículo (Opcional)" name="imageUrl" value={formData.imageUrl} onChange={handleChange} icon={<ImageIcon size={18} />} placeholder="https://..." />
        </div>

        <div className="pt-6 border-t border-border/50 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {vehicleToEdit ? "Guardar Cambios" : "Guardar Vehículo"}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
};
