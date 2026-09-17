import { useEffect, useState } from "react";
import { useContractTemplateStore, type ContractTemplate } from "../../../app/store/useContractTemplateStore";
import { useTenantStore } from "../../../app/store/useTenantStore";
import { GlassTable } from "../../../shared/components/ui/GlassTable";
import { Button } from "../../../shared/components/ui/Button";
import { Plus, Search, Edit2, Trash2, FileSignature } from "lucide-react";
import { ContractTemplateForm } from "./ContractTemplateForm";

export const ContractTemplateList = () => {
  const { activeCompany } = useTenantStore();
  const { templates, fetchTemplates, deleteTemplate, loading } = useContractTemplateStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<ContractTemplate | null>(null);

  useEffect(() => {
    if (activeCompany?.id) {
      fetchTemplates(activeCompany.id);
    }
  }, [activeCompany?.id, fetchTemplates]);

  const handleEdit = (template: ContractTemplate) => {
    setTemplateToEdit(template);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setTemplateToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta plantilla de contrato? Los contratos históricos no se verán afectados, pero no podrás usarla para nuevos contratos.")) {
      await deleteTemplate(id);
    }
  };

  const filteredTemplates = templates.filter((t: ContractTemplate) => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: "Plantilla",
      cell: (row: ContractTemplate) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <FileSignature size={20} />
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.title}</div>
            <div className="text-xs text-muted-foreground">Actualizada: {row.updatedAt?.toDate ? row.updatedAt.toDate().toLocaleDateString() : 'Reciente'}</div>
          </div>
        </div>
      )
    },
    {
      header: "Acciones",
      cell: (row: ContractTemplate) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors" title="Editar Plantilla">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors" title="Eliminar Plantilla">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plantillas de Contratos</h1>
          <p className="text-sm text-muted-foreground">Gestiona los modelos legales para tus contratos de renta.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={18} className="mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="glass p-4 rounded-2xl shadow-apple flex items-center max-w-md">
        <Search className="text-muted-foreground mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar plantilla por título..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-foreground w-full placeholder:text-muted-foreground"
        />
      </div>

      {loading && templates.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">Cargando plantillas...</div>
      ) : (
        <GlassTable data={filteredTemplates} columns={columns} emptyMessage="No hay plantillas registradas. Crea tu primera plantilla legal." />
      )}

      <ContractTemplateForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        templateToEdit={templateToEdit} 
      />
    </div>
  );
};
