import { useEffect, useState } from "react";
import { useCustomerStore, type Customer } from "../../app/store/useCustomerStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { GlassTable } from "../../shared/components/ui/GlassTable";
import { Button } from "../../shared/components/ui/Button";
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, Phone, CreditCard, Mail } from "lucide-react";
import { CustomerForm } from "./components/CustomerForm";

// Funciones auxiliares para el avatar
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500 text-blue-50',
    'bg-indigo-500 text-indigo-50',
    'bg-violet-500 text-violet-50',
    'bg-fuchsia-500 text-fuchsia-50',
    'bg-rose-500 text-rose-50',
    'bg-orange-500 text-orange-50',
    'bg-emerald-500 text-emerald-50',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

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
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${getAvatarColor(row.firstName)}`}>
            {getInitials(row.firstName, row.lastName)}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.firstName} {row.lastName}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Mail size={10} />
              {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Documento",
      cell: (row: Customer) => (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <div className="p-1.5 bg-secondary/80 rounded-md text-muted-foreground">
            <CreditCard size={14} />
          </div>
          {row.documentId}
        </div>
      )
    },
    {
      header: "Teléfono",
      cell: (row: Customer) => (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <div className="p-1.5 bg-secondary/80 rounded-md text-muted-foreground">
            <Phone size={14} />
          </div>
          {row.phone}
        </div>
      )
    },
    {
      header: "Estado",
      cell: (row: Customer) => {
        const isActive = row.status === 'active';
        return (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm shadow-sm transition-all
            ${isActive 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}
          >
            {isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {isActive ? 'Activo' : 'Inactivo'}
          </div>
        );
      }
    },
    {
      header: "Acciones",
      cell: (row: Customer) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="p-2 text-blue-500 hover:bg-blue-500/10 hover:scale-110 rounded-full transition-all" title="Editar Cliente">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-2 text-red-500 hover:bg-red-500/10 hover:scale-110 rounded-full transition-all" title="Eliminar Cliente">
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
