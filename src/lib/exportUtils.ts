import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, InventoryMovement } from '@/types/inventory';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Export products to Excel
export function exportProductsToExcel(products: Product[]) {
  const data = products.map(p => ({
    'Código': p.code,
    'Nombre': p.name,
    'Descripción': p.description || '',
    'Categoría': p.category?.name || 'Sin categoría',
    'Precio Compra': p.purchase_price,
    'Precio Venta': p.sale_price,
    'Stock': p.stock,
    'Unidad': p.unit,
    'Stock Mínimo': p.low_stock_threshold,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, `productos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Export products to PDF
export function exportProductsToPDF(products: Product[]) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Lista de Productos', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}`, 14, 30);
  doc.text(`Total: ${products.length} productos`, 14, 36);

  const tableData = products.map(p => [
    p.code,
    p.name.substring(0, 20),
    p.category?.name || '-',
    `$${Number(p.sale_price).toFixed(2)}`,
    `${Number(p.stock).toFixed(0)} ${p.unit}`,
    p.stock <= p.low_stock_threshold ? 'Bajo' : 'OK',
  ]);

  autoTable(doc, {
    head: [['Código', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Estado']],
    body: tableData,
    startY: 42,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`productos_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Export movements report to Excel
export function exportMovementsToExcel(movements: InventoryMovement[], startDate: string, endDate: string) {
  const data = movements.map(m => ({
    'Fecha': format(new Date(m.movement_date), 'dd/MM/yyyy'),
    'Tipo': m.movement_type === 'entrada' ? 'Entrada' : 'Venta',
    'Producto': m.product?.name || '',
    'Código': m.product?.code || '',
    'Categoría': m.product?.category?.name || 'Sin categoría',
    'Cantidad': m.quantity,
    'Unidad': m.product?.unit || '',
    'Precio Unit.': m.unit_price,
    'Total': m.total_amount,
  }));

  const totalEntradas = movements.filter(m => m.movement_type === 'entrada').reduce((s, m) => s + m.total_amount, 0);
  const totalVentas = movements.filter(m => m.movement_type === 'salida').reduce((s, m) => s + m.total_amount, 0);

  // Add summary rows
  data.push({} as any);
  data.push({
    'Fecha': 'RESUMEN',
    'Tipo': '',
    'Producto': '',
    'Código': '',
    'Categoría': '',
    'Cantidad': '' as any,
    'Unidad': '',
    'Precio Unit.': '' as any,
    'Total': '' as any,
  });
  data.push({
    'Fecha': 'Total Compras:',
    'Tipo': '',
    'Producto': '',
    'Código': '',
    'Categoría': '',
    'Cantidad': '' as any,
    'Unidad': '',
    'Precio Unit.': '' as any,
    'Total': totalEntradas,
  });
  data.push({
    'Fecha': 'Total Ventas:',
    'Tipo': '',
    'Producto': '',
    'Código': '',
    'Categoría': '',
    'Cantidad': '' as any,
    'Unidad': '',
    'Precio Unit.': '' as any,
    'Total': totalVentas,
  });
  data.push({
    'Fecha': 'Balance:',
    'Tipo': '',
    'Producto': '',
    'Código': '',
    'Categoría': '',
    'Cantidad': '' as any,
    'Unidad': '',
    'Precio Unit.': '' as any,
    'Total': totalVentas - totalEntradas,
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
  XLSX.writeFile(wb, `reporte_${startDate}_${endDate}.xlsx`);
}

// Export movements report to PDF
export function exportMovementsToPDF(movements: InventoryMovement[], startDate: string, endDate: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Reporte de Movimientos', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Período: ${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`, 14, 30);
  doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}`, 14, 36);

  const totalEntradas = movements.filter(m => m.movement_type === 'entrada').reduce((s, m) => s + m.total_amount, 0);
  const totalVentas = movements.filter(m => m.movement_type === 'salida').reduce((s, m) => s + m.total_amount, 0);
  const balance = totalVentas - totalEntradas;

  doc.text(`Total Compras: $${totalEntradas.toFixed(2)}`, 14, 44);
  doc.text(`Total Ventas: $${totalVentas.toFixed(2)}`, 14, 50);
  doc.text(`Balance: $${balance.toFixed(2)}`, 14, 56);

  const tableData = movements.map(m => [
    format(new Date(m.movement_date), 'dd/MM/yy'),
    m.movement_type === 'entrada' ? 'Entrada' : 'Venta',
    m.product?.name?.substring(0, 15) || '',
    m.product?.category?.name?.substring(0, 10) || '-',
    m.quantity.toString(),
    `$${Number(m.unit_price).toFixed(2)}`,
    `$${Number(m.total_amount).toFixed(2)}`,
  ]);

  autoTable(doc, {
    head: [['Fecha', 'Tipo', 'Producto', 'Categoría', 'Cant.', 'P.Unit', 'Total']],
    body: tableData,
    startY: 64,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`reporte_${startDate}_${endDate}.pdf`);
}
