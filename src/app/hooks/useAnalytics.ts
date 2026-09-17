import { useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useVehicleStore } from '../store/useVehicleStore';
import { useMaintenanceStore } from '../store/useMaintenanceStore';

export const useAnalytics = () => {
  const { payments, expenses } = useFinanceStore();
  const { vehicles } = useVehicleStore();
  const { records: maintenanceRecords } = useMaintenanceStore();

  const metrics = useMemo(() => {
    // 1. Calculate Income and Expenses
    let totalIncome = 0;
    let totalExpenses = 0;

    payments.forEach(p => {
      // Assuming all payments are income except penalties which might also be income?
      // In this system, payments represent money coming in.
      totalIncome += p.amount;
    });

    expenses.forEach(e => {
      totalExpenses += e.amount;
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

    payments.forEach(p => {
      // payment has createdAt timestamp from firebase, try to get date
      const d = p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000) : new Date();
      const m = last6Months.find(month => month.monthNum === d.getMonth() && month.year === d.getFullYear());
      if (m) {
        m.income += p.amount;
      }
    });

    expenses.forEach(e => {
      const d = new Date(e.date);
      const m = last6Months.find(month => month.monthNum === d.getMonth() && month.year === d.getFullYear());
      if (m) {
        m.expense += e.amount;
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
  }, [payments, expenses, vehicles, maintenanceRecords]);

  return metrics;
};
