import { useState, useEffect } from "react";
import { useFinanceStore } from "../../app/store/useFinanceStore";
import { useContractStore } from "../../app/store/useContractStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { GlassTable } from "../../shared/components/ui/GlassTable";
import { GlassModal } from "../../shared/components/ui/GlassModal";
import { Button } from "../../shared/components/ui/Button";
import { Input } from "../../shared/components/ui/Input";
import { DollarSign, Plus, Search, FileText, CreditCard, Wallet, AlertCircle } from "lucide-react";

export const PaymentsList = () => {
  const { activeCompany, activeBranchId } = useTenantStore();
  const { payments, fetchFinances, addPayment, loading } = useFinanceStore();
  const { contracts, fetchContracts } = useContractStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    contractId: "",
    amount: 0,
    method: "CASH" as "CASH" | "CARD" | "TRANSFER",
    type: "RENT" as "RENT" | "DEPOSIT" | "PENALTY",
    reference: "",
    notes: ""
  });

  useEffect(() => {
    if (activeCompany?.id) {
      fetchFinances(activeCompany.id);
      fetchContracts(activeCompany.id, activeBranchId);
    }
  }, [activeCompany?.id, fetchFinances, fetchContracts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany?.id) return;
    try {
      await addPayment({ ...formData, companyId: activeCompany.id });
      setIsModalOpen(false);
      setFormData({ contractId: "", amount: 0, method: "CASH", type: "RENT", reference: "", notes: "" });
    } catch (error) {
      alert("Error al registrar el pago");
    }
  };

  const filteredPayments = payments.filter(p => 
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.contractId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIncome = payments.filter(p => p.type !== 'DEPOSIT').reduce((sum, p) => sum + p.amount, 0);
  const totalDeposits = payments.filter(p => p.type === 'DEPOSIT').reduce((sum, p) => sum + p.amount, 0);

  const columns = [
    {
      header: "Fecha",
      cell: (row: any) => <span className="text-muted-foreground">{new Date(row.createdAt?.seconds * 1000).toLocaleDateString()}</span>
    },
    {
      header: "Contrato / Factura",
      cell: (row: any) => <span className="font-medium text-foreground">{row.contractId.substring(0, 8).toUpperCase()}</span>
    },
    {
      header: "Concepto",
      cell: (row: any) => {
        if (row.type === 'DEPOSIT') {
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 backdrop-blur-sm">
              Depósito Garantía
            </span>
          );
        }
        if (row.type === 'PENALTY') {
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20 backdrop-blur-sm">
              Penalidad / Extra
            </span>
          );
        }
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 backdrop-blur-sm">
            Pago de Renta
          </span>
        );
      }
    },
    {
      header: "Método",
      cell: (row: any) => {
        const methods = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };
        return <span className="text-sm text-muted-foreground">{methods[row.method as keyof typeof methods] || row.method}</span>;
      }
    },
    {
      header: "Ref / NCF",
      cell: (row: any) => <span className="text-muted-foreground">{row.reference || '-'}</span>
    },
    {
      header: "Monto",
      cell: (row: any) => (
        <span className={`font-bold ${row.type === 'DEPOSIT' ? 'text-amber-500' : 'text-emerald-500'}`}>
          +${row.amount.toLocaleString()}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registro de Cobros</h1>
          <p className="text-sm text-muted-foreground">Administra los pagos de renta y depósitos de garantía.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Registrar Cobro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Ingresos Operativos</p>
            <h3 className="text-2xl font-bold text-emerald-500">${totalIncome.toLocaleString()}</h3>
          </div>
        </div>
        <div className="glass p-4 rounded-2xl shadow-sm flex items-center gap-4 border-amber-500/20">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">Garantías Retenidas <AlertCircle size={12}/></p>
            <h3 className="text-2xl font-bold text-amber-500">${totalDeposits.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="glass p-4 rounded-2xl shadow-apple flex items-center max-w-md">
        <Search className="text-muted-foreground mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por referencia o contrato..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-foreground w-full placeholder:text-muted-foreground"
        />
      </div>

      <GlassTable data={filteredPayments} columns={columns} emptyMessage="No hay pagos registrados." />

      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Pago">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 w-full">
            <label className="text-sm font-medium text-foreground ml-1">Contrato Relacionado</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><FileText size={18} /></div>
              <select required value={formData.contractId} onChange={e => setFormData({...formData, contractId: e.target.value})} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all pl-11">
                <option value="">Seleccione un contrato</option>
                {contracts.filter(c => c.status !== 'CANCELLED').map(c => (
                  <option key={c.id} value={c.id}>CTR-{c.id.substring(0,6).toUpperCase()} | Saldo: ${c.totalAmount}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto a Cobrar" type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} icon={<DollarSign size={18} />} />
            
            <div className="space-y-1 w-full">
              <label className="text-sm font-medium text-foreground ml-1">Método de Pago</label>
              <select required value={formData.method} onChange={e => setFormData({...formData, method: e.target.value as any})} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all">
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta de Crédito</option>
                <option value="TRANSFER">Transferencia Bancaria</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 w-full">
              <label className="text-sm font-medium text-foreground ml-1">Concepto</label>
              <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all">
                <option value="RENT">Pago de Renta (Factura)</option>
                <option value="DEPOSIT">Depósito de Garantía</option>
                <option value="PENALTY">Penalidad / Daños</option>
              </select>
            </div>
            <Input label="Ref. / NCF (Opcional)" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} icon={<CreditCard size={18} />} placeholder="B0100000001" />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={loading}>Registrar Pago</Button>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
