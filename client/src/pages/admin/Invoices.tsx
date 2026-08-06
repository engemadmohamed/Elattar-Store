import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Receipt,
  ArrowRight,
  Printer,
  Search,
  Users,
  DollarSign,
  CheckCircle,
  FolderTree,
  FileText,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
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
import { formatPrice, formatDate } from "@/lib/utils";
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

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  parentId: string | null;
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
  const [selectedRootCat, setSelectedRootCat] = useState("all");
  const [selectedSubcat, setSelectedSubcat] = useState("all");

  const { toast } = useToast();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const { data: customers = [], isLoading } = useQuery<CustomerSummary[]>({
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

  const rootCategories = categories.filter((c) => !c.parentId);
  const subcategories = categories.filter(
    (c) => selectedRootCat !== "all" && c.parentId === selectedRootCat
  );

  const filteredCustomers = customers.filter((c) => {
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.customerPhone.includes(q)
    );
  });

  const selectedCustomer = customers?.find((c) => c._id === selectedPhone);
  const totalInvoicesCount = customers.reduce((acc, c) => acc + c.ordersCount, 0);
  const totalSalesRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);

  return (
    <AdminLayout title="الفواتير">
      <div className="space-y-6 pb-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي العملاء المسجلين</p>
              <h3 className="text-2xl font-black">{customers.length} عميل</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي الفواتير الصادرة</p>
              <h3 className="text-2xl font-black">{totalInvoicesCount} فاتورة</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي حجم المشتريات</p>
              <h3 className="text-2xl font-black">{formatPrice(totalSalesRevenue)}</h3>
            </div>
          </div>
        </div>

        {/* Selected Customer Header */}
        {selectedPhone && (
          <div className="flex items-center justify-between bg-card p-4 rounded-2xl border shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPhone(null)}
                className="rounded-xl gap-1 font-bold text-xs"
              >
                <ArrowRight className="h-4 w-4" /> العودة لقائمة العملاء
              </Button>
              <div>
                <h3 className="font-extrabold text-base">
                  فواتير العميل: {selectedCustomer?.customerName || selectedPhone}
                </h3>
                <p className="text-xs text-muted-foreground">
                  هاتف: {selectedCustomer?.customerPhone} • إجمالي المشتريات: {formatPrice(selectedCustomer?.totalSpent || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {!selectedPhone ? (
          <>
            {/* Search & Filter controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-3 rounded-2xl border shadow-xs">
              <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1">
                <Search className="h-5 w-5 text-muted-foreground shrink-0 ms-2" />
                <Input
                  placeholder="ابحث عن عميل بالاسم، الهاتف، أو رقم الفاتورة..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="border-0 shadow-none focus-visible:ring-0 text-sm"
                />
                <Button type="submit" size="sm" disabled={searchMutation.isPending} className="rounded-xl font-bold bg-black text-white shrink-0">
                  {searchMutation.isPending ? "جاري البحث..." : "بحث عن فاتورة"}
                </Button>
              </form>

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
                    <option value="all">كافة فئات الفواتير</option>
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

            {/* Customers Invoices Table Container */}
            <div className="bg-card border rounded-3xl overflow-hidden shadow-xs">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-16">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <h3 className="font-bold text-lg">لا يوجد عملاء أو فواتير مطابقة</h3>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-extrabold text-right">العميل</TableHead>
                      <TableHead className="font-extrabold text-right">الهاتف</TableHead>
                      <TableHead className="font-extrabold text-center">عدد الفواتير</TableHead>
                      <TableHead className="font-extrabold text-right">إجمالي المشتريات</TableHead>
                      <TableHead className="font-extrabold text-right">تاريخ آخر فاتورة</TableHead>
                      <TableHead className="font-extrabold text-center">عرض الفواتير</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((c) => (
                      <TableRow
                        key={c._id}
                        className="hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => setSelectedPhone(c._id)}
                      >
                        <TableCell>
                          <p className="font-extrabold text-sm text-foreground">{c.customerName}</p>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{c.customerPhone}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="rounded-xl text-xs font-bold px-3">
                            {c.ordersCount} فاتورة
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black text-sm text-foreground">
                          {formatPrice(c.totalSpent)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(c.lastOrderDate)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" variant="ghost" className="rounded-xl font-bold text-xs gap-1">
                            <FileText className="h-4 w-4" /> الفواتير
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        ) : ordersLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {customerOrders?.map((order) => (
              <div key={order._id} className="bg-card border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b">
                  <div>
                    <h4 className="font-black text-base">فاتورة رقم #{order.orderNumber}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">تاريخ الإصدار: {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-xl text-xs font-bold">
                      {statusLabels[order.status] || order.status}
                    </Badge>
                    <Badge
                      variant={order.paymentStatus === "paid" ? "default" : "secondary"}
                      className="rounded-xl text-xs font-bold"
                    >
                      {order.paymentStatus === "paid" ? "مدفوع" : "غير مدفوع"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoiceOrder(order)}
                      className="rounded-xl font-bold gap-1.5 text-xs"
                    >
                      <Printer className="h-4 w-4" /> طباعة الفاتورة
                    </Button>
                  </div>
                </div>

                <div className="py-3 space-y-2 text-xs">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-muted-foreground">
                      <span className="font-semibold text-foreground">{item.nameAr} × {item.quantity}</span>
                      <span className="font-extrabold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t text-sm font-black">
                  <span>الإجمالي الكلي:</span>
                  <span className="text-base">{formatPrice(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invoice Printable Dialog */}
        {invoiceOrder && (
          <InvoicePrint
            order={invoiceOrder}
            open={!!invoiceOrder}
            onClose={() => setInvoiceOrder(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
