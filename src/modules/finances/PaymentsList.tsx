import { useState, useEffect } from "react";
import { useFinanceStore } from "../../app/store/useFinanceStore";
import { useContractStore } from "../../app/store/useContractStore";
import { useTenantStore } from "../../app/store/useTenantStore";
import { GlassTable } from "../../shared/components/ui/GlassTable";
import { GlassModal } from "../../shared/components/ui/GlassModal";
import { Button } from "../../shared/components/ui/Button";
import { Input } from "../../shared/components/ui/Input";
import { DollarSign, Plus, Search, FileText, CreditCard } from "lucide-react";

export const PaymentsList = () => {
  const { activeCompany } = useTenantStore();
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
      fetchContracts(activeCompany.id);
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
        const types = { RENT: 'Pago de Renta', DEPOSIT: 'Depósito Garantía', PENALTY: 'Penalidad' };
        return <span className="text-sm">{types[row.type as keyof typeof types] || row.type}</span>;
      }
    },
    {
      header: "Método",
      cell: (row: any) => {
        const methods = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };
        return <span className="text-sm">{methods[row.method as keyof typeof methods] || row.method}</span>;
      }
    },
    {
      header: "Ref / NCF",
      cell: (row: any) => <span className="text-muted-foreground">{row.reference || '-'}</span>
    },
    {
      header: "Monto",
      cell: (row: any) => <span className="font-bold text-green-500">+${row.amount}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ingresos y Pagos</h1>
          <p className="text-sm text-muted-foreground">Registra los cobros asociados a contratos y garantías.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Registrar Cobro
        </Button>
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
