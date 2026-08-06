import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus,
  Edit,
  Trash2,
  QrCode,
  Search,
  AlertTriangle,
  FolderTree,
  Package,
  Check,
  Percent,
  RefreshCw,
  ExternalLink,
  Layers,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ADMIN_BASE } from "@/lib/admin-path";
import QRModal from "@/components/QRModal";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice, getSaleUnitName } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Product {
  _id: string;
  name: string;
  nameAr: string;
  price: number;
  salePrice?: number;
  stock: number;
  saleUnit?: string;
  images: string[];
  sku: string;
  brand?: string;
  isActive: boolean;
  categoryId?: { _id?: string; name?: string; nameAr?: string };
}

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  parentId: string | null;
}

export default function AdminProducts() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/products/admin/all", search, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      return apiRequest<{ products: Product[]; total: number }>(
        "GET",
        `/api/products/admin/all?${params.toString()}`
      );
    },
  });

  const products = data?.products || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/products/admin/all"] });
      toast({ title: "تم حذف المنتج بنجاح ✓" });
    },
    onError: () => toast({ title: "فشل حذف المنتج", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PUT", `/api/products/${id}`, { isActive }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["/api/products/admin/all"] }),
  });

  const regenerateQrMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/products/admin/regenerate-qr"),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["/api/products/admin/all"] });
      toast({ title: `✅ ${res?.message || "تم تحديث QR Codes بنجاح"}` });
    },
    onError: () => toast({ title: "فشل تحديث QR Codes", variant: "destructive" }),
  });

  const activeProducts = products.filter((p) => p.isActive).length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const discounted = products.filter((p) => p.salePrice && p.salePrice < p.price).length;

  return (
    <AdminLayout title="إدارة المنتجات والمخزون" subtitle="عرض، إضافة، وتحديث كافة منتجات المتجر بأسلوب عصري">
      <div className="space-y-6 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center shrink-0">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">إجمالي المنتجات</p>
                <h3 className="text-2xl font-black">{data?.total || products.length}</h3>
              </div>
            </div>
            <Link href={`${ADMIN_BASE}/products/add`}>
              <Button size="sm" className="rounded-xl font-bold gap-1 bg-black text-white hover:bg-black/90">
                <Plus className="h-4 w-4" /> إضافة منتج
              </Button>
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">منتجات معروضة</p>
              <h3 className="text-2xl font-black">{activeProducts}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">نفذت من المخزون</p>
              <h3 className="text-2xl font-black">{outOfStock}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Percent className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">منتجات مخفضة</p>
              <h3 className="text-2xl font-black">{discounted}</h3>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-3 rounded-2xl border">
          <div className="flex items-center gap-3 flex-1">
            <Search className="h-5 w-5 text-muted-foreground shrink-0 ms-2" />
            <Input
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 text-sm"
            />
          </div>

          {/* Category Filter dropdown */}
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-xl border bg-background px-3 text-xs font-semibold focus:outline-none"
            >
              <option value="all">جميع الفئات</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nameAr}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => regenerateQrMutation.mutate()}
              disabled={regenerateQrMutation.isPending}
              className="rounded-xl text-xs gap-1 font-bold"
              title="إعادة توليد كافة رموز QR للمنتجات"
            >
              <RefreshCw className="h-3.5 w-3.5" /> QR Codes
            </Button>
          </div>
        </div>

        {/* Products Table Card */}
        <div className="bg-card border rounded-3xl overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-lg">لا توجد منتجات مطابقة</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">جرب البحث بكلمات أخرى أو اختر فئة مختلفة</p>
              <Link href={`${ADMIN_BASE}/products/add`}>
                <Button size="sm" className="rounded-xl font-bold gap-1 bg-black text-white">
                  <Plus className="h-4 w-4" /> إضافة منتج جديد
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-extrabold text-right">المنتج</TableHead>
                  <TableHead className="font-extrabold text-right">الفئة</TableHead>
                  <TableHead className="font-extrabold text-right">السعر</TableHead>
                  <TableHead className="font-extrabold text-right">المخزون والوحدة</TableHead>
                  <TableHead className="font-extrabold text-center">الحالة</TableHead>
                  <TableHead className="font-extrabold text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const categoryName =
                    typeof product.categoryId === "object" && product.categoryId !== null
                      ? product.categoryId.nameAr
                      : "غير مصنف";
                  const hasDiscount = product.salePrice && product.salePrice < product.price;

                  return (
                    <TableRow key={product._id} className="hover:bg-muted/20 transition-colors">
                      {/* Product Name & Image */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0 border">
                            <img
                              src={product.images?.[0] || "/mohandes-logo.png"}
                              alt={product.nameAr}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-extrabold text-sm leading-tight text-foreground">
                              {product.nameAr || product.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              رمز: {product.sku} {product.brand && `• ${product.brand}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge variant="outline" className="rounded-xl text-xs font-semibold">
                          {categoryName}
                        </Badge>
                      </TableCell>

                      {/* Price & Discount */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-sm">
                            {formatPrice(product.salePrice || product.price)}
                          </p>
                          {hasDiscount && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.price)}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Stock & Unit */}
                      <TableCell>
                        <Badge
                          variant={product.stock > 0 ? "default" : "destructive"}
                          className="rounded-full text-xs font-bold px-3 py-0.5"
                        >
                          {product.stock > 0
                            ? `متوفر ${product.stock} ${getSaleUnitName(product.saleUnit)}`
                            : "نفذت الكمية"}
                        </Badge>
                      </TableCell>

                      {/* Active Status Toggle */}
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            toggleMutation.mutate({
                              id: product._id,
                              isActive: !product.isActive,
                            })
                          }
                          className={`rounded-xl text-xs font-bold ${
                            product.isActive ? "text-emerald-600" : "text-muted-foreground"
                          }`}
                        >
                          {product.isActive ? "معروض" : "مخفي"}
                        </Button>
                      </TableCell>

                      {/* Action buttons */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setQrProduct(product)}
                            className="h-8 w-8 rounded-xl"
                            title="رمز QR"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>

                          <Link href={`${ADMIN_BASE}/products/edit/${product._id}`}>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" title="تعديل">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(product)}
                            className="h-8 w-8 rounded-xl text-rose-600 hover:bg-rose-50"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* QR Code Dialog */}
        {qrProduct && (
          <QRModal
            open={!!qrProduct}
            onOpenChange={() => setQrProduct(null)}
            productName={qrProduct.nameAr || qrProduct.name}
            sku={qrProduct.sku}
            price={qrProduct.salePrice || qrProduct.price}
            barcode={qrProduct.barcode}
            qrCodeData={qrProduct.images?.[0] || ""}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600 font-black">
                <AlertTriangle className="h-5 w-5" /> تأكيد حذف المنتج
              </DialogTitle>
              <DialogDescription className="text-right pt-2">
                هل أنت متأكد من حذف المنتج "<strong>{deleteTarget?.nameAr}</strong>" نهائياً؟
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2 sm:gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteTarget(null)}>
                إلغاء
              </Button>
              <Button
                variant="destructive"
                className="flex-1 font-bold rounded-xl bg-rose-600 hover:bg-rose-700"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deleteTarget) {
                    deleteMutation.mutate(deleteTarget._id);
                    setDeleteTarget(null);
                  }
                }}
              >
                {deleteMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
