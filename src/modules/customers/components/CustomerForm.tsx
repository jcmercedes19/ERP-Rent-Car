import { useState, useEffect } from "react";
import { GlassModal } from "../../../shared/components/ui/GlassModal";
import { Input } from "../../../shared/components/ui/Input";
import { Button } from "../../../shared/components/ui/Button";
import { useCustomerStore, type Customer } from "../../../app/store/useCustomerStore";
import { useTenantStore } from "../../../app/store/useTenantStore";
import { User, Mail, Phone, CreditCard, MapPin, Calendar, Globe, Briefcase, Building2, Link as LinkIcon, HeartPulse } from "lucide-react";

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
    status: "active" as "active" | "inactive",
  });

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
        status: customerToEdit.status || "active",
      });
    } else {
      setFormData({
        firstName: "", lastName: "", email: "", phone: "", documentId: "", licenseNumber: "",
        address: "", dateOfBirth: "", nationality: "", company: "", jobTitle: "",
        emergencyContactName: "", emergencyContactPhone: "", photoUrl: "", status: "active",
      });
    }
  }, [customerToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany?.id) return;

    try {
      if (customerToEdit) {
        await updateCustomer(customerToEdit.id, formData);
      } else {
        await addCustomer({ ...formData, companyId: activeCompany.id });
      }
      onClose();
    } catch (error) {
      console.error("Error saving customer:", error);
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
              <Input label="URL Foto Documento (Opcional)" name="photoUrl" value={formData.photoUrl} onChange={handleChange} icon={<LinkIcon size={18} />} placeholder="https://..." />
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
          <Button type="submit" loading={loading}>
            {customerToEdit ? "Guardar Cambios" : "Crear Cliente"}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
};
