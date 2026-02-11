import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { useCreateProduct } from "@/hooks/useProducts";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedProduct {
  row: number;
  name: string;
  measurement_type: "unit" | "weight" | "length" | "volume";
  purchase_package_name: string;
  purchase_package_content: number;
  purchase_price: number;
  initial_stock_packages: number;
  low_stock_quantity: number;
  // For unit-based
  sale_unit_name?: string;
  sale_unit_multiplier?: number;
  sale_price?: number;
  // For measure-based (weight/length/volume)
  price_per_measure_unit?: number;
  // Validation
  errors: string[];
  status: "pending" | "success" | "error";
}

const MEASUREMENT_MAP: Record<string, "unit" | "weight" | "length" | "volume"> = {
  "unidad": "unit",
  "unidades": "unit",
  "unit": "unit",
  "peso": "weight",
  "kilogramo": "weight",
  "kilogramos": "weight",
  "kg": "weight",
  "weight": "weight",
  "longitud": "length",
  "metro": "length",
  "metros": "length",
  "mt": "length",
  "length": "length",
  "volumen": "volume",
  "litro": "volume",
  "litros": "volume",
  "lt": "volume",
  "volume": "volume",
};

const getMeasurementConfig = (type: string) => {
  switch (type) {
    case "weight": return { baseUnit: "gramo", multiplier: 1000 };
    case "length": return { baseUnit: "centimetro", multiplier: 100 };
    case "volume": return { baseUnit: "mililitro", multiplier: 1000 };
    default: return { baseUnit: "unidad", multiplier: 1 };
  }
};

