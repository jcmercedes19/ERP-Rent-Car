import { useEffect, useState } from "react";
import { useContractStore, type RentalContract } from "../../app/store/useContractStore";
import { useCustomerStore } from "../../app/store/useCustomerStore";
import { useVehicleStore } from "../../app/store/useVehicleStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { GlassTable } from "../../shared/components/ui/GlassTable";
import { Button } from "../../shared/components/ui/Button";
import { Plus, Search, Edit2, FileText } from "lucide-react";
import { ContractForm } from "./components/ContractForm";

export const ContractList = () => {
  const { activeCompany } = useTenantStore();
  const { contracts, fetchContracts, loading } = useContractStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<RentalContract | null>(null);

  useEffect(() => {
    if (activeCompany?.id) {
      fetchContracts(activeCompany.id);
      fetchCustomers(activeCompany.id);
      fetchVehicles(activeCompany.id);
    }
  }, [activeCompany?.id, fetchContracts, fetchCustomers, fetchVehicles]);

  const handleEdit = (contract: RentalContract) => {
    setContractToEdit(contract);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setContractToEdit(null);
    setIsModalOpen(true);
  };

  const getCustomerName = (id: string) => {
    const c = customers.find(c => c.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "Desconocido";
  };

  const getVehicleName = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.brand} ${v.model} (${v.plate})` : "Desconocido";
  };

  // Filtrado compuesto (cliente o vehiculo)
  const filteredContracts = contracts.filter((c: RentalContract) => {
    const search = searchTerm.toLowerCase();
    const customerMatch = getCustomerName(c.customerId).toLowerCase().includes(search);
    const vehicleMatch = getVehicleName(c.vehicleId).toLowerCase().includes(search);
    return customerMatch || vehicleMatch;
  });

  const getStatusBadge = (status: RentalContract["status"]) => {
    switch(status) {
      case "DRAFT": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-500">Borrador</span>;
      case "ACTIVE": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">Activo</span>;
      case "COMPLETED": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">Completado</span>;
      case "CANCELLED": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">Cancelado</span>;
      default: return null;
    }
  };

  const columns = [
    {
      header: "Contrato",
      cell: (row: RentalContract) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <FileText size={20} />
          </div>
          <div>
            <div className="font-semibold text-foreground">
              {row.id.substring(0, 8).toUpperCase()}
            </div>
            <div className="text-xs text-muted-foreground">{row.startDate} al {row.expectedReturnDate}</div>
          </div>
        </div>
      )
    },
    {
      header: "Cliente",
      cell: (row: RentalContract) => <span className="font-medium">{getCustomerName(row.customerId)}</span>
    },
    {
      header: "Vehículo",
      cell: (row: RentalContract) => <span className="text-muted-foreground">{getVehicleName(row.vehicleId)}</span>
    },
    {
      header: "Monto Total",
      cell: (row: RentalContract) => <span className="font-bold text-foreground">${row.totalAmount}</span>
    },
    {
      header: "Estado",
      cell: (row: RentalContract) => getStatusBadge(row.status)
    },
    {
      header: "Acciones",
      cell: (row: RentalContract) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors" title="Ver / Editar">
            <Edit2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos de Renta</h1>
          <p className="text-sm text-muted-foreground">Gestiona las reservas, rentas activas e históricos.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={18} className="mr-2" />
          Nuevo Contrato
        </Button>
      </div>

      <div className="glass p-4 rounded-2xl shadow-apple flex items-center max-w-md">
        <Search className="text-muted-foreground mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por cliente o vehículo..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-foreground w-full placeholder:text-muted-foreground"
        />
      </div>

      {loading && contracts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">Cargando contratos...</div>
      ) : (
        <GlassTable data={filteredContracts} columns={columns} emptyMessage="No hay contratos registrados." />
      )}

      <ContractForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        contractToEdit={contractToEdit} 
      />
    </div>
  );
};
