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
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Product {
  _id: string;
  name: string;
  nameAr: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  sku: string;
  brand?: string;
  isActive: boolean;
  categoryId?: { name: string; nameAr: string };
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
        `/api/products/admin/all?${params.toString()}`,
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/products/admin/all"] });
      toast({ title: "تم حذف المنتج" });
    },
    onError: () => toast({ title: "فشل حذف المنتج", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PUT", `/api/products/${id}`, { isActive }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["/api/products/admin/all"] }),
  });

  const handleDelete = (product: Product) => {
    setDeleteTarget(product);
  };

  return (
    <AdminLayout title="المنتجات" subtitle="إدارة منتجات المتجر">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Category Sidebar */}
        <aside className="hidden lg:block border-r bg-muted/20 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 px-2">الفئات</h2>
          <div className="space-y-1">
            <div
              className={`p-2 rounded-md cursor-pointer font-medium text-sm transition-colors ${
                category === "all"
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setCategory("all")}
            >
              كل المنتجات
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

        {/* Main Content */}
        <main className="p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">المنتجات</h1>
              <p className="text-sm text-muted-foreground mt-1">
                إجمالي: {data?.total || 0} منتج
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`${ADMIN_BASE}/products/add`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> إضافة منتج
                </Button>
              </Link>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المخزون</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      لا توجد منتجات
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
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
                            <p className="font-medium text-sm">
                              {product.nameAr}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.brand || product.sku}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {product.sku}
                      </TableCell>
                      <TableCell className="text-xs">
                        {product.categoryId?.nameAr || "-"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold text-primary">
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
                          variant={
                            product.stock > 0 ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {product.stock} قطعة
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
                        >
                          {product.isActive ? (
                            <ToggleRight className="h-5 w-5 text-foreground" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setQrProduct(product)}
                            title="QR Code"
                          >
                            <QrCode className="h-4 w-4 text-primary" />
                          </Button>
                          <Link
                            href={`${ADMIN_BASE}/products/edit/${product._id}`}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
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
        </main>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> حذف المنتج
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
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
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

// --- Category Tree Components ---

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
    <div
      className={
        level > 0
          ? "space-y-1 pl-4 border-l-2 border-primary/20 ml-4 mt-1"
          : "space-y-1"
      }
    >
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
        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
          isSelected
            ? "border-primary bg-primary/10 text-primary font-semibold"
            : "bg-background hover:bg-muted/50"
        }`}
        onClick={() => onSelect(category._id)}
      >
        <span className="text-sm">{category.nameAr}</span>
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
