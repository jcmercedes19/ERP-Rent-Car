import { useState, useEffect } from "react";
import { GlassModal } from "../../../../shared/components/ui/GlassModal";
import { Input } from "../../../../shared/components/ui/Input";
import { Button } from "../../../../shared/components/ui/Button";
import { useContractTemplateStore, type ContractTemplate } from "../../../../app/store/useContractTemplateStore";
import { useTenantStore } from "../../../../app/store/useTenantStore";
import { FileSignature, Terminal } from "lucide-react";

interface ContractTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: ContractTemplate | null;
}

const placeholders = [
  { tag: "{{CLIENT_NAME}}", desc: "Nombre del Cliente" },
  { tag: "{{CLIENT_DOC}}", desc: "Cédula/Pasaporte" },
  { tag: "{{CLIENT_ADDRESS}}", desc: "Dirección del Cliente" },
  { tag: "{{VEHICLE_BRAND}}", desc: "Marca del Vehículo" },
  { tag: "{{VEHICLE_MODEL}}", desc: "Modelo del Vehículo" },
  { tag: "{{VEHICLE_PLATE}}", desc: "Placa / Matrícula" },
  { tag: "{{START_DATE}}", desc: "Fecha de Inicio" },
  { tag: "{{RETURN_DATE}}", desc: "Fecha de Devolución" },
  { tag: "{{TOTAL_AMOUNT}}", desc: "Monto Total" },
  { tag: "{{DEPOSIT_AMOUNT}}", desc: "Depósito de Garantía" },
];

export const ContractTemplateForm = ({ isOpen, onClose, templateToEdit }: ContractTemplateFormProps) => {
  const { addTemplate, updateTemplate, loading } = useContractTemplateStore();
  const { activeCompany } = useTenantStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (templateToEdit) {
      setTitle(templateToEdit.title);
      setContent(templateToEdit.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [templateToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany?.id) {
      alert("Error: No hay una empresa activa seleccionada en el sistema.");
      return;
    }

    try {
      if (templateToEdit) {
        await updateTemplate(templateToEdit.id, { title, content });
      } else {
        await addTemplate({ title, content, companyId: activeCompany.id });
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving template:", error);
      alert(`Ocurrió un error al guardar: ${error.message}`);
    }
  };

  const copyToClipboard = (tag: string) => {
    navigator.clipboard.writeText(tag);
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={templateToEdit ? "Editar Plantilla Legal" : "Nueva Plantilla Legal"}
      width="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input 
            label="Título de la Plantilla" 
            name="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            icon={<FileSignature size={18} />} 
            required 
            placeholder="Ej. Contrato Corporativo Estándar"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 space-y-2">
            <label className="text-sm font-medium text-foreground ml-1 flex items-center gap-2">
              <Terminal size={16} /> Cuerpo del Contrato
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[500px] rounded-xl border border-border bg-background/50 p-4 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all resize-none shadow-inner"
              placeholder="Escriba o pegue aquí las cláusulas del contrato..."
            />
            <p className="text-xs text-muted-foreground">Utiliza texto plano. Los espacios y saltos de línea se respetarán en el contrato final.</p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Variables Dinámicas</h4>
              <p className="text-xs text-muted-foreground mb-4">Haz clic en una variable para copiarla y pégala en tu contrato. El sistema la reemplazará automáticamente con los datos reales.</p>
            </div>
            
            <div className="space-y-2 h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              {placeholders.map((p) => (
                <div 
                  key={p.tag} 
                  onClick={() => copyToClipboard(p.tag)}
                  className="p-2 rounded-lg bg-secondary/50 border border-border hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer group"
                >
                  <code className="text-xs font-bold text-primary group-hover:text-primary block mb-1">{p.tag}</code>
                  <span className="text-[10px] text-muted-foreground leading-tight block">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {templateToEdit ? "Guardar Cambios" : "Guardar Plantilla"}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
};
