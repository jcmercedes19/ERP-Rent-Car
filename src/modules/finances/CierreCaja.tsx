import React, { useState, useEffect } from 'react';
import { useCashSessionStore } from '../../app/store/useCashSessionStore';
import { useCashStore } from '../../app/store/useCashStore';
import { useTenantStore } from '../../app/store/useTenantStore';
import { useAuthStore } from '../../app/store/useAuthStore';
import { Lock, Unlock, History, AlertTriangle, Download } from 'lucide-react';
import { formatCurrency } from '../../core/utils/formatters';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export function CierreCaja() {
  const { user } = useAuthStore();
  const { activeCompany, activeBranchId } = useTenantStore();
  const { activeSession, fetchActiveSession, openSession, closeSession } = useCashSessionStore();
  const { transactions, fetchTransactions } = useCashStore();

  const [initialBalance, setInitialBalance] = useState('');
  
  // Estados para Cierre
  const [actualCash, setActualCash] = useState<number | ''>('');
  const [actualCard, setActualCard] = useState<number | ''>('');
  const [actualTransfer, setActualTransfer] = useState<number | ''>('');
  const [closingNotes, setClosingNotes] = useState('');

  // Desglose (opcional)
  const [denominations, setDenominations] = useState({
    bills_2000: 0, bills_1000: 0, bills_500: 0, bills_200: 0, bills_100: 0, bills_50: 0, coins: 0
  });

  useEffect(() => {
    if (activeCompany && activeBranchId && user) {
      fetchActiveSession(activeCompany.id, activeBranchId, user.uid);
    }
  }, [activeCompany, activeBranchId, user, fetchActiveSession]);

  useEffect(() => {
    if (activeSession) {
      fetchTransactions(activeSession.id);
    }
  }, [activeSession, fetchTransactions]);

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialBalance) return;
    await openSession(Number(initialBalance));
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    const cash = Number(actualCash) || 0;
    const difference = cash - (activeSession?.expectedCash || 0);

    if (difference !== 0 && !closingNotes.trim()) {
      alert("La caja tiene una diferencia. Debe proveer una nota justificativa.");
      return;
    }

    if (window.confirm("¿Está seguro de cerrar el turno de caja actual?")) {
      await closeSession(
        cash, 
        Number(actualCard) || 0, 
        Number(actualTransfer) || 0, 
        closingNotes, 
        denominations
      );
    }
  };

  const downloadReport = () => {
    if (!activeSession) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Reporte de Cierre de Caja", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Cajero: ${activeSession.cashierName}`, 14, 32);
    doc.text(`Fecha Apertura: ${format(new Date(activeSession.openedAt), 'PP pp')}`, 14, 38);
    
    // @ts-ignore
    doc.autoTable({
      startY: 45,
      head: [['Métrica', 'Esperado', 'Real', 'Diferencia']],
      body: [
        ['Efectivo (DOP)', formatCurrency(activeSession.expectedCash), formatCurrency(Number(actualCash) || 0), formatCurrency((Number(actualCash) || 0) - activeSession.expectedCash)],
        ['Tarjeta (POS)', formatCurrency(activeSession.expectedCard), formatCurrency(Number(actualCard) || 0), formatCurrency((Number(actualCard) || 0) - activeSession.expectedCard)],
        ['Transferencia', formatCurrency(activeSession.expectedTransfer), formatCurrency(Number(actualTransfer) || 0), formatCurrency((Number(actualTransfer) || 0) - activeSession.expectedTransfer)]
      ],
    });

    // Desglose
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.text("Desglose de Efectivo:", 14, finalY + 10);
    // @ts-ignore
    doc.autoTable({
      startY: finalY + 15,
      head: [['Denominación', 'Cantidad', 'Total']],
      body: [
        ['RD$ 2000', denominations.bills_2000, formatCurrency(denominations.bills_2000 * 2000)],
        ['RD$ 1000', denominations.bills_1000, formatCurrency(denominations.bills_1000 * 1000)],
        ['RD$ 500', denominations.bills_500, formatCurrency(denominations.bills_500 * 500)],
        ['RD$ 200', denominations.bills_200, formatCurrency(denominations.bills_200 * 200)],
        ['RD$ 100', denominations.bills_100, formatCurrency(denominations.bills_100 * 100)],
        ['RD$ 50', denominations.bills_50, formatCurrency(denominations.bills_50 * 50)],
        ['Monedas', '-', formatCurrency(denominations.coins)],
      ]
    });

    doc.save(`cierre_caja_${activeSession.id}.pdf`);
  };

  const handleDenominationChange = (key: keyof typeof denominations, value: string) => {
    const val = Number(value) || 0;
    const newDenom = { ...denominations, [key]: val };
    setDenominations(newDenom);
    
    // Auto-calculate actualCash
    const totalCash = 
      newDenom.bills_2000 * 2000 +
      newDenom.bills_1000 * 1000 +
      newDenom.bills_500 * 500 +
      newDenom.bills_200 * 200 +
      newDenom.bills_100 * 100 +
      newDenom.bills_50 * 50 +
      newDenom.coins;
      
    setActualCash(totalCash);
  };

  if (!activeSession) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Apertura de Turno</h1>
            <p className="text-muted-foreground">La caja se encuentra cerrada.</p>
          </div>
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>

        <form onSubmit={handleOpen} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Fondo de Caja (Efectivo Inicial en RD$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">RD$</span>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Unlock className="w-5 h-5" />
            Abrir Turno
          </button>
        </form>
      </div>
    );
  }

  const difference = (Number(actualCash) || 0) - activeSession.expectedCash;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turno Activo</h1>
          <p className="text-emerald-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {activeSession.cashierName} • {format(new Date(activeSession.openedAt), 'PP pp')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Efectivo Esperado</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(activeSession.expectedCash)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Tarjeta (POS) Esperado</p>
          <p className="text-2xl font-bold text-blue-500">{formatCurrency(activeSession.expectedCard)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Transferencia Esperado</p>
          <p className="text-2xl font-bold text-purple-500">{formatCurrency(activeSession.expectedTransfer)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Formulario de Cierre */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-500 w-5 h-5" />
              <h2 className="text-lg font-semibold text-foreground">Arqueo y Cierre</h2>
            </div>
            <button onClick={downloadReport} className="text-sm flex items-center gap-1 text-primary hover:underline">
              <Download size={16} /> Pre-Reporte
            </button>
          </div>

          <form onSubmit={handleClose} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground border-b border-border pb-2">Conteos Reales</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Efectivo Físico</label>
                  <input
                    type="number"
                    value={actualCash}
                    onChange={(e) => setActualCash(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Cierre de POS (Tarjeta)</label>
                  <input
                    type="number"
                    value={actualCard}
                    onChange={(e) => setActualCard(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">Total Transferencias / Depósitos</label>
                  <input
                    type="number"
                    value={actualTransfer}
                    onChange={(e) => setActualTransfer(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            {actualCash !== '' && (
              <div className={`p-4 rounded-xl border ${
                difference === 0 ? 'bg-emerald-500/10 border-emerald-500/20' :
                difference > 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Diferencia Efectivo:</span>
                  <span className={`text-xl font-bold ${
                    difference === 0 ? 'text-emerald-500' :
                    difference > 0 ? 'text-blue-500' : 'text-red-500'
                  }`}>
                    {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                  </span>
                </div>
                {difference !== 0 && (
                  <p className="text-xs mt-1 text-muted-foreground">
                    {difference > 0 ? 'Hay un sobrante en caja.' : 'Falta dinero en caja.'}
                  </p>
                )}
              </div>
            )}

            {difference !== 0 && actualCash !== '' && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nota Justificativa Obligatoria
                </label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary"
                  rows={2}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="w-5 h-5" />
              Cerrar Turno Oficialmente
            </button>
          </form>
        </div>

        {/* Desglose Billetes */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Desglose de Billetes (RD$)</h2>
          </div>
          <div className="space-y-3">
            {Object.entries({
              bills_2000: 2000,
              bills_1000: 1000,
              bills_500: 500,
              bills_200: 200,
              bills_100: 100,
              bills_50: 50
            }).map(([key, val]) => (
              <div key={key} className="flex items-center gap-4">
                <span className="w-20 text-sm text-muted-foreground">${val} x</span>
                <input
                  type="number"
                  min="0"
                  value={(denominations as any)[key] || ''}
                  onChange={(e) => handleDenominationChange(key as any, e.target.value)}
                  className="w-24 px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:border-primary"
                />
                <span className="text-sm font-medium">
                  {formatCurrency(((denominations as any)[key] || 0) * val)}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              <span className="w-20 text-sm text-muted-foreground">Monedas</span>
              <div className="relative w-24">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={denominations.coins || ''}
                  onChange={(e) => handleDenominationChange('coins', e.target.value)}
                  className="w-full pl-6 pr-2 py-1.5 bg-background border border-border rounded-lg text-foreground focus:border-primary"
                />
              </div>
              <span className="text-sm font-medium">
                {formatCurrency(denominations.coins || 0)}
              </span>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-card border border-border rounded-xl p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Movimientos del Turno</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay transacciones en este turno.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t: any) => (
              <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-background border border-border">
                <div>
                  <p className="font-medium text-foreground">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{t.method} • {t.type} • {t.currency || 'DOP'}</p>
                </div>
                <span className={`font-bold ${
                  t.type === 'INCOME' || t.type === 'DEPOSIT_IN' ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {t.type === 'INCOME' || t.type === 'DEPOSIT_IN' ? '+' : '-'}
                  {formatCurrency(t.amount, t.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
