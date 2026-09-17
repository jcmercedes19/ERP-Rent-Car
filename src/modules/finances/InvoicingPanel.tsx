import React, { useEffect } from 'react';
import { useBillingStore } from '../../app/store/useBillingStore';
import { GlassTable } from '../../shared/components/ui/GlassTable';
import { formatCurrency } from '../../core/utils/formatters';
import { FileText, Printer, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export function InvoicingPanel() {
  const { invoices, fetchInvoices, loading } = useBillingStore();

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const columns = [
    {
      header: 'Factura / NCF',
      accessor: (invoice: any) => (
        <div>
          <p className="font-medium text-foreground">{invoice.id}</p>
          <p className="text-xs text-primary font-mono">{invoice.ncfNumber}</p>
        </div>
      )
    },
    {
      header: 'Cliente',
      accessor: (invoice: any) => invoice.customerId
    },
    {
      header: 'Fecha Emisión',
      accessor: (invoice: any) => format(invoice.issueDate, 'dd MMM yyyy')
    },
    {
      header: 'Estado',
      accessor: (invoice: any) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
          ${invoice.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}
          ${invoice.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : ''}
          ${invoice.status === 'ISSUED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}
          ${invoice.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
        `}>
          {invoice.status === 'PAID' && <CheckCircle size={14} />}
          {invoice.status === 'CANCELLED' && <XCircle size={14} />}
          {invoice.status === 'DRAFT' && <FileText size={14} />}
          {invoice.status}
        </span>
      )
    },
    {
      header: 'Total',
      accessor: (invoice: any) => (
        <div className="text-right font-medium">
          {formatCurrency(invoice.total)}
        </div>
      )
    },
    {
      header: '',
      accessor: (invoice: any) => (
        <div className="flex justify-end gap-2">
          <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
            <Printer size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="text-primary" />
            Facturación y NCF
          </h1>
          <p className="text-muted-foreground">Emisión de facturas y control fiscal para la DGII.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Facturas Emitidas</p>
          <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Facturado</p>
          <p className="text-2xl font-bold text-emerald-500">
            {formatCurrency(invoices.reduce((acc, inv) => acc + inv.total, 0))}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Impuestos (ITBIS)</p>
          <p className="text-2xl font-bold text-blue-500">
            {formatCurrency(invoices.reduce((acc, inv) => acc + inv.taxTotal, 0))}
          </p>
        </div>
      </div>

      <GlassTable
        data={invoices}
        columns={columns}
        emptyMessage="No hay facturas emitidas."
      />
    </div>
  );
}
