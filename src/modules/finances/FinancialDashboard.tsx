import { useEffect, useMemo } from 'react';
import { useFinanceStore } from '../../app/store/useFinanceStore';
import { useTenantStore } from '../../app/store/useTenantStore';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ShieldAlert, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export const FinancialDashboard = () => {
  const { activeCompany } = useTenantStore();
  const { payments, expenses, fetchFinances, loading } = useFinanceStore();

  useEffect(() => {
    if (activeCompany?.id) {
      fetchFinances(activeCompany.id);
    }
  }, [activeCompany?.id, fetchFinances]);

  // Derived calculations based on BUSINESS_RULES.md
  // Income: Rent + Penalties
  // Liabilities: Deposits (Garantías - Pasivos)
  // Expenses: Operating Expenses
  const stats = useMemo(() => {
    const totalIncome = payments.filter(p => p.type === 'RENT' || p.type === 'PENALTY').reduce((sum, p) => sum + p.amount, 0);
    const totalDeposits = payments.filter(p => p.type === 'DEPOSIT').reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      income: totalIncome,
      deposits: totalDeposits, // Pasivos
      expenses: totalExpenses,
      netProfit: totalIncome - totalExpenses,
      margin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
    };
  }, [payments, expenses]);

  // Generate chart data grouping by month (simplified for demo purposes)
  const chartData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const data = months.map(month => ({ name: month, ingresos: 0, gastos: 0, pasivos: 0 }));
    
    // In a real app, parse the exact date. Here we just distribute randomly or based on current month if we don't have enough data
    const currentMonthIndex = new Date().getMonth();
    
    payments.forEach(p => {
      // Simplification: if no date parsing, dump everything in current month
      const monthIdx = p.createdAt ? new Date(p.createdAt.seconds * 1000).getMonth() : currentMonthIndex;
      if (p.type === 'DEPOSIT') {
        data[monthIdx].pasivos += p.amount;
      } else {
        data[monthIdx].ingresos += p.amount;
      }
    });

    expenses.forEach(e => {
      const monthIdx = new Date(e.date).getMonth();
      data[monthIdx].gastos += e.amount;
    });

    return data;
  }, [payments, expenses]);

  if (loading && payments.length === 0 && expenses.length === 0) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Calculando métricas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="text-primary" />
            Dashboard Financiero
          </h1>
          <p className="text-sm text-muted-foreground">Consolidado de ingresos, gastos y pasivos de la sucursal activa.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos Netos */}
        <div className="glass p-5 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={48} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <DollarSign size={20} />
            </div>
            <h3 className="font-medium text-foreground">Ingresos Operativos</h3>
          </div>
          <div className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">
            ${stats.income.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Rentas y penalidades (Facturado)</p>
        </div>

        {/* Pasivos (Depósitos) */}
        <div className="glass p-5 rounded-2xl shadow-sm relative overflow-hidden group border border-amber-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldAlert size={48} className="text-amber-500" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Wallet size={20} />
            </div>
            <h3 className="font-medium text-foreground">Garantías (Pasivos)</h3>
          </div>
          <div className="text-3xl font-bold text-amber-500 dark:text-amber-400">
            ${stats.deposits.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Depósitos retenidos a clientes</p>
        </div>

        {/* Gastos */}
        <div className="glass p-5 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={48} className="text-rose-500" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
              <TrendingDown size={20} />
            </div>
            <h3 className="font-medium text-foreground">Gastos Totales</h3>
          </div>
          <div className="text-3xl font-bold text-rose-500 dark:text-rose-400">
            ${stats.expenses.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Mantenimiento, nómina, etc.</p>
        </div>

        {/* Utilidad Neta */}
        <div className="glass p-5 rounded-2xl shadow-sm relative overflow-hidden group bg-gradient-to-br from-background to-primary/5 border border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 text-primary rounded-lg">
              <BarChart3 size={20} />
            </div>
            <h3 className="font-medium text-foreground">Utilidad Neta</h3>
          </div>
          <div className={`text-3xl font-bold ${stats.netProfit >= 0 ? 'text-foreground' : 'text-rose-500'}`}>
            ${stats.netProfit.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span className={stats.margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
              {stats.margin.toFixed(1)}% Margen
            </span>
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Area Chart: Ingresos vs Gastos */}
        <div className="glass p-6 rounded-2xl shadow-sm h-[400px] flex flex-col">
          <h3 className="font-bold text-lg mb-4 text-foreground">Flujo de Caja Anual</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.75rem' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Análisis de Pasivos */}
        <div className="glass p-6 rounded-2xl shadow-sm h-[400px] flex flex-col">
          <h3 className="font-bold text-lg mb-4 text-foreground">Retención de Garantías (Pasivos)</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--secondary))'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.75rem' }}
                />
                <Legend />
                <Bar dataKey="pasivos" name="Depósitos Activos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
