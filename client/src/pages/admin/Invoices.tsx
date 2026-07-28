import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Receipt, ArrowRight, Printer } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import InvoicePrint from "@/components/InvoicePrint";

interface CustomerSummary {
  _id: string; // email
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
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  shipping?: { company?: string; address?: string; city?: string; governorate?: string; trackingNumber?: string };
  createdAt: string;
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
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  const { data: customers, isLoading } = useQuery<CustomerSummary[]>({
    queryKey: ["/api/orders/customers/summary"],
    queryFn: () => apiRequest("GET", "/api/orders/customers/summary"),
  });

  const { data: customerOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/customers", selectedEmail],
    queryFn: () => apiRequest("GET", `/api/orders/customers/${encodeURIComponent(selectedEmail!)}`),
    enabled: !!selectedEmail,
  });

  const selectedCustomer = customers?.find((c) => c._id === selectedEmail);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          {selectedEmail && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedEmail(null)}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {selectedEmail ? `فواتير ${selectedCustomer?.customerName || selectedEmail}` : "فواتير العملاء"}
          </h1>
        </div>

        {!selectedEmail ? (
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
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
                      <TableRow key={c._id} className="cursor-pointer" onClick={() => setSelectedEmail(c._id)}>
                        <TableCell>
                          <p className="font-medium text-sm">{c.customerName}</p>
                          <p className="text-xs text-muted-foreground">{c._id}</p>
                        </TableCell>
                        <TableCell className="text-sm">{c.customerPhone}</TableCell>
                        <TableCell className="text-sm">{c.ordersCount}</TableCell>
                        <TableCell className="text-sm font-semibold">{formatPrice(c.totalSpent)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(c.lastOrderDate).toLocaleDateString("ar-EG")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {customers && customers.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا يوجد عملاء بعد</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : ordersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {customerOrders?.map((order) => (
              <Card key={order._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-sm">فاتورة #{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="secondary">{statusLabels[order.status] || order.status}</Badge>
                      <Badge variant={order.paymentStatus === "paid" ? "default" : "outline"}>
                        {order.paymentStatus === "paid" ? "مدفوع" : "لم يُدفع بعد"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setInvoiceOrder(order)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm space-y-1 mb-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-muted-foreground">
                        <span>{item.nameAr} × {item.quantity}</span>
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

      <InvoicePrint order={invoiceOrder} open={!!invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  );
}
