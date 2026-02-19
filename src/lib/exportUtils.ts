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
    'Tipo Venta': p.sale_type === 'unit' ? 'Por Unidad' : p.sale_type === 'weight' ? 'Por Peso' : 'Variantes',
    'Unidad Base': p.base_unit,
    'Precio Compra': p.purchase_price,
    'Precio Venta': p.sale_price,
    'Stock Base': p.stock_base_units,
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
    p.sale_type === 'unit' ? 'Unidad' : p.sale_type === 'weight' ? 'Peso' : 'Var.',
    `$${Number(p.sale_price).toFixed(2)}`,
    `${Number(p.stock_base_units).toFixed(0)} ${p.base_unit}`,
    p.stock_base_units <= p.low_stock_threshold ? 'Bajo' : 'OK',
  ]);

  autoTable(doc, {
    head: [['Código', 'Nombre', 'Tipo', 'Precio', 'Stock', 'Estado']],
    body: tableData,
    startY: 42,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 163, 74] },
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
    'Cantidad': m.quantity,
    'Unidad': m.product?.unit || '',
    'Precio Unit. USD': m.unit_price,
    'Total USD': m.total_amount,
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
    'Cantidad': '' as any,
    'Unidad': '',
    'Precio Unit. USD': '' as any,
    'Total USD': '' as any,
  });
  data.push({
    'Fecha': 'Total Compras:',
    'Tipo': '',
    'Producto': '',
    'Código': '',
    'Cantidad': '' as any,
    'Unidad': '',
    'Precio Unit. USD': '' as any,
    'Total USD': totalEntradas,
  });
  data.push({
    'Fecha': 'Total Ventas:',
    'Tipo': '',
    'Producto': '',
    'Código': '',
    'Cantidad': '' as any,
    'Unidad': '',
    'Precio Unit. USD': '' as any,
    'Total USD': totalVentas,
  });
  data.push({
    'Fecha': 'Balance:',
    'Tipo': '',
    'Producto': '',
    'Código': '',
    'Cantidad': '' as any,
    'Unidad': '',
    'Precio Unit. USD': '' as any,
    'Total USD': totalVentas - totalEntradas,
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
  XLSX.writeFile(wb, `reporte_${startDate}_${endDate}.xlsx`);
}

// Export movements report to PDF (simple)
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
    m.quantity.toString(),
    `$${Number(m.unit_price).toFixed(2)}`,
    `$${Number(m.total_amount).toFixed(2)}`,
  ]);

  autoTable(doc, {
    head: [['Fecha', 'Tipo', 'Producto', 'Cant.', 'P.Unit', 'Total']],
    body: tableData,
    startY: 64,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [22, 163, 74] },
  });

  doc.save(`reporte_${startDate}_${endDate}.pdf`);
}

// ========== FULL REPORT PDF ==========

interface FullReportData {
  movements: InventoryMovement[];
  products: Product[];
  startDate: string;
  endDate: string;
  exchangeRate: number;
  profileMap?: Record<string, string>;
}

function addPageHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFontSize(16);
  doc.setTextColor(22, 163, 74);
  doc.text(title, 14, 20);
  doc.setTextColor(0, 0, 0);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(subtitle, 14, 27);
    doc.setTextColor(0, 0, 0);
  }
}

function drawSummaryBox(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, color: [number, number, number]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, 22, 2, 2, 'S');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(label, x + 4, y + 8);
  doc.setFontSize(14);
  doc.setTextColor(...color);
  doc.text(value, x + 4, y + 18);
  doc.setTextColor(0, 0, 0);
}

// Draw a horizontal bar chart in the PDF
function drawBarChart(
  doc: jsPDF,
  x: number, y: number, width: number, maxHeight: number,
  items: { label: string; value: number }[],
  color: [number, number, number],
  title: string,
  valuePrefix = '$'
) {
  if (items.length === 0) return y;

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(title, x, y);
  y += 6;

  const maxVal = Math.max(...items.map(i => i.value), 1);
  const barHeight = Math.min(10, (maxHeight - 10) / items.length);
  const labelWidth = 50;
  const barAreaWidth = width - labelWidth - 50;

  items.forEach((item, i) => {
    const barY = y + i * (barHeight + 3);
    // Label
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    const truncLabel = item.label.length > 18 ? item.label.slice(0, 18) + '…' : item.label;
    doc.text(truncLabel, x, barY + barHeight - 2);

    // Bar
    const barW = Math.max(2, (item.value / maxVal) * barAreaWidth);
    const alpha = 0.5 + (0.5 * (1 - i / items.length));
    doc.setFillColor(
      Math.round(color[0] * alpha + 255 * (1 - alpha)),
      Math.round(color[1] * alpha + 255 * (1 - alpha)),
      Math.round(color[2] * alpha + 255 * (1 - alpha))
    );
    doc.roundedRect(x + labelWidth, barY, barW, barHeight - 1, 1, 1, 'F');

    // Value label
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    doc.text(`${valuePrefix}${item.value.toFixed(valuePrefix === '' ? 0 : 2)}`, x + labelWidth + barW + 3, barY + barHeight - 2);
  });

  doc.setTextColor(0, 0, 0);
  return y + items.length * (barHeight + 3) + 6;
}

