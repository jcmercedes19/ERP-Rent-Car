import { useState, useEffect } from "react";
import { GlassModal } from "../../../shared/components/ui/GlassModal";
import { Input } from "../../../shared/components/ui/Input";
import { Button } from "../../../shared/components/ui/Button";
import { useVehicleStore, type Vehicle } from "../../../app/store/useVehicleStore";
import { useTenantStore } from "../../../app/store/useTenantStore";
import { Car, Hash, DollarSign, Activity, Image as ImageIcon, PaintBucket, Gauge, Settings2, Calendar, UploadCloud, X } from "lucide-react";
import { compressImage } from "../../../core/utils/imageUtils";


interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleToEdit?: Vehicle | null;
}

export const VehicleForm = ({ isOpen, onClose, vehicleToEdit }: VehicleFormProps) => {
  const { addVehicle, updateVehicle, loading } = useVehicleStore();
  const { activeCompany, activeBranchId } = useTenantStore();

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
    fuelType: "GASOLINE" as Vehicle["fuelType"],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

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
      setImageFile(null);
      setImagePreview(vehicleToEdit.imageUrl || "");
    } else {
      setFormData({
        brand: "", model: "", year: new Date().getFullYear(), plate: "",
        category: "ECONOMY", status: "AVAILABLE", dailyRate: 0, currentMileage: 0,
        imageUrl: "", color: "", transmission: "AUTO", fuelType: "GASOLINE",
      });
      setImageFile(null);
      setImagePreview("");
    }
  }, [vehicleToEdit, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({      ...prev, 
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
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        setUploadingImage(true);
        // Generamos un string base64 comprimido usando la utilidad compartida
        finalImageUrl = await compressImage(imageFile, 600, 0.6);
        setUploadingImage(false);
      }

      if (vehicleToEdit) {
        await updateVehicle(vehicleToEdit.id, { ...formData, imageUrl: finalImageUrl });
      } else {
        if (!activeBranchId) {
          alert("Error: Seleccione una sucursal activa primero.");
          return;
        }
        await addVehicle({ ...formData, companyId: activeCompany.id, branchId: activeBranchId, imageUrl: finalImageUrl });
      }
      onClose();
    } catch (error: any) {
      setUploadingImage(false);
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
                <option value="AVAILABLE">Disponible (Listo para rentar)</option>
                <option value="RESERVED">Reservado (Asignado a reserva futura)</option>
                <option value="RENTED">Rentado (Contrato Activo)</option>
                <option value="DELIVERY">En Entrega (En proceso de entrega)</option>
                <option value="RETURNING">Retornando (En proceso de devolución)</option>
                <option value="MAINTENANCE">Mantenimiento (Preventivo/Correctivo)</option>
                <option value="REPAIR">Reparación (Daño mayor)</option>
                <option value="ACCIDENT">Accidentado (Siniestrado)</option>
                <option value="OUT_OF_SERVICE">Fuera de Servicio (Baja temporal)</option>
                <option value="SOLD">Vendido (Baja definitiva)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Fotografía del Vehículo</h3>
          <div className="flex items-center gap-4">
            {(imagePreview || formData.imageUrl) ? (
              <div className="relative w-24 h-24 rounded-xl border border-border overflow-hidden bg-background/50 flex-shrink-0">
                <img src={imagePreview || formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); setFormData(p => ({ ...p, imageUrl: "" })); }} className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-black/70">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-background/20 flex-shrink-0">
                <ImageIcon size={24} className="mb-2 opacity-50" />
                <span className="text-[10px] text-center px-2">Sin imagen</span>
              </div>
            )}
            
            <div className="flex-1">
              <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 text-sm font-medium text-primary transition-all hover:bg-primary/20">
                <UploadCloud size={18} />
                <span>{imageFile ? "Cambiar Imagen" : "Subir Imagen"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Formatos soportados: JPG, PNG, WEBP. Tamaño máx recomendado: 2MB.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading || uploadingImage} disabled={uploadingImage}>
            {vehicleToEdit ? "Guardar Cambios" : "Guardar Vehículo"}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
};
