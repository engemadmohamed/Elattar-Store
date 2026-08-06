import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus,
  Edit,
  Trash2,
  QrCode,
  Search,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  ChevronRight,
  FolderTree,
  Filter,
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
  const [category, setCategory] = useState("all");
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/products/admin/all", search, category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      return apiRequest<{ products: Product[]; total: number }>(
        "GET",
        `/api/products/admin/all?${params.toString()}`
      );
    },
  });

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

  const handleDelete = (product: Product) => {
    setDeleteTarget(product);
  };

  return (
    <AdminLayout title="إدارة المنتجات" subtitle="عرض، إضافة، وتحديث كافة المنتجات والمخزون">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        
        {/* Category Filter Sidebar */}
        <aside className="bg-white rounded-3xl border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <h2 className="text-base font-black flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-foreground" /> تصفية بالفئات
            </h2>
            <Badge variant="outline" className="rounded-full text-xs font-bold">
              {categories?.length || 0} فئة
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div
              className={`p-3 rounded-2xl cursor-pointer font-bold text-sm transition-all flex items-center justify-between ${
                category === "all"
                  ? "bg-black text-white shadow-md"
                  : "bg-muted/30 hover:bg-muted/60 text-foreground"
              }`}
              onClick={() => setCategory("all")}
            >
              <span>جميع المنتجات</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                {data?.total || 0}
              </span>
            </div>

            {categories && (
              <CategoryTree
                categories={categories}
                parentId={null}
                onSelect={setCategory}
                selectedId={category}
              />
            )}
          </div>
        </aside>

        {/* Main Products Area */}
        <div className="space-y-6">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border p-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-black">جدول المنتجات</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                إجمالي المنتجات المتاحة: {data?.total || 0} منتج
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`${ADMIN_BASE}/products/add`}>
                <Button className="gap-2 bg-black hover:bg-black/90 text-white font-bold rounded-2xl px-5 shadow-md">
                  <Plus className="h-4 w-4" /> إضافة منتج
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم المنتج أو كود SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-2xl border bg-white shadow-sm h-11 text-sm"
            />
          </div>

          {/* Products Table */}
          <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-foreground">المنتج</TableHead>
                  <TableHead className="font-bold text-foreground">SKU</TableHead>
                  <TableHead className="font-bold text-foreground">الفئة</TableHead>
                  <TableHead className="font-bold text-foreground">السعر</TableHead>
                  <TableHead className="font-bold text-foreground">المخزون</TableHead>
                  <TableHead className="font-bold text-foreground">الحالة</TableHead>
                  <TableHead className="text-right font-bold text-foreground">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full rounded-lg" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground font-medium"
                    >
                      لا توجد منتجات مطابقة للبحث
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.products.map((product) => (
                    <TableRow key={product._id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-2xl bg-muted overflow-hidden shrink-0 border">
                            {product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-lg">
                                📦
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground line-clamp-1">
                              {product.nameAr}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.brand || product.sku}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-mono font-semibold text-muted-foreground">
                        {product.sku}
                      </TableCell>

                      <TableCell className="text-xs font-medium">
                        <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
                          {product.categoryId?.nameAr || "عام"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm font-black text-foreground">
                            {formatPrice(product.salePrice || product.price)}
                          </p>
                          {product.salePrice && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.price)}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                            product.stock > 0
                              ? "bg-black text-white border-black"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          }`}
                        >
                          {product.stock > 0 ? `متوفر ${product.stock} ${getSaleUnitName(product.saleUnit)}` : "نفذت الكمية"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <button
                          onClick={() =>
                            toggleMutation.mutate({
                              id: product._id,
                              isActive: !product.isActive,
                            })
                          }
                          title={product.isActive ? "تعطيل المنتج" : "تفعيل المنتج"}
                        >
                          {product.isActive ? (
                            <ToggleRight className="h-6 w-6 text-black" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                          )}
                        </button>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl hover:bg-black/5"
                            onClick={() => setQrProduct(product)}
                            title="عرض طباعة QR Code"
                          >
                            <QrCode className="h-4 w-4 text-foreground" />
                          </Button>
                          <Link href={`${ADMIN_BASE}/products/edit/${product._id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl hover:bg-black/5"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600 font-black">
                <AlertTriangle className="h-5 w-5" /> تأكيد حذف المنتج
              </DialogTitle>
              <DialogDescription className="text-right pt-2">
                هل أنت متأكد من حذف "<strong>{deleteTarget?.nameAr}</strong>"؟
                <br />
                هذا الإجراء لا يمكن التراجع عنه.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2 sm:gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDeleteTarget(null)}
              >
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

        {/* QR Modal */}
        {qrProduct && (
          <QRModal
            productId={qrProduct._id}
            productName={qrProduct.nameAr}
            productSku={qrProduct.sku}
            price={qrProduct.salePrice || qrProduct.price}
            open={!!qrProduct}
            onClose={() => setQrProduct(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// --- Category Tree Helper ---

interface CategoryTreeProps {
  categories: Category[];
  parentId: string | null;
  onSelect: (id: string) => void;
  selectedId: string;
  level?: number;
}

function CategoryTree({
  categories,
  parentId,
  onSelect,
  selectedId,
  level = 0,
}: CategoryTreeProps) {
  const children = categories.filter((c) => c.parentId === parentId);
  if (!children.length) return null;

  return (
    <div className={level > 0 ? "space-y-1.5 pl-3 border-l-2 border-black/10 ml-2 mt-1" : "space-y-1.5"}>
      {children.map((cat) => (
        <CategoryItem
          key={cat._id}
          category={cat}
          categories={categories}
          onSelect={onSelect}
          selectedId={selectedId}
          level={level}
        />
      ))}
    </div>
  );
}

interface CategoryItemProps {
  category: Category;
  categories: Category[];
  onSelect: (id: string) => void;
  selectedId: string;
  level: number;
}

function CategoryItem({
  category,
  categories,
  onSelect,
  selectedId,
  level,
}: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = categories.some((c) => c.parentId === category._id);
  const isSelected = selectedId === category._id;

  return (
    <div>
      <div
        className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
          isSelected
            ? "border-black bg-black text-white font-bold shadow-sm"
            : "bg-background hover:bg-muted/50 text-foreground"
        }`}
        onClick={() => onSelect(category._id)}
      >
        <span className="text-xs font-semibold">{category.nameAr}</span>
        {hasChildren && (
          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          />
        )}
      </div>
      {isExpanded && hasChildren && (
        <CategoryTree
          categories={categories}
          parentId={category._id}
          onSelect={onSelect}
          selectedId={selectedId}
          level={level + 1}
        />
      )}
    </div>
  );
}
