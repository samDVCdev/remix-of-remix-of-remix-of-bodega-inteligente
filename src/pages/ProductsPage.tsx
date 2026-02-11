import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Package, Download, FileSpreadsheet, Eye, Scale, Layers, PackagePlus, Upload } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ProductCreateDialog } from "@/components/products/ProductCreateDialog";
import { InventoryEntryDialog } from "@/components/products/InventoryEntryDialog";
import { BulkUploadDialog } from "@/components/products/BulkUploadDialog";
import { ProductDetailDialog } from "@/components/products/ProductDetailDialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { useProductsWithVariants, useDeleteProduct } from "@/hooks/useProducts";
import { usePagination } from "@/hooks/usePagination";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@/types/inventory";
import { cn } from "@/lib/utils";
import { exportProductsToExcel, exportProductsToPDF } from "@/lib/exportUtils";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { isAdmin } = useAuth();

  const { data: products, isLoading } = useProductsWithVariants();
  const deleteProduct = useDeleteProduct();
  const { formatPrice, exchangeRate } = useCurrency();

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
  } = usePagination(filteredProducts, { initialItemsPerPage: 10 });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingProduct) {
      await deleteProduct.mutateAsync(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const getSaleTypeDisplay = (product: Product) => {
    switch (product.sale_type) {
      case 'weight':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
            <Scale className="w-3 h-3" />
            Peso
          </span>
        );
      case 'variants':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <Layers className="w-3 h-3" />
            Multi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            <Package className="w-3 h-3" />
            Unidad
          </span>
        );
    }
  };

  const getPriceDisplay = (product: Product) => {
    switch (product.sale_type) {
      case 'weight':
        const pricePerKilo = product.price_per_kilo || 0;
        return (
          <div>
            <p>${pricePerKilo.toFixed(2)}/kg</p>
            <p className="text-xs text-muted-foreground">Bs. {(pricePerKilo * exchangeRate).toFixed(2)}</p>
          </div>
        );
      case 'variants':
        if (product.variants && product.variants.length > 0) {
          const minPrice = Math.min(...product.variants.map(v => v.price));
          return (
            <div>
              <p>Desde ${minPrice.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Bs. {(minPrice * exchangeRate).toFixed(2)}</p>
            </div>
          );
        }
        return 'Multi-precio';
      default:
        return (
          <div>
            <p>${product.sale_price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Bs. {(product.sale_price * exchangeRate).toFixed(2)}</p>
          </div>
        );
    }
  };

  // Get main package equivalence for display (purchase package - the one with display_order 999)
  const getMainEquivalence = (product: Product) => {
    if (!product.equivalences?.length) return null;
    // Purchase package has display_order 999
    const purchasePackage = product.equivalences.find(e => e.display_order === 999);
    if (purchasePackage) return purchasePackage;
    // Fallback to largest multiplier
    return product.equivalences.reduce((max, e) => 
      e.base_unit_multiplier > (max?.base_unit_multiplier || 0) ? e : max,
      product.equivalences[0]
    );
  };

  const getReadableStock = (product: Product) => {
    const mainPackage = getMainEquivalence(product);
    
    if (product.base_unit === 'gramo') {
      const kilos = Math.floor(product.stock_base_units / 1000);
      const gramos = Math.round(product.stock_base_units % 1000);
      if (kilos > 0 && gramos > 0) {
        return `${kilos}kg ${gramos}g`;
      } else if (kilos > 0) {
        return `${kilos}kg`;
      }
      return `${gramos}g`;
    }
    
    // If we have a main package, show in that format
    if (mainPackage && mainPackage.base_unit_multiplier > 1) {
      const packages = Math.floor(product.stock_base_units / mainPackage.base_unit_multiplier);
      const remainder = Math.round(product.stock_base_units % mainPackage.base_unit_multiplier);
      
      return (
        <div>
          <span className="font-semibold text-primary">{product.stock_base_units} {product.base_unit}s</span>
          <p className="text-xs text-muted-foreground">
            ≈ {packages.toFixed(1)} {mainPackage.unit_name.toUpperCase()}S
          </p>
        </div>
      );
    }
    
    return `${Math.round(product.stock_base_units)} ${product.base_unit}s`;
  };

  const getEquivalenceDisplay = (product: Product) => {
    const mainPackage = getMainEquivalence(product);
    if (!mainPackage || mainPackage.base_unit_multiplier <= 1) return null;
    return `1 ${mainPackage.unit_name.toUpperCase()} = ${mainPackage.base_unit_multiplier} ${product.base_unit.toUpperCase()}`;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                Productos
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {isAdmin ? "Gestiona el catálogo de productos" : "Consulta el catálogo de productos"}
              </p>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => products && exportProductsToExcel(products as Product[])} disabled={!products?.length} className="gap-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => products && exportProductsToPDF(products as Product[])} disabled={!products?.length} className="gap-1">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button variant="secondary" onClick={() => setIsBulkOpen(true)} className="gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Carga Masiva</span>
                </Button>
                <Button variant="secondary" onClick={() => setIsInventoryOpen(true)} className="gap-2">
                  <PackagePlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Ingreso Inventario</span>
                </Button>
                <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nuevo Producto</span>
                </Button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Table */}
        <div className="stat-card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : filteredProducts?.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{search ? "No se encontraron productos" : "No hay productos"}</p>
              {!search && isAdmin && (
                <Button onClick={() => setIsFormOpen(true)} className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />Agregar Producto
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      {isAdmin && <TableHead className="hidden md:table-cell">Estado</TableHead>}
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData?.map((product) => {
                      const isLowStock = product.stock_base_units <= product.low_stock_threshold;
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="max-w-[150px] sm:max-w-[220px]">
                              <p className="font-medium truncate">{product.name}</p>
                              {getEquivalenceDisplay(product as Product) ? (
                                <p className="text-xs text-primary font-medium">
                                  {getEquivalenceDisplay(product as Product)}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">{product.code}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {getSaleTypeDisplay(product as Product)}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-primary">
                            {getPriceDisplay(product as Product)}
                          </TableCell>
                          <TableCell className="text-sm">{getReadableStock(product as Product)}</TableCell>
                          {isAdmin && (
                            <TableCell className="hidden md:table-cell">
                              <span className={cn(isLowStock ? "badge-low-stock" : "badge-in-stock")}>{isLowStock ? "Bajo" : "OK"}</span>
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setViewingProduct(product as Product)}><Eye className="w-4 h-4" /></Button>
                              {isAdmin && <Button variant="ghost" size="icon" onClick={() => handleEdit(product as Product)}><Pencil className="w-4 h-4" /></Button>}
                              {isAdmin && <Button variant="ghost" size="icon" onClick={() => setDeletingProduct(product as Product)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {totalItems > 0 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={onPageChange}
                  onItemsPerPageChange={onItemsPerPageChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      {isAdmin && <ProductCreateDialog open={isFormOpen} onOpenChange={handleFormClose} product={editingProduct} />}
      {isAdmin && <InventoryEntryDialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen} />}
      {isAdmin && <BulkUploadDialog open={isBulkOpen} onOpenChange={setIsBulkOpen} />}
      <ProductDetailDialog open={!!viewingProduct} onOpenChange={() => setViewingProduct(null)} product={viewingProduct} />

      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent className="bg-card mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción eliminará "{deletingProduct?.name}" permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
