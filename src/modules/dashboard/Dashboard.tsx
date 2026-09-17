import { useEffect } from "react";
import { useFinanceStore } from "../../app/store/useFinanceStore";
import { useVehicleStore } from "../../app/store/useVehicleStore";
import { useContractStore } from "../../app/store/useContractStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { DollarSign, Car, FileText, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export const Dashboard = () => {
  const { activeCompany } = useTenantStore();
  const { payments, expenses, fetchFinances } = useFinanceStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { contracts, fetchContracts } = useContractStore();

  useEffect(() => {
    if (activeCompany?.id) {
      fetchFinances(activeCompany.id);
      fetchVehicles(activeCompany.id);
      fetchContracts(activeCompany.id);
    }
  }, [activeCompany?.id, fetchFinances, fetchVehicles, fetchContracts]);

  // Cálculos de Finanzas (Mes actual)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const totalIngresosMes = payments
    .filter(p => {
      const date = new Date(p.createdAt?.seconds * 1000);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const totalGastosMes = expenses
    .filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // Cálculos de Flota
  const autosDisponibles = vehicles.filter(v => v.status === "AVAILABLE").length;
  const autosRentados = vehicles.filter(v => v.status === "RENTED").length;
  const autosMantenimiento = vehicles.filter(v => v.status === "MAINTENANCE").length;

  const fleetData = [
    { name: "Disponibles", value: autosDisponibles, color: "#10B981" },
    { name: "Rentados", value: autosRentados, color: "#3B82F6" },
    { name: "Mantenimiento", value: autosMantenimiento, color: "#EF4444" },
  ];

  // Cálculos de Contratos
  const contratosActivos = contracts.filter(c => c.status === "ACTIVE").length;

  // Datos para Gráfico de Barras (Últimos 6 meses)
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      name: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
      Ingresos: 0,
      Gastos: 0,
    };
  }).reverse();

  payments.forEach(p => {
    if(!p.createdAt) return;
    const date = new Date(p.createdAt.seconds * 1000);
    const monthData = last6Months.find(m => m.monthIndex === date.getMonth() && m.year === date.getFullYear());
    if (monthData) monthData.Ingresos += p.amount;
  });

  expenses.forEach(e => {
    const date = new Date(e.date);
    const monthData = last6Months.find(m => m.monthIndex === date.getMonth() && m.year === date.getFullYear());
    if (monthData) monthData.Gastos += e.amount;
  });


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Resumen general de tu rentadora.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-6 rounded-2xl shadow-apple flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ingresos del Mes</p>
            <h3 className="text-2xl font-bold text-green-500 mt-1">${totalIngresosMes.toLocaleString()}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl shadow-apple flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gastos del Mes</p>
            <h3 className="text-2xl font-bold text-red-500 mt-1">${totalGastosMes.toLocaleString()}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Activity size={24} />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl shadow-apple flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Flota Disponible</p>
            <h3 className="text-2xl font-bold text-blue-500 mt-1">{autosDisponibles} <span className="text-sm text-muted-foreground">/ {vehicles.length}</span></h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Car size={24} />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl shadow-apple flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Contratos Activos</p>
            <h3 className="text-2xl font-bold text-purple-500 mt-1">{contratosActivos}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
            <FileText size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras */}
        <div className="glass p-6 rounded-2xl shadow-apple lg:col-span-2">
          <h3 className="text-lg font-bold text-foreground mb-4">Ingresos vs Gastos (Últimos 6 meses)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6Months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'gray' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'gray' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(150,150,150,0.1)' }}
                />
                <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Circular */}
        <div className="glass p-6 rounded-2xl shadow-apple">
          <h3 className="text-lg font-bold text-foreground mb-4">Estado de la Flota</h3>
          <div className="h-56 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fleetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fleetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {fleetData.map(item => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
