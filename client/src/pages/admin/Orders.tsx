import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  Search,
  ShoppingBag,
  Clock,
  Truck,
  XCircle,
  FolderTree,
  Printer,
  CheckCircle,
} from "lucide-react";
import InvoicePrint from "@/components/InvoicePrint";

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: Array<{
    name: string;
    nameAr: string;
    price: number;
    quantity: number;
    image?: string;
    color?: string;
    productId?: string;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  transferScreenshotUrl?: string;
  shipping: {
    company: string;
    trackingNumber?: string;
    recipientName: string;
    address: string;
    city: string;
    governorate: string;
  };
  notes?: string;
  createdAt: string;
  customerLibraryName?: string;
  customerLibraryLocation?: string;
}

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  parentId: string | null;
}

interface Product {
  _id: string;
  name: string;
  nameAr: string;
  categoryId?: any;
}

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "قيد الانتظار",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  },
  {
    value: "confirmed",
    label: "مؤكد",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  },
  {
    value: "shipped",
    label: "تم الشحن",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
  },
  {
    value: "delivered",
    label: "تم التوصيل",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  },
  {
    value: "cancelled",
    label: "ملغي",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  },
];

const paymentMethodLabels: Record<string, string> = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "حساب بنكي",
  instapay: "إنستاباي",
  vodafone_cash: "فودافون كاش",
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRootCat, setSelectedRootCat] = useState("all");
  const [selectedSubcat, setSelectedSubcat] = useState("all");
  const [group, setGroup] = useState<"all" | "pending" | "shipped" | "cancelled">("all");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");

  const GROUPS: Record<string, string[]> = {
    all: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    pending: ["pending", "confirmed"],
    shipped: ["shipped", "delivered"],
    cancelled: ["cancelled"],
  };

  // Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  // Fetch Products for Category Filtering
  const { data: productsData } = useQuery<any>({
    queryKey: ["/api/products"],
    queryFn: () => apiRequest("GET", "/api/products"),
  });

  const products: Product[] = Array.isArray(productsData)
    ? productsData
    : productsData?.products || [];

  // Fetch Orders
  const { data, isLoading } = useQuery({
    queryKey: ["/api/orders", statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "200" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      return apiRequest<{ orders: Order[]; total: number }>(
        "GET",
        `/api/orders?${params.toString()}`
      );
    },
  });

  const allOrders = data?.orders || [];

  // Calculate Category Filter matches
  const rootCategories = categories.filter((c) => !c.parentId);
  const subcategories = categories.filter(
    (c) => selectedRootCat !== "all" && c.parentId === selectedRootCat
  );

  const activeCategoryParam =
    selectedSubcat !== "all"
      ? selectedSubcat
      : selectedRootCat !== "all"
      ? selectedRootCat
      : "all";

  // Filter orders by active Category Selection if set
  const filteredOrders = allOrders.filter((order) => {
    // Group / Tab Status Filter
    if (statusFilter === "all" && group !== "all" && !GROUPS[group].includes(order.status)) {
      return false;
    }

    // Category Filter
    if (activeCategoryParam !== "all") {
      // Find all category IDs under activeCategoryParam
      const descendantIds = new Set<string>([activeCategoryParam]);
      const queue = [activeCategoryParam];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = categories.filter((c) => {
          if (!c.parentId) return false;
          const pId = typeof c.parentId === "object"
            ? String((c.parentId as any)._id || c.parentId)
            : String(c.parentId);
          return pId === current;
        });
        for (const child of children) {
          const childId = String(child._id);
          if (!descendantIds.has(childId)) {
            descendantIds.add(childId);
            queue.push(childId);
          }
        }
      }

      // Find matching products
      const matchingProducts = products.filter((p) => {
        if (!p.categoryId) return false;
        const rawCatId = typeof p.categoryId === "object"
          ? String((p.categoryId as any)._id || p.categoryId)
          : String(p.categoryId);
        return descendantIds.has(rawCatId);
      });

      const matchingNames = new Set(
        matchingProducts.map((p) => (p.nameAr || p.name).toLowerCase())
      );
      const matchingProdIds = new Set(matchingProducts.map((p) => String(p._id)));

      // Check if order contains any item from matching products
      const hasCategoryItem = order.items.some((item) => {
        if (item.productId && matchingProdIds.has(String(item.productId))) return true;
        const itemName = (item.nameAr || item.name || "").toLowerCase();
        return Array.from(matchingNames).some((mName) => itemName.includes(mName) || mName.includes(itemName));
      });

      if (!hasCategoryItem) return false;
    }

    return true;
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
      paymentStatus,
      trackingNumber,
    }: {
      id: string;
      status?: string;
      paymentStatus?: string;
      trackingNumber?: string;
    }) =>
      apiRequest("PUT", `/api/orders/${id}/status`, {
        status,
        paymentStatus,
        trackingNumber,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "تم تحديث الطلب بنجاح ✓" });
    },
    onError: () => toast({ title: "فشل تحديث الطلب", variant: "destructive" }),
  });

  const getStatusConfig = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status) || {
      label: status,
      color: "bg-muted text-foreground",
    };

  const pendingCount = allOrders.filter((o) => GROUPS.pending.includes(o.status)).length;
  const shippedCount = allOrders.filter((o) => GROUPS.shipped.includes(o.status)).length;
  const cancelledCount = allOrders.filter((o) => GROUPS.cancelled.includes(o.status)).length;

  return (
    <AdminLayout title="إدارة الطلبات" subtitle="استعراض ومتابعة حالات طلبات العملاء وتصنيفها حسب الفئات">
      <div className="space-y-6 pb-12">
        {/* Stats Grid Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center shrink-0">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">إجمالي الطلبات</p>
                <h3 className="text-2xl font-black">{data?.total || allOrders.length}</h3>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">قيد المراجعة والانتظار</p>
              <h3 className="text-2xl font-black">{pendingCount}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">تم الشحن والتوصيل</p>
              <h3 className="text-2xl font-black">{shippedCount}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">طلبات ملغاة</p>
              <h3 className="text-2xl font-black">{cancelledCount}</h3>
            </div>
          </div>
        </div>

        {/* Status Group Tabs */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Tabs
            value={statusFilter === "all" ? group : "custom"}
            onValueChange={(v) => {
              setGroup(v as typeof group);
              setStatusFilter("all");
            }}
            className="w-full sm:w-auto"
          >
            <TabsList className="rounded-2xl p-1 bg-card border">
              <TabsTrigger value="all" className="rounded-xl text-xs font-bold px-4 py-2">
                كافة الطلبات ({allOrders.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-xl text-xs font-bold px-4 py-2">
                قيد المراجعة ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="shipped" className="rounded-xl text-xs font-bold px-4 py-2">
                تم الشحن ({shippedCount})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-xl text-xs font-bold px-4 py-2">
                ملغي ({cancelledCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 rounded-xl h-10 border bg-card font-semibold text-xs">
              <SelectValue placeholder="حالة الطلب" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">جميع الحالات</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-3 rounded-2xl border shadow-xs">
          <div className="flex items-center gap-3 flex-1">
            <Search className="h-5 w-5 text-muted-foreground shrink-0 ms-2" />
            <Input
              placeholder="ابحث برقم الطلب، اسم العميل، أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 text-sm"
            />
          </div>

          {/* 2-Level Category Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={selectedRootCat}
                onChange={(e) => {
                  setSelectedRootCat(e.target.value);
                  setSelectedSubcat("all");
                }}
                className="h-10 rounded-xl border bg-background px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="all">تصنيف الطلبات حسب كافة الفئات</option>
                {rootCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {selectedRootCat !== "all" && subcategories.length > 0 && (
              <div className="flex items-center gap-2 animate-fade-in-up">
                <span className="text-xs font-bold text-muted-foreground">الفئة الفرعية:</span>
                <select
                  value={selectedSubcat}
                  onChange={(e) => setSelectedSubcat(e.target.value)}
                  className="h-10 rounded-xl border bg-background px-3 text-xs font-semibold focus:outline-none"
                >
                  <option value="all">كافة الفئات الفرعية</option>
                  {subcategories.map((sc) => (
                    <option key={sc._id} value={sc._id}>
                      {sc.nameAr}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="bg-card border rounded-3xl overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-lg">لا توجد طلبات مطابقة</h3>
              <p className="text-xs text-muted-foreground mt-1">جرب البحث بكلمات أخرى أو اختر فئة مختلفة</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-extrabold text-right">رقم الطلب والتاريخ</TableHead>
                  <TableHead className="font-extrabold text-right">العميل والمكتبة</TableHead>
                  <TableHead className="font-extrabold text-right">الإجمالي والدفع</TableHead>
                  <TableHead className="font-extrabold text-center">حالة الطلب</TableHead>
                  <TableHead className="font-extrabold text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  return (
                    <TableRow key={order._id} className="hover:bg-muted/20 transition-colors">
                      {/* Order Number & Date */}
                      <TableCell>
                        <div>
                          <p className="font-black text-sm text-foreground">{order.orderNumber}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDate(order.createdAt)} • {order.items.length} منتج
                          </p>
                        </div>
                      </TableCell>

                      {/* Customer & Library Info */}
                      <TableCell>
                        <div>
                          <p className="font-extrabold text-sm">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{order.customerPhone}</p>
                          {order.customerLibraryName && (
                            <Badge variant="outline" className="mt-1 text-[10px] rounded-lg">
                              📚 {order.customerLibraryName}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Total & Payment Method */}
                      <TableCell>
                        <div>
                          <p className="font-black text-sm text-foreground">{formatPrice(order.total)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                          </p>
                        </div>
                      </TableCell>

                      {/* Status Selector */}
                      <TableCell className="text-center">
                        <Select
                          value={order.status}
                          onValueChange={(status) => updateMutation.mutate({ id: order._id, status })}
                        >
                          <SelectTrigger className={`h-8 rounded-xl text-xs font-bold mx-auto border-0 w-32 ${statusConfig.color}`}>
                            <SelectValue>{statusConfig.label}</SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedOrder(order)}
                            className="rounded-xl h-8 text-xs font-bold gap-1"
                            title="تفاصيل الطلب"
                          >
                            <Eye className="h-4 w-4" /> التفاصيل
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setInvoiceOrder(order)}
                            className="rounded-xl h-8 w-8"
                            title="طباعة الفاتورة"
                          >
                            <Printer className="h-4 w-4" />
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

        {/* Order Details Dialog */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-black text-xl flex items-center justify-between">
                  <span>طلب رقم: {selectedOrder.orderNumber}</span>
                  <Badge variant="outline" className="text-xs font-bold rounded-xl">
                    {formatDate(selectedOrder.createdAt)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 pt-2">
                {/* Customer Details */}
                <div className="bg-muted/20 p-4 rounded-2xl border space-y-2 text-xs">
                  <h4 className="font-extrabold text-sm mb-2">بيانات العميل والشحن:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <p><span className="text-muted-foreground">الاسم:</span> <strong>{selectedOrder.customerName}</strong></p>
                    <p><span className="text-muted-foreground">الهاتف:</span> <strong>{selectedOrder.customerPhone}</strong></p>
                    <p><span className="text-muted-foreground">المحافظة والمدينة:</span> <strong>{selectedOrder.shipping?.governorate} - {selectedOrder.shipping?.city}</strong></p>
                    <p><span className="text-muted-foreground">العنوان:</span> <strong>{selectedOrder.shipping?.address}</strong></p>
                    {selectedOrder.customerLibraryName && (
                      <p className="col-span-2"><span className="text-muted-foreground">اسم المكتبة:</span> <strong>{selectedOrder.customerLibraryName} ({selectedOrder.customerLibraryLocation})</strong></p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm">المنتجات المطلوبة ({selectedOrder.items.length}):</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-card border text-xs">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img src={item.image} alt={item.nameAr} className="h-10 w-10 rounded-xl object-cover border" />
                          )}
                          <div>
                            <p className="font-bold text-sm">{item.nameAr || item.name}</p>
                            <p className="text-muted-foreground">{item.quantity} × {formatPrice(item.price)}</p>
                          </div>
                        </div>
                        <span className="font-extrabold text-sm">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>المجموع الفرعي:</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>مصاريف الشحن:</span>
                    <span>{formatPrice(selectedOrder.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between font-black text-base text-foreground pt-2 border-t">
                    <span>الإجمالي النهائي:</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Invoice Printable Dialog */}
        {invoiceOrder && (
          <Dialog open={!!invoiceOrder} onOpenChange={() => setInvoiceOrder(null)}>
            <DialogContent className="max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
              <InvoicePrint order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}
