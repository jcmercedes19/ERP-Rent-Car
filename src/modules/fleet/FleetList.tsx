import { useEffect, useState } from "react";
import { useVehicleStore, type Vehicle } from "../../app/store/useVehicleStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { GlassTable } from "../../shared/components/ui/GlassTable";
import { Button } from "../../shared/components/ui/Button";
import { Plus, Search, Edit2, Trash2, CarFront } from "lucide-react";
import { VehicleForm } from "./components/VehicleForm";

export const FleetList = () => {
  const { activeCompany } = useTenantStore();
  const { vehicles, fetchVehicles, deleteVehicle, loading } = useVehicleStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (activeCompany?.id) {
      fetchVehicles(activeCompany.id);
    }
  }, [activeCompany?.id, fetchVehicles]);

  const handleEdit = (vehicle: Vehicle) => {
    setVehicleToEdit(vehicle);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setVehicleToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este vehículo de la flota?")) {
      await deleteVehicle(id);
    }
  };

  const filteredVehicles = vehicles.filter((v: Vehicle) => 
    `${v.brand} ${v.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Vehicle["status"]) => {
    switch(status) {
      case "AVAILABLE": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">Disponible</span>;
      case "RENTED": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">Rentado</span>;
      case "MAINTENANCE": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">En Mantenimiento</span>;
      default: return null;
    }
  };

  const columns = [
    {
      header: "Vehículo",
      cell: (row: Vehicle) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={row.model} className="w-12 h-12 rounded-lg object-cover bg-secondary/50" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground">
              <CarFront size={24} />
            </div>
          )}
          <div>
            <div className="font-semibold text-foreground">{row.brand} {row.model}</div>
            <div className="text-xs text-muted-foreground">{row.year} • {row.color}</div>
          </div>
        </div>
      )
    },
    {
      header: "Placa",
      accessorKey: "plate" as keyof Vehicle
    },
    {
      header: "Categoría",
      accessorKey: "category" as keyof Vehicle
    },
    {
      header: "Tarifa",
      cell: (row: Vehicle) => <span className="font-medium text-foreground">${row.dailyRate}/día</span>
    },
    {
      header: "Estado",
      cell: (row: Vehicle) => getStatusBadge(row.status)
    },
    {
      header: "Acciones",
      cell: (row: Vehicle) => (
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
          <h1 className="text-2xl font-bold text-foreground">Gestión de Flota</h1>
          <p className="text-sm text-muted-foreground">Administra los vehículos y su disponibilidad.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={18} className="mr-2" />
          Nuevo Vehículo
        </Button>
      </div>

      <div className="glass p-4 rounded-2xl shadow-apple flex items-center max-w-md">
        <Search className="text-muted-foreground mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por marca, modelo o placa..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-foreground w-full placeholder:text-muted-foreground"
        />
      </div>

      {loading && vehicles.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">Cargando flota...</div>
      ) : (
        <GlassTable data={filteredVehicles} columns={columns} emptyMessage="No hay vehículos registrados en la flota." />
      )}

      <VehicleForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        vehicleToEdit={vehicleToEdit} 
      />
    </div>
  );
};
