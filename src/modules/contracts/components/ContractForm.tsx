import { useState, useEffect } from "react";
import { GlassModal } from "../../../shared/components/ui/GlassModal";
import { Input } from "../../../shared/components/ui/Input";
import { Button } from "../../../shared/components/ui/Button";
import { useContractStore, type RentalContract } from "../../../app/store/useContractStore";
import { useCustomerStore } from "../../../app/store/useCustomerStore";
import { useVehicleStore } from "../../../app/store/useVehicleStore";
import { useContractTemplateStore } from "../../../app/store/useContractTemplateStore";
import { useTenantStore } from "../../../app/store/useTenantStore";
import { Calendar, DollarSign, FileText, User, Car, ShieldCheck } from "lucide-react";

interface ContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  contractToEdit?: RentalContract | null;
}

export const ContractForm = ({ isOpen, onClose, contractToEdit }: ContractFormProps) => {
  const { addContract, updateContract, loading } = useContractStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { templates, fetchTemplates } = useContractTemplateStore();
  const { activeCompany, activeBranchId } = useTenantStore();

  const [formData, setFormData] = useState({
    customerId: "",
    vehicleId: "",
    templateId: "",
    status: "DRAFT" as RentalContract["status"],
    startDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dailyRate: 0,
    totalDays: 1,
    subtotal: 0,
    depositAmount: 0,
    totalAmount: 0,
    notes: "",
  });

  // Fetch customers and vehicles if they haven't been loaded yet
  useEffect(() => {
    if (activeCompany?.id && isOpen) {
      if (customers.length === 0) fetchCustomers(activeCompany.id);
      if (vehicles.length === 0) fetchVehicles(activeCompany.id);
      if (templates.length === 0) fetchTemplates(activeCompany.id);
    }
  }, [activeCompany?.id, isOpen]); // removed dependencies that could cause infinite loop

  useEffect(() => {
    if (contractToEdit) {
      setFormData({
        customerId: contractToEdit.customerId || "",
        vehicleId: contractToEdit.vehicleId || "",
        templateId: contractToEdit.templateId || "",
        status: contractToEdit.status || "DRAFT",
        startDate: contractToEdit.startDate || "",
        expectedReturnDate: contractToEdit.expectedReturnDate || "",
        dailyRate: contractToEdit.dailyRate || 0,
        totalDays: contractToEdit.totalDays || 1,
        subtotal: contractToEdit.subtotal || 0,
        depositAmount: contractToEdit.depositAmount || 0,
        totalAmount: contractToEdit.totalAmount || 0,
        notes: contractToEdit.notes || "",
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: "", vehicleId: "", templateId: "", status: "DRAFT",
        startDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        dailyRate: 0, totalDays: 1, subtotal: 0, depositAmount: 0, totalAmount: 0, notes: "",
      }));
    }
  }, [contractToEdit, isOpen]);

  // Calculation Logic
  useEffect(() => {
    const sDate = new Date(formData.startDate);
    const eDate = new Date(formData.expectedReturnDate);
    const timeDiff = eDate.getTime() - sDate.getTime();
    let days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (days < 1) days = 1; // Minimum 1 day

    let rate = formData.dailyRate;
    
    // Si se seleccionó un vehículo, actualizamos la tarifa diaria si es un contrato nuevo
    if (formData.vehicleId && !contractToEdit) {
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
      if (selectedVehicle) {
        rate = selectedVehicle.dailyRate;
      }
    }

    const sub = days * rate;
    const total = sub + Number(formData.depositAmount || 0);

    setFormData(prev => ({
      ...prev,
      totalDays: days,
      dailyRate: rate,
      subtotal: sub,
      totalAmount: total
    }));
  }, [formData.startDate, formData.expectedReturnDate, formData.vehicleId, formData.depositAmount, vehicles, contractToEdit]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    if (!formData.customerId || !formData.vehicleId) {
      alert("Debe seleccionar un cliente y un vehículo.");
      return;
    }

    try {
      let snapshotContent = contractToEdit?.snapshotContent || "";
      
      if (!contractToEdit && formData.templateId) {
        const selectedTemplate = templates.find(t => t.id === formData.templateId);
        if (selectedTemplate) {
          const customer = customers.find(c => c.id === formData.customerId);
          const vehicle = vehicles.find(v => v.id === formData.vehicleId);
          
          let content = selectedTemplate.content;
          if (customer) {
            content = content.replace(/{{CLIENT_NAME}}/g, `${customer.firstName} ${customer.lastName}`);
            content = content.replace(/{{CLIENT_DOC}}/g, customer.documentId);
            content = content.replace(/{{CLIENT_ADDRESS}}/g, customer.address);
          }
          if (vehicle) {
            content = content.replace(/{{VEHICLE_BRAND}}/g, vehicle.brand);
            content = content.replace(/{{VEHICLE_MODEL}}/g, vehicle.model);
            content = content.replace(/{{VEHICLE_PLATE}}/g, vehicle.plate);
          }
          content = content.replace(/{{START_DATE}}/g, formData.startDate);
          content = content.replace(/{{RETURN_DATE}}/g, formData.expectedReturnDate);
          content = content.replace(/{{TOTAL_AMOUNT}}/g, formData.totalAmount.toString());
          content = content.replace(/{{DEPOSIT_AMOUNT}}/g, formData.depositAmount.toString());
          
          snapshotContent = content;
        }
      }

      if (contractToEdit) {
        await updateContract(contractToEdit.id, formData);
      } else {
        if (!activeBranchId) {
          alert("Error: Seleccione una sucursal activa primero.");
          return;
        }
        await addContract({ ...formData, snapshotContent, companyId: activeCompany.id, branchId: activeBranchId });
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving contract:", error);
      alert(`Ocurrió un error al guardar: ${error.message}`);
    }
  };

  // Filtrar vehículos disponibles (o el que ya estaba en el contrato)
  const availableVehicles = vehicles.filter(v => 
    v.status === 'AVAILABLE' || v.id === formData.vehicleId
  );

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={contractToEdit ? "Editar Contrato" : "Nuevo Contrato de Renta"}
      width="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entidades Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 w-full">
            <label className="text-sm font-medium text-foreground ml-1">Cliente</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><User size={18} /></div>
              <select name="customerId" value={formData.customerId} onChange={handleChange} required disabled={!!contractToEdit} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11 disabled:opacity-50">
                <option value="">Seleccione un cliente</option>
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
              <select name="vehicleId" value={formData.vehicleId} onChange={handleChange} required disabled={!!contractToEdit} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11 disabled:opacity-50">
                <option value="">Seleccione un vehículo</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} - {v.plate} (${v.dailyRate}/día)</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="pt-4 border-t border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Configuración Legal y Fechas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1 w-full md:col-span-2">
              <label className="text-sm font-medium text-foreground ml-1">Plantilla de Contrato Legal</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><FileText size={18} /></div>
                <select name="templateId" value={formData.templateId} onChange={handleChange} disabled={!!contractToEdit} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11 disabled:opacity-50">
                  <option value="">-- Contrato Básico (Sin Plantilla) --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Fecha Salida" type="date" name="startDate" value={formData.startDate} onChange={handleChange} icon={<Calendar size={18} />} required />
            <Input label="Fecha Retorno Estimada" type="date" name="expectedReturnDate" value={formData.expectedReturnDate} onChange={handleChange} icon={<Calendar size={18} />} required />
            <div className="space-y-1 w-full">
              <label className="text-sm font-medium text-foreground ml-1">Estado</label>
              <select name="status" value={formData.status} onChange={handleChange} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all">
                <option value="DRAFT">Borrador (Cotización)</option>
                <option value="ACTIVE">Activo (Vehículo entregado)</option>
                <option value="COMPLETED">Completado (Devuelto)</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resumen Financiero */}
        <div className="pt-4 border-t border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Resumen Financiero</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="glass p-3 rounded-xl text-center">
              <div className="text-xs text-muted-foreground mb-1">Días</div>
              <div className="text-lg font-bold text-foreground">{formData.totalDays}</div>
            </div>
            <div className="glass p-3 rounded-xl text-center">
              <div className="text-xs text-muted-foreground mb-1">Tarifa Diaria</div>
              <div className="text-lg font-bold text-foreground">${formData.dailyRate}</div>
            </div>
            <div className="glass p-3 rounded-xl text-center">
              <div className="text-xs text-muted-foreground mb-1">Subtotal</div>
              <div className="text-lg font-bold text-foreground">${formData.subtotal}</div>
            </div>
            <div className="glass bg-primary/10 border-primary/20 p-3 rounded-xl text-center">
              <div className="text-xs text-primary mb-1">Total a Pagar</div>
              <div className="text-lg font-bold text-primary">${formData.totalAmount}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Depósito de Garantía ($)" type="number" name="depositAmount" value={formData.depositAmount} onChange={handleChange} icon={<ShieldCheck size={18} />} />
            <Input label="Ajuste Manual de Tarifa ($)" type="number" name="dailyRate" value={formData.dailyRate} onChange={handleChange} icon={<DollarSign size={18} />} />
          </div>
        </div>

        <div className="pt-4 border-t border-border/50">
          <div className="space-y-1 w-full">
            <label className="text-sm font-medium text-foreground ml-1">Notas / Observaciones</label>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none text-muted-foreground"><FileText size={18} /></div>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="flex w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11" placeholder="Ej. El cliente solicita entrega en el aeropuerto..." />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {contractToEdit ? "Guardar Cambios" : "Generar Contrato"}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
};
