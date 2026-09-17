import { useEffect, useState } from "react";
import { useCustomerStore, type Customer } from "../../app/store/useCustomerStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { GlassTable } from "../../shared/components/ui/GlassTable";
import { Button } from "../../shared/components/ui/Button";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { CustomerForm } from "./components/CustomerForm";

export const CustomerList = () => {
  const { activeCompany } = useTenantStore();
  const { customers, fetchCustomers, deleteCustomer, loading } = useCustomerStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  useEffect(() => {
    if (activeCompany?.id) {
      fetchCustomers(activeCompany.id);
    }
  }, [activeCompany?.id, fetchCustomers]);

  const handleEdit = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setCustomerToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este cliente?")) {
      await deleteCustomer(id);
    }
  };

  const filteredCustomers = customers.filter((c: Customer) => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.documentId.includes(searchTerm)
  );

  const columns = [
    {
      header: "Cliente",
      cell: (row: Customer) => (
        <div>
          <div className="font-semibold text-foreground">{row.firstName} {row.lastName}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </div>
      )
    },
    {
      header: "Documento",
      accessorKey: "documentId" as keyof Customer
    },
    {
      header: "Teléfono",
      accessorKey: "phone" as keyof Customer
    },
    {
      header: "Estado",
      cell: (row: Customer) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {row.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: "Acciones",
      cell: (row: Customer) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
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
          <h1 className="text-2xl font-bold text-foreground">Directorio de Clientes</h1>
          <p className="text-sm text-muted-foreground">Administra los perfiles y documentos de tus clientes.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={18} className="mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="glass p-4 rounded-2xl shadow-apple flex items-center max-w-md">
        <Search className="text-muted-foreground mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o documento..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-foreground w-full placeholder:text-muted-foreground"
        />
      </div>

      {loading && customers.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">Cargando clientes...</div>
      ) : (
        <GlassTable data={filteredCustomers} columns={columns} />
      )}

      <CustomerForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        customerToEdit={customerToEdit} 
      />
    </div>
  );
};
