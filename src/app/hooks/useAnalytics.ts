import { useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useVehicleStore } from '../store/useVehicleStore';
import { useMaintenanceStore } from '../store/useMaintenanceStore';

export const useAnalytics = () => {
  const { transactions } = useFinanceStore();
  const { vehicles } = useVehicleStore();
  const { records: maintenanceRecords } = useMaintenanceStore();

  const metrics = useMemo(() => {
    // 1. Calculate Income and Expenses
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      if (t.type === 'INCOME') totalIncome += t.amount;
      if (t.type === 'EXPENSE') totalExpenses += t.amount;
    });

    const netProfit = totalIncome - totalExpenses;

    // 2. Calculate Fleet Occupancy
    const totalVehicles = vehicles.length;
    let rentedVehicles = 0;
    let maintenanceVehicles = 0;
    let availableVehicles = 0;

    vehicles.forEach(v => {
      if (v.status === 'RENTED') rentedVehicles++;
      else if (v.status === 'MAINTENANCE') maintenanceVehicles++;
      else availableVehicles++;
    });

    const occupancyRate = totalVehicles > 0 ? (rentedVehicles / totalVehicles) * 100 : 0;

    // 3. Generate Monthly Chart Data
    // We group transactions by month for a 6-month view
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleString('es-ES', { month: 'short' }),
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        income: 0,
        expense: 0
      };
    }).reverse();

    transactions.forEach(t => {
      const d = new Date(t.date);
      const m = last6Months.find(month => month.monthNum === d.getMonth() && month.year === d.getFullYear());
      if (m) {
        if (t.type === 'INCOME') m.income += t.amount;
        if (t.type === 'EXPENSE') m.expense += t.amount;
      }
    });

    // 4. Alerts (Pending maintenance, etc)
    const alerts = vehicles.map(vehicle => {
      const vRecords = maintenanceRecords.filter(r => r.vehicleId === vehicle.id && r.type === 'PREVENTIVE');
      const latestService = vRecords.length > 0 
        ? vRecords.reduce((latest, current) => 
            new Date(current.date).getTime() > new Date(latest.date).getTime() ? current : latest
          )
        : null;
        
      if (latestService?.nextServiceMileage) {
        const remaining = latestService.nextServiceMileage - vehicle.currentMileage;
        if (remaining <= 0) {
          return { type: 'CRITICAL', message: `Mantenimiento vencido: ${vehicle.brand} ${vehicle.plate}` };
        } else if (remaining <= 1000) {
          return { type: 'WARNING', message: `Mantenimiento próximo: ${vehicle.brand} ${vehicle.plate}` };
        }
      }
      return null;
    }).filter(a => a !== null) as { type: 'CRITICAL' | 'WARNING', message: string }[];

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      totalVehicles,
      rentedVehicles,
      maintenanceVehicles,
      availableVehicles,
      occupancyRate,
      chartData: last6Months,
      alerts
    };
  }, [transactions, vehicles, maintenanceRecords]);

  return metrics;
};
