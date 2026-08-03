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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Eye, Search } from "lucide-react";
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

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "قيد الانتظار",
    color: "bg-foreground/8 text-foreground border border-foreground/20",
  },
  { value: "confirmed", label: "مؤكد", color: "bg-foreground/18 text-foreground border border-foreground/28" },
  {
    value: "shipped",
    label: "تم الشحن",
    color: "bg-foreground/28 text-foreground border border-foreground/38",
  },
  {
    value: "delivered",
    label: "تم التوصيل",
    color: "bg-foreground text-background",
  },
  { value: "cancelled", label: "ملغي", color: "bg-destructive/10 text-destructive border border-destructive/25" },
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
  const [group, setGroup] = useState<"pending" | "shipped" | "cancelled">(
    "pending",
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");

  const GROUPS: Record<string, string[]> = {
    pending: ["pending", "confirmed"],
    shipped: ["shipped", "delivered"],
    cancelled: ["cancelled"],
  };

  const { data, isLoading } = useQuery({
    queryKey: ["/api/orders", statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      return apiRequest<{ orders: Order[]; total: number }>(
        "GET",
        `/api/orders?${params}`,
      );
    },
  });

  const groupedOrders = (data?.orders || []).filter((o) =>
    statusFilter !== "all" ? true : GROUPS[group].includes(o.status),
  );

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
      toast({ title: "تم تحديث الطلب ✓" });
    },
    onError: () => toast({ title: "فشل تحديث الطلب", variant: "destructive" }),
  });

  const getStatusConfig = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status) || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };

  return (
    <AdminLayout title="الطلبات" subtitle={`إجمالي: ${data?.total || 0} طلب`}>
      <div className="space-y-6">

        {/* Status group tabs */}
        <Tabs
          value={statusFilter === "all" ? group : "custom"}
          onValueChange={(v) => {
            setGroup(v as typeof group);
            setStatusFilter("all");
          }}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="pending">قيد المراجعة</TabsTrigger>
            <TabsTrigger value="shipped">تم الشحن</TabsTrigger>
            <TabsTrigger value="cancelled">ملغي</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">حسب التبويب أعلاه</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-extrabold text-foreground text-right">رقم الطلب</TableHead>
                <TableHead className="font-extrabold text-foreground text-right">العميل</TableHead>
                <TableHead className="font-extrabold text-foreground text-right">المنتجات المطلوبة</TableHead>
                <TableHead className="font-extrabold text-foreground text-center">الإجمالي</TableHead>
                <TableHead className="font-extrabold text-foreground text-center">الحالة</TableHead>
                <TableHead className="font-extrabold text-foreground text-center">التاريخ</TableHead>
                <TableHead className="font-extrabold text-foreground text-left">إجراءات</TableHead>
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
              ) : groupedOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground font-semibold"
                  >
                    لا توجد طلبات
                  </TableCell>
                </TableRow>
              ) : (
                groupedOrders.map((order) => {
                  const sc = getStatusConfig(order.status);
                  return (
                    <TableRow key={order._id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-mono text-xs font-black text-right align-middle">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-right align-middle">
                        <p className="text-sm font-bold leading-tight">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {order.customerPhone}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[280px] text-right align-middle">
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs">
                              <span className="font-bold text-foreground truncate">
                                {item.nameAr}
                              </span>
                              <span className="text-muted-foreground font-mono font-semibold">
                                ({item.quantity}×)
                              </span>
                              {item.color && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted font-bold border-foreground/20">
                                  {item.color}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-sm text-foreground text-center align-middle whitespace-nowrap">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell className="text-center align-middle whitespace-nowrap">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-extrabold inline-block ${sc.color}`}
                        >
                          {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-semibold text-center align-middle whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-left align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(v) =>
                              updateMutation.mutate({
                                id: order._id,
                                status: v,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-36 text-xs font-semibold rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s.value} value={s.value} className="text-xs font-medium">
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-xl shrink-0"
                            onClick={() => {
                              setSelectedOrder(order);
                              setTrackingNumber(
                                order.shipping?.trackingNumber || "",
                              );
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>طلب رقم: {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">العميل</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">الهاتف</p>
                  <p className="font-medium">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">المحافظة</p>
                  <p className="font-medium">
                    {selectedOrder.shipping?.governorate}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">المدينة</p>
                  <p className="font-medium">{selectedOrder.shipping?.city}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">العنوان</p>
                  <p className="font-medium">
                    {selectedOrder.shipping?.address}
                  </p>
                </div>
                {selectedOrder.customerLibraryName && (
                  <div>
                    <p className="text-muted-foreground">اسم المكتبة</p>
                    <p className="font-medium">
                      {selectedOrder.customerLibraryName}
                    </p>
                  </div>
                )}
                {selectedOrder.customerLibraryLocation && (
                  <div>
                    <p className="text-muted-foreground">موقع المكتبة</p>
                    <p className="font-medium">
                      {selectedOrder.customerLibraryLocation}
                    </p>
                  </div>
                )}
                {selectedOrder.transferScreenshotUrl && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">إثبات التحويل</p>
                    <a
                      href={selectedOrder.transferScreenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={selectedOrder.transferScreenshotUrl}
                        alt="إثبات التحويل"
                        className="mt-1 h-24 w-24 rounded-lg border object-cover"
                      />
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">طريقة الدفع</p>
                  <p className="font-medium">
                    {paymentMethodLabels[selectedOrder.paymentMethod] ||
                      selectedOrder.paymentMethod}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>
                        {item.nameAr} × {item.quantity}
                      </span>
                      {item.color && (
                        <Badge variant="outline" className="text-xs bg-muted font-bold">
                          اللون: {item.color}
                        </Badge>
                      )}
                    </div>
                    <span className="font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span>الشحن</span>
                  <span>{formatPrice(selectedOrder.shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>الإجمالي</span>
                  <span className="text-primary">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>
              <Separator />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <InvoicePrint
        order={invoiceOrder}
        open={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />
      </div>
    </AdminLayout>
  );
}
