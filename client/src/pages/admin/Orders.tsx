import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/AdminSidebar";
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
  customerEmail: string;
  items: Array<{
    name: string;
    nameAr: string;
    price: number;
    quantity: number;
    image?: string;
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
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "confirmed", label: "مؤكد", color: "bg-blue-100 text-blue-800" },
  {
    value: "shipped",
    label: "تم الشحن",
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    value: "delivered",
    label: "تم التوصيل",
    color: "bg-green-100 text-green-800",
  },
  { value: "cancelled", label: "ملغي", color: "bg-red-100 text-red-800" },
];

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
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">الطلبات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إجمالي: {data?.total || 0} طلب
          </p>
        </div>

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
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>المجموع</TableHead>
                <TableHead>الشحن</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
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
              ) : groupedOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    لا توجد طلبات
                  </TableCell>
                </TableRow>
              ) : (
                groupedOrders.map((order) => {
                  const sc = getStatusConfig(order.status);
                  return (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono text-xs font-bold">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customerPhone}
                        </p>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {order.shipping?.company}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}
                        >
                          {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(v) =>
                              updateMutation.mutate({
                                id: order._id,
                                status: v,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
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
      </main>

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
              </div>
              <Separator />
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.nameAr} × {item.quantity}
                    </span>
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
              <div>
                <p className="text-sm font-medium mb-2">رقم التتبع (اختياري)</p>
                <div className="flex gap-2">
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="أدخل رقم التتبع..."
                  />
                  <Button
                    onClick={() => {
                      updateMutation.mutate({
                        id: selectedOrder._id,
                        trackingNumber,
                      });
                      setSelectedOrder(null);
                    }}
                  >
                    حفظ
                  </Button>
                </div>
              </div>
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
  );
}
