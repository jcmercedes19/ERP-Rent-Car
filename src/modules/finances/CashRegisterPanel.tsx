import React, { useState, useEffect } from 'react';
import { useCashStore } from '../../app/store/useCashStore';
import { Lock, Unlock, History, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../core/utils/formatters';

export function CashRegisterPanel() {
  const { currentRegister, fetchCurrentRegister, openRegister, closeRegister, transactions } = useCashStore();
  const [initialBalance, setInitialBalance] = useState('');
  const [closeBalance, setCloseBalance] = useState('');

  useEffect(() => {
    fetchCurrentRegister();
  }, [fetchCurrentRegister]);

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialBalance) return;
    await openRegister(Number(initialBalance));
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeBalance) return;
    await closeRegister(Number(closeBalance));
  };

  if (!currentRegister) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Control de Caja</h1>
            <p className="text-muted-foreground">La caja se encuentra cerrada.</p>
          </div>
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>

        <form onSubmit={handleOpen} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Fondo de Caja (Monto de Apertura)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">RD$</span>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Unlock className="w-5 h-5" />
            Abrir Caja
          </button>
        </form>
      </div>
    );
  }

  const expected = currentRegister.initialBalance + currentRegister.totalIncome - currentRegister.totalExpense + currentRegister.totalDeposits - currentRegister.totalDepositsReturned;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Caja Abierta</h1>
          <p className="text-emerald-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Operando actualmente
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Balance Esperado</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(expected)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Apertura</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(currentRegister.initialBalance)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Ingresos (Ventas)</p>
          <p className="text-xl font-bold text-emerald-500">+{formatCurrency(currentRegister.totalIncome)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Egresos (Gastos)</p>
          <p className="text-xl font-bold text-red-500">-{formatCurrency(currentRegister.totalExpense)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Balance Depósitos</p>
          <p className="text-xl font-bold text-blue-500">{formatCurrency(currentRegister.totalDeposits - currentRegister.totalDepositsReturned)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Últimas Transacciones</h2>
          </div>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay transacciones en este turno.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-background border border-border">
                  <div>
                    <p className="font-medium text-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{t.method} • {t.type}</p>
                  </div>
                  <span className={`font-bold ${
                    t.type === 'INCOME' || t.type === 'DEPOSIT_IN' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {t.type === 'INCOME' || t.type === 'DEPOSIT_IN' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <form onSubmit={handleClose} className="bg-secondary/30 border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-yellow-500 w-5 h-5" />
              <h2 className="text-lg font-semibold text-foreground">Cerrar Turno (Arqueo)</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ingresa el dinero físico exacto que hay en la gaveta.
            </p>
            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">RD$</span>
                <input
                  type="number"
                  value={closeBalance}
                  onChange={(e) => setCloseBalance(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            {closeBalance && Number(closeBalance) !== expected && (
              <div className={`p-3 rounded-lg text-sm ${Number(closeBalance) > expected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {Number(closeBalance) > expected ? 'Sobrante:' : 'Faltante:'} {formatCurrency(Math.abs(Number(closeBalance) - expected))}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="w-5 h-5" />
              Realizar Cierre
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
