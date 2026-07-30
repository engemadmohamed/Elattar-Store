import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Receipt, ArrowRight, Printer, Search } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import InvoicePrint from "@/components/InvoicePrint";

interface CustomerSummary {
  _id: string; // phone number
  customerName: string;
  customerPhone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

interface OrderItem {
  nameAr: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  shipping?: {
    company?: string;
    address?: string;
    city?: string;
    governorate?: string;
    trackingNumber?: string;
  };
  createdAt: string;
  customerLibraryName?: string;
  customerLibraryLocation?: string;
}

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "تم التأكيد",
  processing: "جاري التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

export default function AdminInvoices() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery<CustomerSummary[]>({
    queryKey: ["/api/orders/customers/summary"],
    queryFn: () => apiRequest("GET", "/api/orders/customers/summary"),
  });

  const { data: customerOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/customers", selectedPhone],
    queryFn: () =>
      apiRequest(
        "GET",
        `/api/orders/customers/${encodeURIComponent(selectedPhone!)}`,
      ),
    enabled: !!selectedPhone,
  });

  const searchMutation = useMutation({
    mutationFn: (orderNumber: string) =>
      apiRequest<{ orders: Order[] }>(
        "GET",
        `/api/orders?search=${orderNumber}&limit=1`,
      ),
    onSuccess: (data) => {
      if (data.orders.length > 0) {
        setInvoiceOrder(data.orders[0]);
      } else {
        toast({ title: "لم يتم العثور على الطلب", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "فشل البحث عن الطلب", variant: "destructive" });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderSearch.trim()) searchMutation.mutate(orderSearch.trim());
  };

  const selectedCustomer = customers?.find((c) => c._id === selectedPhone);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          {selectedPhone && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedPhone(null)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {selectedPhone
              ? `فواتير ${selectedCustomer?.customerName || selectedPhone}`
              : "فواتير العملاء"}
          </h1>
        </div>

        {!selectedPhone ? (
          <>
            <form
              onSubmit={handleSearch}
              className="mb-4 flex items-center gap-2"
            >
              <div className="relative flex-grow max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث عن فاتورة برقم الطلب..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={searchMutation.isPending}>
                {searchMutation.isPending ? "جاري البحث..." : "بحث"}
              </Button>
            </form>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>العميل</TableHead>
                        <TableHead>الهاتف</TableHead>
                        <TableHead>عدد الطلبات</TableHead>
                        <TableHead>إجمالي المشتريات</TableHead>
                        <TableHead>آخر طلب</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers?.map((c) => (
                        <TableRow
                          key={c._id}
                          className="cursor-pointer"
                          onClick={() => setSelectedPhone(c._id)}
                        >
                          <TableCell>
                            <p className="font-medium text-sm">
                              {c.customerName}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm">
                            {c.customerPhone}
                          </TableCell>
                          <TableCell className="text-sm">
                            {c.ordersCount}
                          </TableCell>
                          <TableCell className="text-sm font-semibold">
                            {formatPrice(c.totalSpent)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(c.lastOrderDate).toLocaleDateString(
                              "ar-EG",
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {customers && customers.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground py-8"
                          >
                            لا يوجد عملاء بعد
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        ) : ordersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {customerOrders?.map((order) => (
              <Card key={order._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-sm">
                        فاتورة #{order.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="secondary">
                        {statusLabels[order.status] || order.status}
                      </Badge>
                      <Badge
                        variant={
                          order.paymentStatus === "paid" ? "default" : "outline"
                        }
                      >
                        {order.paymentStatus === "paid"
                          ? "مدفوع"
                          : "لم يُدفع بعد"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setInvoiceOrder(order)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm space-y-1 mb-3">
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-muted-foreground"
                      >
                        <span>
                          {item.nameAr} × {item.quantity}
                        </span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-semibold text-sm pt-2 border-t">
                    <span>الإجمالي</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <InvoicePrint
        order={invoiceOrder}
        open={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />
    </div>
  );
}