export function exportFullReportPDF(data: FullReportData) {
  const { movements, products, startDate, endDate, exchangeRate, profileMap = {} } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const sales = movements.filter(m => m.movement_type === 'salida');
  const entries = movements.filter(m => m.movement_type === 'entrada');
  const totalVentas = sales.reduce((s, m) => s + Number(m.total_amount), 0);
  const totalCompras = entries.reduce((s, m) => s + Number(m.total_amount), 0);
  const balance = totalVentas - totalCompras;

  // ===== PAGE 1: RESUMEN GENERAL =====
  doc.setFontSize(22);
  doc.setTextColor(22, 163, 74);
  doc.text('Reporte General', 14, 22);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Período: ${format(new Date(startDate), 'dd/MM/yyyy')} – ${format(new Date(endDate), 'dd/MM/yyyy')}`, 14, 30);
  doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`, 14, 36);
  doc.text(`Tasa de cambio: 1 USD = ${exchangeRate.toFixed(2)} Bs`, 14, 42);
  doc.setTextColor(0, 0, 0);

  // Summary boxes
  const boxW = (pageWidth - 42) / 3;
  drawSummaryBox(doc, 14, 50, boxW, 'Total Ventas', `$${totalVentas.toFixed(2)}`, [22, 163, 74]);
  drawSummaryBox(doc, 14 + boxW + 7, 50, boxW, 'Total Compras', `$${totalCompras.toFixed(2)}`, [234, 179, 8]);
  drawSummaryBox(doc, 14 + (boxW + 7) * 2, 50, boxW, 'Balance', `${balance >= 0 ? '+' : ''}$${balance.toFixed(2)}`, balance >= 0 ? [22, 163, 74] : [220, 38, 38]);

  // Bs equivalents
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Bs. ${(totalVentas * exchangeRate).toFixed(2)}`, 18, 77);
  doc.text(`Bs. ${(totalCompras * exchangeRate).toFixed(2)}`, 18 + boxW + 7, 77);
  doc.text(`Bs. ${(balance * exchangeRate).toFixed(2)}`, 18 + (boxW + 7) * 2, 77);
  doc.setTextColor(0, 0, 0);

  // Stats summary
  let yPos = 88;
  doc.setFontSize(12);
  doc.text('Resumen Estadístico', 14, yPos);
  yPos += 8;

  const statsData = [
    ['Total de movimientos', movements.length.toString()],
    ['Ventas realizadas', sales.length.toString()],
    ['Entradas registradas', entries.length.toString()],
    ['Productos registrados', products.length.toString()],
    ['Productos con stock bajo', products.filter(p => Number(p.stock_base_units) <= Number(p.low_stock_threshold)).length.toString()],
  ];

  autoTable(doc, {
    body: statsData,
    startY: yPos,
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100 }, 1: { halign: 'right' } },
    theme: 'plain',
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Top 10 products summary on page 1
  const salesByProduct: Record<string, { qty: number; revenue: number; name: string; code: string }> = {};
  sales.forEach(s => {
    if (!salesByProduct[s.product_id]) {
      salesByProduct[s.product_id] = { qty: 0, revenue: 0, name: s.product?.name || '', code: s.product?.code || '' };
    }
    salesByProduct[s.product_id].qty += Number(s.quantity);
    salesByProduct[s.product_id].revenue += Number(s.total_amount);
  });
  const ranked = Object.values(salesByProduct).sort((a, b) => b.qty - a.qty);
  const top10 = ranked.slice(0, 10);

  yPos = (doc as any).lastAutoTable?.finalY + 10 || 140;
  if (yPos > 200) { doc.addPage(); yPos = 20; }

  doc.setFontSize(12);
  doc.text('Top 10 Productos Más Vendidos', 14, yPos);
  yPos += 4;

  if (top10.length > 0) {
    autoTable(doc, {
      head: [['#', 'Código', 'Producto', 'Cant. Vendida', 'Ingresos USD', 'Ingresos Bs']],
      body: top10.map((p, i) => [
        (i + 1).toString(),
        p.code,
        p.name.substring(0, 25),
        p.qty.toFixed(0),
        `$${p.revenue.toFixed(2)}`,
        `Bs. ${(p.revenue * exchangeRate).toFixed(2)}`,
      ]),
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
    });
  }

  // Credit summary on page 1
  const creditMovements = movements.filter(m => m.is_credit);
  const totalFiado = creditMovements.reduce((s, m) => s + Number(m.total_amount), 0);
  const totalPagado = creditMovements.reduce((s, m) => s + Number(m.amount_paid), 0);
  const totalPendiente = totalFiado - totalPagado;

  yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 30;
  if (yPos > 240) { doc.addPage(); yPos = 20; }

  doc.setFontSize(12);
  doc.text('Resumen de Créditos (Fiados)', 14, yPos);
  yPos += 4;

  autoTable(doc, {
    body: [
      ['Total Fiado', `$${totalFiado.toFixed(2)}`, `Bs. ${(totalFiado * exchangeRate).toFixed(2)}`],
      ['Total Pagado', `$${totalPagado.toFixed(2)}`, `Bs. ${(totalPagado * exchangeRate).toFixed(2)}`],
      ['Pendiente por Cobrar', `$${totalPendiente.toFixed(2)}`, `Bs. ${(totalPendiente * exchangeRate).toFixed(2)}`],
    ],
    startY: yPos,
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
    theme: 'plain',
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // ===== PAGE: STOCK BAJO =====
  doc.addPage();
  addPageHeader(doc, 'Stock Bajo', 'Productos cuyo stock está por debajo del umbral mínimo');

  const lowStock = products
    .filter(p => Number(p.stock_base_units) <= Number(p.low_stock_threshold))
    .sort((a, b) => Number(a.stock_base_units) - Number(b.stock_base_units));

  if (lowStock.length === 0) {
    doc.setFontSize(10);
    doc.text('Todos los productos tienen stock suficiente ✓', 14, 38);
  } else {
    autoTable(doc, {
      head: [['Código', 'Producto', 'Stock Actual', 'Mínimo', 'Estado', 'Precio Venta']],
      body: lowStock.map(p => [
        p.code,
        p.name.substring(0, 30),
        `${Number(p.stock_base_units).toFixed(0)} ${p.base_unit}s`,
        Number(p.low_stock_threshold).toFixed(0),
        Number(p.stock_base_units) === 0 ? 'AGOTADO' : 'BAJO',
        `$${Number(p.sale_price).toFixed(2)}`,
      ]),
      startY: 34,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 179, 8] },
      bodyStyles: { },
      didParseCell: (data: any) => {
        if (data.column.index === 4 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'AGOTADO' ? [220, 38, 38] : [234, 179, 8];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }

  // ===== PAGE: RANKING =====
  doc.addPage();
  addPageHeader(doc, 'Ranking de Productos', 'Top y bottom productos por cantidad vendida en el período');

  if (top10.length > 0) {
    doc.setFontSize(11);
    doc.text('Más Vendidos', 14, 36);
    autoTable(doc, {
      head: [['#', 'Código', 'Producto', 'Cantidad', 'Ingresos USD', 'Ingresos Bs']],
      body: top10.map((p, i) => [
        (i + 1).toString(),
        p.code,
        p.name.substring(0, 25),
        p.qty.toFixed(0),
        `$${p.revenue.toFixed(2)}`,
        `Bs. ${(p.revenue * exchangeRate).toFixed(2)}`,
      ]),
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
    });
  }

  // Least selling
  const topIds = new Set(top10.map(p => p.code));
  const bottom10 = ranked.filter(p => !topIds.has(p.code)).sort((a, b) => a.qty - b.qty).slice(0, 10);

  yPos = (doc as any).lastAutoTable?.finalY + 8 || 100;
  if (yPos > 220) { doc.addPage(); yPos = 20; }

  if (bottom10.length > 0) {
    doc.setFontSize(11);
    doc.text('Menos Vendidos', 14, yPos);
    autoTable(doc, {
      head: [['#', 'Código', 'Producto', 'Cantidad', 'Ingresos USD']],
      body: bottom10.map((p, i) => [
        (i + 1).toString(),
        p.code,
        p.name.substring(0, 25),
        p.qty.toFixed(0),
        `$${p.revenue.toFixed(2)}`,
      ]),
      startY: yPos + 4,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 179, 8] },
    });
  }

  // No sales
  const soldIds = new Set(Object.keys(salesByProduct));
  const noSales = products.filter(p => !soldIds.has(p.id));
  yPos = (doc as any).lastAutoTable?.finalY + 8 || yPos + 40;
  if (yPos > 230) { doc.addPage(); yPos = 20; }

  if (noSales.length > 0) {
    doc.setFontSize(11);
    doc.text(`Sin Ventas (${noSales.length})`, 14, yPos);
    autoTable(doc, {
      head: [['Código', 'Producto', 'Stock', 'Precio']],
      body: noSales.map(p => [
        p.code,
        p.name.substring(0, 30),
        `${Number(p.stock_base_units).toFixed(0)} ${p.base_unit}s`,
        `$${Number(p.sale_price).toFixed(2)}`,
      ]),
      startY: yPos + 4,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [160, 160, 160] },
    });
  }

  // ===== PAGE: CRÉDITOS / DEUDORES =====
  doc.addPage();
  addPageHeader(doc, 'Créditos y Deudores', 'Detalle de fiados pendientes por cliente');

  const debtorMap = new Map<string, { total: number; paid: number; count: number }>();
  creditMovements.forEach(m => {
    const name = m.customer_name || 'Sin nombre';
    const existing = debtorMap.get(name) || { total: 0, paid: 0, count: 0 };
    existing.total += Number(m.total_amount);
    existing.paid += Number(m.amount_paid);
    existing.count++;
    debtorMap.set(name, existing);
  });

  const debtors = Array.from(debtorMap.entries())
    .map(([name, d]) => ({ name, ...d, due: d.total - d.paid }))
    .filter(d => d.due > 0.01)
    .sort((a, b) => b.due - a.due);

  if (debtors.length === 0) {
    doc.setFontSize(10);
    doc.text('No hay deudas pendientes ✓', 14, 38);
  } else {
    autoTable(doc, {
      head: [['Cliente', 'Total Fiado', 'Pagado', 'Pendiente', 'Transacciones']],
      body: debtors.map(d => [
        d.name,
        `$${d.total.toFixed(2)}`,
        `$${d.paid.toFixed(2)}`,
        `$${d.due.toFixed(2)}`,
        d.count.toString(),
      ]),
      startY: 34,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] },
      didParseCell: (data: any) => {
        if (data.column.index === 3 && data.section === 'body') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }

  // ===== PAGE: VENTAS POR HORA =====
  doc.addPage();
  addPageHeader(doc, 'Ventas por Hora', 'Distribución de transacciones e ingresos por hora del día');

  const hourData = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, revenue: 0 }));
  sales.forEach(s => {
    const hour = new Date(s.created_at).getHours();
    hourData[hour].count++;
    hourData[hour].revenue += Number(s.total_amount);
  });

  const activeHours = hourData.filter(h => h.count > 0);
  const peakHour = hourData.reduce((best, h) => h.count > best.count ? h : best, hourData[0]);

  if (peakHour.count > 0) {
    doc.setFontSize(10);
    doc.text(`Hora pico: ${peakHour.hour.toString().padStart(2, '0')}:00 – ${(peakHour.hour + 1).toString().padStart(2, '0')}:00 (${peakHour.count} ventas, $${peakHour.revenue.toFixed(2)})`, 14, 36);
  }

  if (activeHours.length > 0) {
    autoTable(doc, {
      head: [['Hora', 'Ventas', 'Ingresos USD', 'Ingresos Bs']],
      body: activeHours.map(h => [
        `${h.hour.toString().padStart(2, '0')}:00 – ${(h.hour + 1).toString().padStart(2, '0')}:00`,
        h.count.toString(),
        `$${h.revenue.toFixed(2)}`,
        `Bs. ${(h.revenue * exchangeRate).toFixed(2)}`,
      ]),
      startY: 42,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          const hourVal = activeHours[data.row.index]?.hour;
          if (hourVal === peakHour.hour) {
            data.cell.styles.fillColor = [219, 234, 254];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
  }

  // ===== PAGE: MÉTODOS DE PAGO =====
  doc.addPage();
  addPageHeader(doc, 'Métodos de Pago', 'Desglose de ventas por método de pago');

  const methods: Record<string, { amount: number; count: number }> = {
    'Efectivo $': { amount: 0, count: 0 },
    'Efectivo Bs': { amount: 0, count: 0 },
    'Tarjeta Bs': { amount: 0, count: 0 },
    'Transferencia Bs': { amount: 0, count: 0 },
    'Sin detalle': { amount: 0, count: 0 },
  };

  sales.forEach(s => {
    const notes = s.notes || '';
    let matched = false;
    const patterns = [
      { key: 'Efectivo $', regex: /Efectivo\s*\$[:\s]*\$?([\d,.]+)/i },
      { key: 'Efectivo Bs', regex: /Efectivo\s*Bs[:\s]*(?:Bs\.?\s?)?\$?([\d,.]+)/i },
      { key: 'Tarjeta Bs', regex: /Tarjeta\s*Bs[:\s]*(?:Bs\.?\s?)?\$?([\d,.]+)/i },
      { key: 'Transferencia Bs', regex: /Transferencia\s*Bs[:\s]*(?:Bs\.?\s?)?\$?([\d,.]+)/i },
    ];
    patterns.forEach(({ key, regex }) => {
      const match = notes.match(regex);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (val > 0) { methods[key].amount += val; methods[key].count++; matched = true; }
      }
    });
    if (!matched) { methods['Sin detalle'].amount += Number(s.total_amount); methods['Sin detalle'].count++; }
  });

  const totalPayments = Object.values(methods).reduce((s, m) => s + m.amount, 0);

  autoTable(doc, {
    head: [['Método', 'Monto USD', 'Monto Bs', 'Transacciones', '% del Total']],
    body: Object.entries(methods).filter(([, v]) => v.count > 0).map(([key, v]) => [
      key,
      `$${v.amount.toFixed(2)}`,
      `Bs. ${(v.amount * exchangeRate).toFixed(2)}`,
      v.count.toString(),
      `${totalPayments > 0 ? ((v.amount / totalPayments) * 100).toFixed(1) : '0'}%`,
    ]),
    startY: 34,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [139, 92, 246] },
  });

  // ===== PAGE: VENDEDORES =====
  doc.addPage();
  addPageHeader(doc, 'Estadísticas de Vendedores', 'Rendimiento por vendedor en el período');

  const bySeller: Record<string, { name: string; salesCount: number; revenue: number }> = {};
  sales.forEach(m => {
    const key = m.sold_by || '__unknown__';
    const name = (m.sold_by && profileMap[m.sold_by]) ? profileMap[m.sold_by] : (m.seller_name || 'Sin asignar');
    if (!bySeller[key]) bySeller[key] = { name, salesCount: 0, revenue: 0 };
    bySeller[key].salesCount++;
    bySeller[key].revenue += Number(m.total_amount);
  });

  const sellerList = Object.values(bySeller).sort((a, b) => b.revenue - a.revenue);

  if (sellerList.length > 0) {
    autoTable(doc, {
      head: [['#', 'Vendedor', 'Ventas', 'Ingresos USD', 'Ingresos Bs']],
      body: sellerList.map((s, i) => [
        (i + 1).toString(),
        s.name.substring(0, 25),
        s.salesCount.toString(),
        `$${s.revenue.toFixed(2)}`,
        `Bs. ${(s.revenue * exchangeRate).toFixed(2)}`,
      ]),
      startY: 34,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [234, 88, 12] },
    });
  } else {
    doc.setFontSize(10);
    doc.text('No hay ventas registradas en el período', 14, 38);
  }

  // ===== PAGE: GRÁFICOS DE BARRAS =====
  doc.addPage();
  addPageHeader(doc, 'Gráficos Comparativos', 'Visualización de los datos más relevantes del período');

  let chartY = 36;

  // Bar chart 1: Top 10 más vendidos por cantidad
  const topChartItems = top10.slice(0, 8).map(p => ({ label: p.name, value: p.qty }));
  if (topChartItems.length > 0) {
    chartY = drawBarChart(doc, 14, chartY, pageWidth - 28, 120, topChartItems, [22, 163, 74], 'Top Productos Más Vendidos (cantidad)', '');
  }

  // Bar chart 2: Top 10 por ingresos
  const topRevenueItems = [...Object.values(salesByProduct)]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map(p => ({ label: p.name, value: p.revenue }));
  if (topRevenueItems.length > 0) {
    if (chartY > 180) { doc.addPage(); chartY = 20; addPageHeader(doc, 'Gráficos Comparativos (cont.)', ''); chartY = 36; }
    chartY = drawBarChart(doc, 14, chartY, pageWidth - 28, 120, topRevenueItems, [59, 130, 246], 'Top Productos por Ingresos (USD)', '$');
  }

  // Bar chart 3: Vendedores por ingresos
  const sellerChartItems = sellerList.slice(0, 8).map(s => ({ label: s.name, value: s.revenue }));
  if (sellerChartItems.length > 0) {
    if (chartY > 180) { doc.addPage(); chartY = 20; addPageHeader(doc, 'Gráficos Comparativos (cont.)', ''); chartY = 36; }
    chartY = drawBarChart(doc, 14, chartY, pageWidth - 28, 120, sellerChartItems, [234, 88, 12], 'Ingresos por Vendedor (USD)', '$');
  }

  // Bar chart 4: Métodos de pago
  const paymentChartItems = Object.entries(methods)
    .filter(([, v]) => v.count > 0)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([key, v]) => ({ label: key, value: v.amount }));
  if (paymentChartItems.length > 0) {
    if (chartY > 180) { doc.addPage(); chartY = 20; addPageHeader(doc, 'Gráficos Comparativos (cont.)', ''); chartY = 36; }
    chartY = drawBarChart(doc, 14, chartY, pageWidth - 28, 120, paymentChartItems, [139, 92, 246], 'Distribución por Método de Pago (USD)', '$');
  }

  // Bar chart 5: Deudores principales
  const debtorChartItems = debtors.slice(0, 8).map(d => ({ label: d.name, value: d.due }));
  if (debtorChartItems.length > 0) {
    if (chartY > 180) { doc.addPage(); chartY = 20; addPageHeader(doc, 'Gráficos Comparativos (cont.)', ''); chartY = 36; }
    chartY = drawBarChart(doc, 14, chartY, pageWidth - 28, 120, debtorChartItems, [220, 38, 38], 'Principales Deudores — Pendiente (USD)', '$');
  }

  // ===== LAST PAGES: LISTA DE MOVIMIENTOS =====
  doc.addPage();
  addPageHeader(doc, 'Lista de Movimientos', `${movements.length} movimientos del ${format(new Date(startDate), 'dd/MM/yyyy')} al ${format(new Date(endDate), 'dd/MM/yyyy')}`);

  if (movements.length === 0) {
    doc.setFontSize(10);
    doc.text('No hay movimientos en este período', 14, 38);
  } else {
    const movTableData = movements.map(m => [
      format(new Date(m.movement_date), 'dd/MM/yy HH:mm'),
      m.movement_type === 'entrada' ? 'Entrada' : 'Venta',
      m.product?.name?.substring(0, 18) || '—',
      m.quantity.toString(),
      `$${Number(m.unit_price).toFixed(2)}`,
      `$${Number(m.total_amount).toFixed(2)}`,
      `Bs. ${(Number(m.total_amount) * exchangeRate).toFixed(2)}`,
      m.is_credit ? 'Fiado' : '',
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Tipo', 'Producto', 'Cant.', 'P.Unit', 'Total $', 'Total Bs', 'Crédito']],
      body: movTableData,
      startY: 34,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [22, 163, 74] },
      didParseCell: (data: any) => {
        if (data.column.index === 1 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Entrada' ? [59, 130, 246] : [22, 163, 74];
        }
        if (data.column.index === 7 && data.section === 'body' && data.cell.raw === 'Fiado') {
          data.cell.styles.textColor = [234, 179, 8];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    // Totals at the end
    yPos = (doc as any).lastAutoTable?.finalY + 8 || 200;
    if (yPos > 260) { doc.addPage(); yPos = 20; }

    doc.setFontSize(10);
    doc.text(`Total Ventas: $${totalVentas.toFixed(2)} / Bs. ${(totalVentas * exchangeRate).toFixed(2)}`, 14, yPos);
    doc.text(`Total Compras: $${totalCompras.toFixed(2)} / Bs. ${(totalCompras * exchangeRate).toFixed(2)}`, 14, yPos + 6);
    doc.setFontSize(11);
    doc.text(`Balance: ${balance >= 0 ? '+' : ''}$${balance.toFixed(2)} / Bs. ${(balance * exchangeRate).toFixed(2)}`, 14, yPos + 14);
  }

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    doc.text('KioskoApp — Reporte Completo', 14, doc.internal.pageSize.getHeight() - 10);
    doc.setTextColor(0, 0, 0);
  }

  doc.save(`reporte_completo_${startDate}_${endDate}.pdf`);
}
