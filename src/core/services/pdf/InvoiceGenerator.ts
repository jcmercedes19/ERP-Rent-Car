import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Customer } from '../../../app/store/useCustomerStore';
import type { Branch } from '../../../app/store/useBranchStore';

// Extend jsPDF interface to include autoTable if TypeScript complains
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface InvoiceData {
  id: string;
  ncf?: string;
  ncfType?: string;
  date: Date;
  subtotal: number;
  tax: number;
  total: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export const generateInvoicePDF = (
  invoice: InvoiceData, 
  customer: Customer, 
  branch: Branch, 
  companyName: string, 
  companyRnc: string
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.text('FACTURA', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(companyName, 20, 35);
  doc.setFontSize(10);
  doc.text(`RNC: ${companyRnc}`, 20, 42);
  doc.text(`Sucursal: ${branch.name}`, 20, 49);
  doc.text(`${branch.address}, ${branch.city}`, 20, 56);
  doc.text(`Tel: ${branch.phone}`, 20, 63);

  // Invoice Details
  doc.setFontSize(10);
  doc.text(`Factura No.: ${invoice.id}`, 140, 35);
  doc.text(`Fecha: ${invoice.date.toLocaleDateString()}`, 140, 42);
  if (invoice.ncf) {
    doc.text(`NCF: ${invoice.ncf}`, 140, 49);
    if (invoice.ncfType) {
      doc.text(`Tipo: ${invoice.ncfType}`, 140, 56);
    }
  }

  // Customer Data
  doc.setFontSize(12);
  doc.text('Cliente:', 20, 80);
  doc.setFontSize(10);
  doc.text(`Nombre: ${customer.firstName} ${customer.lastName}`, 20, 87);
  doc.text(`RNC/Cédula: ${customer.documentId}`, 20, 94);
  doc.text(`Dirección: ${customer.address}`, 20, 101);

  // Items Table
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.amount.toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 110,
    head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Importe']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Totals
  doc.setFontSize(10);
  doc.text('Subtotal:', 140, finalY);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 190, finalY, { align: 'right' });
  
  doc.text('ITBIS (18%):', 140, finalY + 7);
  doc.text(`$${invoice.tax.toFixed(2)}`, 190, finalY + 7, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 140, finalY + 17);
  doc.text(`$${invoice.total.toFixed(2)}`, 190, finalY + 17, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Gracias por su preferencia.', 105, 280, { align: 'center' });
  doc.text('Este documento es una representación impresa de un comprobante fiscal.', 105, 285, { align: 'center' });

  return doc;
};

export const downloadInvoicePDF = (
  invoice: InvoiceData, 
  customer: Customer, 
  branch: Branch, 
  companyName: string, 
  companyRnc: string
) => {
  const doc = generateInvoicePDF(invoice, customer, branch, companyName, companyRnc);
  doc.save(`Factura_${invoice.id}.pdf`);
};
