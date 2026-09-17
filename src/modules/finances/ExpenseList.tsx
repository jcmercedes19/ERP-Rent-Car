import { useState, useEffect } from "react";
import { useFinanceStore } from "../../app/store/useFinanceStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { GlassTable } from "../../shared/components/ui/GlassTable";
import { GlassModal } from "../../shared/components/ui/GlassModal";
import { Button } from "../../shared/components/ui/Button";
import { Input } from "../../shared/components/ui/Input";
import { DollarSign, Plus, Search, Tag, Calendar, AlignLeft } from "lucide-react";

export const ExpenseList = () => {
  const { activeCompany } = useTenantStore();
  const { expenses, fetchFinances, addExpense, loading } = useFinanceStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: 0,
    category: "MANTENIMIENTO",
    description: "",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (activeCompany?.id) {
      fetchFinances(activeCompany.id);
    }
  }, [activeCompany?.id, fetchFinances]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany?.id) return;
    try {
      await addExpense({ ...formData, companyId: activeCompany.id });
      setIsModalOpen(false);
      setFormData({ amount: 0, category: "MANTENIMIENTO", description: "", date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      alert("Error al registrar el gasto");
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: "Fecha",
      cell: (row: any) => <span className="text-muted-foreground">{new Date(row.date).toLocaleDateString()}</span>
    },
    {
      header: "Descripción",
      cell: (row: any) => <span className="font-medium text-foreground">{row.description}</span>
    },
    {
      header: "Categoría",
      cell: (row: any) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
          {row.category}
        </span>
      )
    },
    {
      header: "Monto",
      cell: (row: any) => <span className="font-bold text-red-500">-${row.amount}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gastos Operativos</h1>
          <p className="text-sm text-muted-foreground">Controla las salidas de dinero (Caja chica, mantenimiento, etc).</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
          <Plus size={18} className="mr-2" />
          Registrar Gasto
        </Button>
      </div>

      <div className="glass p-4 rounded-2xl shadow-apple flex items-center max-w-md">
        <Search className="text-muted-foreground mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por descripción o categoría..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-foreground w-full placeholder:text-muted-foreground"
        />
      </div>

      <GlassTable data={filteredExpenses} columns={columns} emptyMessage="No hay gastos registrados." />

      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Gasto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto del Gasto" type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} icon={<DollarSign size={18} />} />
            <Input label="Fecha" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} icon={<Calendar size={18} />} />
          </div>

          <div className="space-y-1 w-full">
            <label className="text-sm font-medium text-foreground ml-1">Categoría</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><Tag size={18} /></div>
              <input 
                list="expense-categories" 
                required 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
                className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11"
                placeholder="Escriba o seleccione una categoría..."
              />
              <datalist id="expense-categories">
                <option value="MANTENIMIENTO_VEHICULOS">Mantenimiento de Vehículos</option>
                <option value="LAVADO">Lavado de Autos</option>
                <option value="COMBUSTIBLE">Combustible</option>
                <option value="OFICINA">Gastos de Oficina</option>
                <option value="NOMINA">Nómina / Empleados</option>
                <option value="SERVICIOS">Servicios (Luz, Agua, Internet)</option>
              </datalist>
            </div>
          </div>

          <Input label="Descripción / Concepto" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} icon={<AlignLeft size={18} />} placeholder="Ej. Cambio de aceite Toyota Yaris..." />

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={loading} className="bg-red-500 hover:bg-red-600 text-white border-transparent">Guardar Gasto</Button>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