function downloadTemplate() {
  const headers = [
    "Nombre",
    "Tipo Medida (unidad/peso/longitud/volumen)",
    "Nombre Empaque Compra",
    "Contenido por Empaque",
    "Precio Compra ($)",
    "Stock Inicial (Empaques)",
    "Stock Mínimo",
    "Nombre Presentación Venta",
    "Multiplicador (unidades base)",
    "Precio Venta ($)",
    "Precio por Medida ($/kg, $/mt, $/lt)",
  ];

  const examples = [
    ["Harina de Trigo", "unidad", "Bulto", 24, 15, 5, 10, "Unidad", 1, 1.5, ""],
    ["Arroz Premium", "peso", "Saco", 50, 30, 3, 5, "", "", "", 1.2],
    ["Aceite Vegetal", "volumen", "Caja", 12, 18, 4, 6, "", "", "", 2.5],
    ["Cable Eléctrico", "longitud", "Rollo", 100, 25, 2, 10, "", "", "", 0.5],
    ["Jabón en Barra", "unidad", "Caja", 48, 20, 3, 24, "Paquete", 6, 3.5, ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
  
  // Column widths
  ws["!cols"] = [
    { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
    { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 20 },
    { wch: 20 }, { wch: 14 }, { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.writeFile(wb, "plantilla_carga_masiva.xlsx");
}

function parseFile(data: unknown[][]): ParsedProduct[] {
  const products: ParsedProduct[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const errors: string[] = [];
    const name = String(row[0] || "").trim();
    const rawType = String(row[1] || "unidad").trim().toLowerCase();
    const measurement_type = MEASUREMENT_MAP[rawType] || "unit";
    const purchase_package_name = String(row[2] || "Bulto").trim();
    const purchase_package_content = Number(row[3]) || 1;
    const purchase_price = Number(row[4]) || 0;
    const initial_stock_packages = Number(row[5]) || 0;
    const low_stock_quantity = Number(row[6]) || 5;
    const sale_unit_name = String(row[7] || "").trim();
    const sale_unit_multiplier = Number(row[8]) || 1;
    const sale_price = Number(row[9]) || 0;
    const price_per_measure_unit = Number(row[10]) || 0;

    if (!name) errors.push("Nombre vacío");
    if (purchase_package_content <= 0) errors.push("Contenido empaque inválido");
    if (purchase_price < 0) errors.push("Precio compra negativo");

    if (measurement_type === "unit") {
      if (!sale_unit_name) errors.push("Falta presentación de venta");
      if (sale_price <= 0) errors.push("Precio venta requerido");
    } else {
      if (price_per_measure_unit <= 0) errors.push("Precio por medida requerido");
    }

    products.push({
      row: i + 1,
      name,
      measurement_type,
      purchase_package_name,
      purchase_package_content,
      purchase_price,
      initial_stock_packages,
      low_stock_quantity,
      sale_unit_name: sale_unit_name || undefined,
      sale_unit_multiplier,
      sale_price,
      price_per_measure_unit,
      errors,
      status: errors.length > 0 ? "error" : "pending",
    });
  }

  return products;
}

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const createProduct = useCreateProduct();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
      setProducts(parseFile(data));
    };
    reader.readAsBinaryString(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validProducts = products.filter((p) => p.errors.length === 0);
  const invalidProducts = products.filter((p) => p.errors.length > 0);

  const handleUpload = async () => {
    if (validProducts.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validProducts.length; i++) {
      const p = validProducts[i];
      try {
        const config = getMeasurementConfig(p.measurement_type);
        const packageMultiplier = p.purchase_package_content * config.multiplier;
        const code = p.name.substring(0, 3).toUpperCase() + "-" + Date.now().toString().slice(-4) + i;

        const isMeasureBased = p.measurement_type !== "unit";
        const saleType: "unit" | "weight" = isMeasureBased ? "weight" : "unit";
        const pricePerKilo = isMeasureBased ? (p.price_per_measure_unit || 0) : 0;

        const equivalences: Array<{
          unit_name: string;
          base_unit_multiplier: number;
          price: number;
          display_order: number;
        }> = [];

        let salePrice = 0;

        if (!isMeasureBased && p.sale_unit_name) {
          equivalences.push({
            unit_name: p.sale_unit_name,
            base_unit_multiplier: p.sale_unit_multiplier || 1,
            price: p.sale_price || 0,
            display_order: 0,
          });
          salePrice = p.sale_price || 0;
        } else {
          salePrice = pricePerKilo;
        }

        // Purchase package equivalence
        equivalences.push({
          unit_name: p.purchase_package_name,
          base_unit_multiplier: packageMultiplier,
          price: p.purchase_price,
          display_order: 999,
        });

        const initialStockBaseUnits = p.initial_stock_packages * packageMultiplier;
        const perUnitPurchasePrice = packageMultiplier > 0 ? p.purchase_price / packageMultiplier : p.purchase_price;

        // low_stock_threshold in base units
        let lowStockThreshold = p.low_stock_quantity;
        if (isMeasureBased) {
          lowStockThreshold = p.low_stock_quantity * config.multiplier;
        }

        await createProduct.mutateAsync({
          code,
          name: p.name,
          base_unit: config.baseUnit,
          unit: config.baseUnit + "s",
          purchase_price: perUnitPurchasePrice,
          sale_price: salePrice,
          stock_base_units: initialStockBaseUnits,
          low_stock_threshold: lowStockThreshold,
          sale_type: saleType,
          price_per_kilo: pricePerKilo,
          equivalences,
        } as any);

        successCount++;
        p.status = "success";
      } catch {
        errorCount++;
        p.status = "error";
        p.errors.push("Error al guardar");
      }
      setUploadProgress(Math.round(((i + 1) / validProducts.length) * 100));
      setProducts([...products]);
    }

    setIsUploading(false);
    toast.success(`${successCount} productos creados${errorCount > 0 ? `, ${errorCount} con errores` : ""}`);
  };

  const handleClose = (val: boolean) => {
    if (!isUploading) {
      setProducts([]);
      onOpenChange(val);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] bg-card mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Carga Masiva de Productos
          </DialogTitle>
        </DialogHeader>

        {products.length === 0 ? (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-4">
              <div className="p-6 border-2 border-dashed border-muted-foreground/30 rounded-xl">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Sube un archivo Excel (.xlsx) o CSV con los datos de los productos
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                    <Download className="w-4 h-4" />
                    Descargar Plantilla
                  </Button>
                  <label>
                    <Button asChild className="gap-2 cursor-pointer">
                      <span>
                        <Upload className="w-4 h-4" />
                        Seleccionar Archivo
                      </span>
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              <div className="text-left bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-sm mb-2">Instrucciones:</p>
                <p>• <strong>Tipo Medida:</strong> unidad, peso, longitud o volumen</p>
                <p>• <strong>Para productos por unidad:</strong> llena Nombre Presentación, Multiplicador y Precio Venta</p>
                <p>• <strong>Para peso/longitud/volumen:</strong> llena Precio por Medida (última columna)</p>
                <p>• El contenido del empaque se expresa en la unidad de medida (kg, mt, lt o unidades)</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-3 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {validProducts.filter(p => p.status === "success").length > 0
                  ? `${validProducts.filter(p => p.status === "success").length} creados`
                  : `${validProducts.length} válidos`}
              </span>
              {invalidProducts.length > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="w-4 h-4" />
                  {invalidProducts.length} con errores
                </span>
              )}
              {validProducts.filter(p => p.status === "pending").length > 0 && (
                <span className="text-muted-foreground">
                  {validProducts.filter(p => p.status === "pending").length} pendientes
                </span>
              )}
            </div>

            {isUploading && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Empaque</TableHead>
                    <TableHead>Precio Venta</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p, idx) => (
                    <TableRow key={idx} className={p.errors.length > 0 ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{p.row}</TableCell>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-xs">{p.measurement_type}</TableCell>
                      <TableCell className="text-xs">
                        {p.purchase_package_name} ({p.purchase_package_content})
                      </TableCell>
                      <TableCell className="text-xs">
                        {p.measurement_type === "unit"
                          ? `$${p.sale_price?.toFixed(2) || "0"} / ${p.sale_unit_name || "?"}`
                          : `$${p.price_per_measure_unit?.toFixed(2) || "0"} / medida`}
                      </TableCell>
                      <TableCell>
                        {p.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : p.errors.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                            <span className="text-xs text-destructive truncate max-w-[120px]">
                              {p.errors[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pendiente</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setProducts([])} disabled={isUploading}>
                Cambiar archivo
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || validProducts.filter(p => p.status === "pending").length === 0}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Crear {validProducts.filter(p => p.status === "pending").length} Productos
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
