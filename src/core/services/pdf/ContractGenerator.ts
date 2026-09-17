import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { RentalContract } from '../../../app/store/useContractStore';
import type { Customer } from '../../../app/store/useCustomerStore';
import type { Vehicle } from '../../../app/store/useVehicleStore';

// Extend jsPDF interface to include autoTable if TypeScript complains
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateContractPDF = (contract: RentalContract, customer: Customer, vehicle: Vehicle) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('CONTRATO DE ALQUILER DE VEHÍCULO', 105, 20, { align: 'center' });
  
  // Date and ID
  doc.setFontSize(10);
  doc.text(`No. Contrato: ${contract.id}`, 20, 30);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 140, 30);
  
  // Customer Data
  doc.setFontSize(14);
  doc.text('DATOS DEL ARRENDATARIO', 20, 45);
  doc.setFontSize(10);
  doc.text(`Nombre: ${customer.firstName} ${customer.lastName}`, 20, 55);
  doc.text(`Documento (Cédula/Pasaporte): ${customer.documentId}`, 20, 62);
  doc.text(`Licencia de Conducir: ${customer.licenseNumber}`, 20, 69);
  doc.text(`Teléfono: ${customer.phone}`, 20, 76);
  doc.text(`Email: ${customer.email}`, 20, 83);
  doc.text(`Dirección: ${customer.address}`, 20, 90);

  // Vehicle Data
  doc.setFontSize(14);
  doc.text('DATOS DEL VEHÍCULO', 20, 105);
  doc.setFontSize(10);
  doc.text(`Marca/Modelo: ${vehicle.brand} ${vehicle.model}`, 20, 115);
  doc.text(`Año: ${vehicle.year}`, 20, 122);
  doc.text(`Placa: ${vehicle.plate}`, 20, 129);
  doc.text(`Color: ${vehicle.color || 'N/A'}`, 20, 136);

  // Rental Details
  doc.setFontSize(14);
  doc.text('DETALLES DEL ALQUILER', 20, 150);
  
  const rentalData = [
    ['Fecha de Inicio', new Date(contract.startDate).toLocaleString()],
    ['Fecha de Retorno Esperada', new Date(contract.expectedReturnDate).toLocaleString()],
    ['Días de Alquiler', contract.totalDays.toString()],
    ['Tarifa Diaria', `$${contract.dailyRate.toFixed(2)}`],
    ['Subtotal', `$${contract.subtotal.toFixed(2)}`],
    ['Depósito (Garantía)', `$${contract.depositAmount.toFixed(2)}`],
    ['Total a Pagar', `$${contract.totalAmount.toFixed(2)}`]
  ];

  doc.autoTable({
    startY: 155,
    head: [['Concepto', 'Detalle']],
    body: rentalData,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  // Terms and conditions (simplified)
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text('TÉRMINOS Y CONDICIONES', 20, finalY);
  doc.setFontSize(9);
  const terms = `1. El arrendatario acepta recibir el vehículo en buenas condiciones.
2. El arrendatario se compromete a devolver el vehículo en la fecha estipulada.
3. El depósito de garantía será devuelto si no se encuentran daños al momento de la devolución.
4. El vehículo no debe ser conducido por personas no autorizadas en este contrato.`;
  doc.text(terms, 20, finalY + 7);

  // Signatures
  doc.setLineWidth(0.5);
  doc.line(20, finalY + 45, 90, finalY + 45);
  doc.line(120, finalY + 45, 190, finalY + 45);
  
  doc.text('Firma del Arrendatario', 35, finalY + 52);
  doc.text('Firma del Representante', 135, finalY + 52);

  return doc;
};

export const downloadContractPDF = (contract: RentalContract, customer: Customer, vehicle: Vehicle) => {
  const doc = generateContractPDF(contract, customer, vehicle);
  doc.save(`Contrato_${contract.id}_${customer.firstName}.pdf`);
};
