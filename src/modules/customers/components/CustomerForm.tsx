import { useState, useEffect } from "react";
import { GlassModal } from "../../../shared/components/ui/GlassModal";
import { Input } from "../../../shared/components/ui/Input";
import { Button } from "../../../shared/components/ui/Button";
import { useCustomerStore, type Customer } from "../../../app/store/useCustomerStore";
import { useTenantStore } from "../../../app/store/useTenantStore";
import { User, Mail, Phone, CreditCard, MapPin, Calendar, Globe, Briefcase, Building2, HeartPulse, UploadCloud, X } from "lucide-react";
import { compressImage } from "../../../core/utils/imageUtils";

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export const CustomerForm = ({ isOpen, onClose, customerToEdit }: CustomerFormProps) => {
  const { addCustomer, updateCustomer, loading } = useCustomerStore();
  const { activeCompany } = useTenantStore();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    documentId: "",
    licenseNumber: "",
    address: "",
    dateOfBirth: "",
    nationality: "",
    company: "",
    jobTitle: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    photoUrl: "",
    documentImages: [] as string[],
    status: "active" as "active" | "inactive",
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        firstName: customerToEdit.firstName || "",
        lastName: customerToEdit.lastName || "",
        email: customerToEdit.email || "",
        phone: customerToEdit.phone || "",
        documentId: customerToEdit.documentId || "",
        licenseNumber: customerToEdit.licenseNumber || "",
        address: customerToEdit.address || "",
        dateOfBirth: customerToEdit.dateOfBirth || "",
        nationality: customerToEdit.nationality || "",
        company: customerToEdit.company || "",
        jobTitle: customerToEdit.jobTitle || "",
        emergencyContactName: customerToEdit.emergencyContactName || "",
        emergencyContactPhone: customerToEdit.emergencyContactPhone || "",
        photoUrl: customerToEdit.photoUrl || "",
        documentImages: customerToEdit.documentImages || [],
        status: customerToEdit.status || "active",
      });
    } else {
      setFormData({
        firstName: "", lastName: "", email: "", phone: "", documentId: "", licenseNumber: "",
        address: "", dateOfBirth: "", nationality: "", company: "", jobTitle: "",
        emergencyContactName: "", emergencyContactPhone: "", photoUrl: "", documentImages: [], status: "active",
      });
    }
  }, [customerToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const files = Array.from(e.target.files);
      const compressedImages = await Promise.all(
        files.map(file => compressImage(file, 1024, 0.7)) // Resolución más alta (1024) para legibilidad
      );
      
      setFormData(prev => ({
        ...prev,
        documentImages: [...prev.documentImages, ...compressedImages]
      }));
    } catch (error) {
      console.error("Error compressing images:", error);
      alert("Error al procesar algunas imágenes. Intente nuevamente.");
    } finally {
      setIsUploading(false);
      // Resetear el input file para permitir subir la misma imagen de nuevo si es necesario
      e.target.value = '';
    }
  };

  const removeDocumentImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      documentImages: prev.documentImages.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany?.id) {
      alert("Error: No hay una empresa activa seleccionada en el sistema.");
      return;
    }

    try {
      if (customerToEdit) {
        await updateCustomer(customerToEdit.id, formData);
      } else {
        await addCustomer({ ...formData, companyId: activeCompany.id });
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving customer:", error);
      alert(`Ocurrió un error al guardar: ${error.message}`);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? "Editar Cliente" : "Nuevo Cliente"}
      width="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre" name="firstName" value={formData.firstName} onChange={handleChange} icon={<User size={18} />} required />
            <Input label="Apellidos" name="lastName" value={formData.lastName} onChange={handleChange} icon={<User size={18} />} required />
            <Input label="Correo Electrónico" type="email" name="email" value={formData.email} onChange={handleChange} icon={<Mail size={18} />} required />
            <Input label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} icon={<Phone size={18} />} required />
            <Input label="Fecha de Nacimiento" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} icon={<Calendar size={18} />} />
            <Input label="Nacionalidad" name="nationality" value={formData.nationality} onChange={handleChange} icon={<Globe size={18} />} />
          </div>
        </div>

        {/* Documentos */}
        <div className="pt-4 border-t border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Documentos y Dirección</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Cédula / Pasaporte" name="documentId" value={formData.documentId} onChange={handleChange} icon={<CreditCard size={18} />} required />
            <Input label="No. Licencia de Conducir" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} icon={<CreditCard size={18} />} required />
            <div className="md:col-span-2">
              <Input label="Dirección Física" name="address" value={formData.address} onChange={handleChange} icon={<MapPin size={18} />} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Fotos de Documentos (Cédula, Pasaporte, etc.)</label>
              
              {/* Galería de imágenes seleccionadas */}
              {formData.documentImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                  {formData.documentImages.map((imgBase64, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-border/50 bg-white/5 aspect-video">
                      <img src={imgBase64} alt={`Documento ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeDocumentImage(idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        title="Eliminar imagen"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input file */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border/50 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-2 text-primary/70" />
                    <p className="mb-2 text-sm text-foreground/80">
                      <span className="font-semibold">Haga clic para subir</span> o arrastre y suelte
                    </p>
                    <p className="text-xs text-foreground/60">Soporta múltiples imágenes (JPEG, PNG)</p>
                  </div>
                  <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                </label>
              </div>
              {isUploading && <p className="text-sm text-primary mt-2 animate-pulse">Comprimiendo y procesando imágenes...</p>}
            </div>
          </div>
        </div>

        {/* Empleo y Contacto de Emergencia */}
        <div className="pt-4 border-t border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Información Adicional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Empresa donde labora" name="company" value={formData.company} onChange={handleChange} icon={<Building2 size={18} />} />
            <Input label="Cargo" name="jobTitle" value={formData.jobTitle} onChange={handleChange} icon={<Briefcase size={18} />} />
            <Input label="Contacto de Emergencia" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} icon={<HeartPulse size={18} />} placeholder="Nombre completo" />
            <Input label="Teléfono de Emergencia" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} icon={<Phone size={18} />} />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-border/50 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading || isUploading} disabled={isUploading}>
            {customerToEdit ? "Guardar Cambios" : "Crear Cliente"}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
};
