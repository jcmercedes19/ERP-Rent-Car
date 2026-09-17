import { useEffect } from 'react';
import { useAnalytics } from "../../app/hooks/useAnalytics";
import { useTenantStore } from '../../app/store/useTenantStore';
import { useFinanceStore } from '../../app/store/useFinanceStore';
import { useVehicleStore } from '../../app/store/useVehicleStore';
import { useMaintenanceStore } from '../../app/store/useMaintenanceStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Car, AlertTriangle, Download, CheckCircle } from "lucide-react";

const COLORS = ['#10b981', '#3b82f6', '#f43f5e'];

export const Dashboard = () => {
  const { activeCompany, activeBranchId } = useTenantStore();
  const { fetchFinances, unsubscribeFinances } = useFinanceStore();
  const { fetchVehicles, unsubscribeSnapshot } = useVehicleStore();
  const { fetchRecords, unsubscribeRecords } = useMaintenanceStore();

  useEffect(() => {
    if (activeCompany?.id) {
      fetchFinances(activeCompany.id);
      fetchVehicles(activeCompany.id, activeBranchId);
      fetchRecords(activeCompany.id);
    }
    return () => {
      unsubscribeFinances();
      unsubscribeSnapshot?.();
      unsubscribeRecords();
    };
  }, [activeCompany?.id, fetchFinances, fetchVehicles, fetchRecords]);

  const { 
    totalIncome, totalExpenses, netProfit, 
    totalVehicles, rentedVehicles, availableVehicles, maintenanceVehicles, occupancyRate,
    chartData, alerts 
  } = useAnalytics();

  const pieData = [
    { name: 'Disponibles', value: availableVehicles },
    { name: 'Rentados', value: rentedVehicles },
    { name: 'Taller', value: maintenanceVehicles },
  ];

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Mes,Año,Ingresos,Gastos\n"
      + chartData.map(e => `${e.month},${e.year},${e.income},${e.expense}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_financiero_6_meses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard General</h1>
          <p className="text-sm text-muted-foreground">Visión general del estado operativo y financiero.</p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors font-medium text-sm"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-5 rounded-2xl shadow-apple">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Ingresos Globales</p>
          <h3 className="text-2xl font-bold text-foreground">${totalIncome.toLocaleString()}</h3>
        </div>

        <div className="glass p-5 rounded-2xl shadow-apple">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
              <TrendingDown size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Gastos Globales</p>
          <h3 className="text-2xl font-bold text-foreground">${totalExpenses.toLocaleString()}</h3>
        </div>

        <div className="glass p-5 rounded-2xl shadow-apple">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Beneficio Neto</p>
          <h3 className="text-2xl font-bold text-foreground">${netProfit.toLocaleString()}</h3>
        </div>

        <div className="glass p-5 rounded-2xl shadow-apple">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Car size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Tasa de Ocupación</p>
          <h3 className="text-2xl font-bold text-foreground">{occupancyRate.toFixed(1)}%</h3>
          <p className="text-xs text-muted-foreground mt-1">{rentedVehicles} de {totalVehicles} rentados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="glass p-5 rounded-2xl shadow-apple lg:col-span-2 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-semibold text-foreground mb-6">Ingresos vs Gastos (Últimos 6 meses)</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panel (Pie Chart + Alerts) */}
        <div className="space-y-6">
          <div className="glass p-5 rounded-2xl shadow-apple flex flex-col h-[280px]">
            <h3 className="text-lg font-semibold text-foreground mb-2">Estado de Flota</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl shadow-apple flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-4">Alertas de Sistema</h3>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No hay alertas activas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <div key={i} className={`p-3 rounded-xl flex items-start gap-3 ${
                    alert.type === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    <AlertTriangle size={18} className="mt-0.5" />
                    <p className="text-sm font-medium">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
