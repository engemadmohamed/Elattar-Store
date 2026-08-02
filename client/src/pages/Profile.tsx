import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect } from "wouter";
import {
  Package,
  User as UserIcon,
  Pencil,
  Printer,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Store,
  MapPin,
  Phone,
  LogOut,
  CheckCircle2,
  Clock,
  Truck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import RelatedProducts from "@/components/RelatedProducts";
import InvoicePrint from "@/components/InvoicePrint";

interface OrderItem {
  productId: string;
  nameAr: string;
  price: number;
  quantity: number;
  image?: string;
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

const statusConfig: Record<string, { label: string; bgClass: string; dotClass: string }> = {
  pending: { label: "قيد الانتظار", bgClass: "bg-amber-500/10 text-amber-600 border-amber-500/20", dotClass: "bg-amber-500" },
  confirmed: { label: "تم التأكيد", bgClass: "bg-blue-500/10 text-blue-600 border-blue-500/20", dotClass: "bg-blue-500" },
  processing: { label: "جاري التجهيز", bgClass: "bg-purple-500/10 text-purple-600 border-purple-500/20", dotClass: "bg-purple-500" },
  shipped: { label: "تم الشحن 🚚", bgClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", dotClass: "bg-indigo-500" },
  delivered: { label: "مستلم ✓", bgClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dotClass: "bg-emerald-500" },
  cancelled: { label: "ملغي", bgClass: "bg-rose-500/10 text-rose-600 border-rose-500/20", dotClass: "bg-rose-500" },
};

async function customerRequest<T>(
  method: string,
  url: string,
  data?: unknown
): Promise<T> {
  const token = localStorage.getItem("al-mohandes-customer-token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["X-Customer-Token"] = token;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "حدث خطأ" }));
    throw new Error(error.message || "حدث خطأ");
  }
  return res.json();
}

export default function Profile() {
  const { customer, isAuthenticated, isLoading, logout } = useCustomerAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { addItem } = useCart();
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    libraryName: "",
    libraryLocation: "",
  });
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone,
        libraryName: customer.libraryName || "",
        libraryLocation: customer.libraryLocation || "",
      });
    }
  }, [customer]);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/my-orders"],
    queryFn: () => customerRequest("GET", "/api/orders/my-orders"),
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: () => customerRequest("PUT", "/api/customer-auth/me", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/customer-auth/me"] });
      toast({ title: "تم تحديث بياناتك بنجاح ✓" });
      setEditing(false);
    },
    onError: (err) =>
      toast({
        title: "فشل التحديث",
        description: String(err),
        variant: "destructive",
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) =>
      customerRequest("PUT", `/api/orders/my-orders/${orderId}/cancel`),
    onSuccess: () => {
      toast({ title: "تم إلغاء الطلب" });
      qc.invalidateQueries({ queryKey: ["/api/orders/my-orders"] });
      setCancelTarget(null);
    },
    onError: (err) =>
      toast({
        title: "فشل إلغاء الطلب",
        description: String(err),
        variant: "destructive",
      }),
  });

  if (!isLoading && !isAuthenticated) {
    return <Redirect to="/login" />;
  }

  const activeOrdersCount = orders?.filter(o => !["delivered", "cancelled"].includes(o.status)).length || 0;
  const lastPurchasedProductId = orders?.[0]?.items?.[0]?.productId;

  const buyAgainItems = (() => {
    if (!orders) return [];
    const seen = new Map<string, OrderItem>();
    for (const order of orders) {
      for (const item of order.items) {
        if (!seen.has(item.productId)) seen.set(item.productId, item);
      }
    }
    return Array.from(seen.values()).slice(0, 8);
  })();

  const handleBuyAgain = (item: OrderItem) => {
    addItem({
      productId: item.productId,
      name: item.nameAr,
      nameAr: item.nameAr,
      price: item.price,
      image: item.image,
    });
    toast({ title: "تم الإضافة للسلة ✓", description: item.nameAr });
  };

  const firstLetter = customer?.name ? customer.name.trim().charAt(0).toUpperCase() : "م";

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* ===== HERO PROFILE HEADER CARD ===== */}
        <div className="relative overflow-hidden rounded-3xl bg-black text-white p-6 sm:p-8 shadow-2xl border border-white/10">
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* User Avatar */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white text-black font-black text-3xl sm:text-4xl flex items-center justify-center shadow-lg border-2 border-white/20">
                  {firstLetter}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-black" title="حساب موثق">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>

              {/* User Info & Library */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {customer?.name || "عميل المهندس"}
                  </h1>
                  <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    <Sparkles className="h-3 w-3 mr-1 text-amber-400 inline" /> عميل مميز
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-white/80 text-sm flex-wrap pt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-white/60" />
                    <span dir="ltr">{customer?.phone}</span>
                  </span>
                  {customer?.libraryName && (
                    <span className="flex items-center gap-1 font-semibold text-white">
                      <Store className="h-3.5 w-3.5 text-amber-400" />
                      {customer.libraryName}
                    </span>
                  )}
                  {customer?.libraryLocation && (
                    <span className="flex items-center gap-1 text-white/70">
                      <MapPin className="h-3.5 w-3.5 text-white/60" />
                      {customer.libraryLocation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2 rounded-xl"
                onClick={() => {
                  setEditing(true);
                  setActiveTab("info");
                }}
              >
                <Pencil className="h-3.5 w-3.5" /> تعديل البيانات
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5 rounded-xl"
                onClick={logout}
              >
                <LogOut className="h-3.5 w-3.5" /> خروج
              </Button>
            </div>
          </div>

          {/* Quick Stats Footer Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium">إجمالي الطلبات</p>
                <p className="text-lg font-black text-white">{orders?.length || 0}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium">طلبات جارية</p>
                <p className="text-lg font-black text-white">{activeOrdersCount}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Store className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="truncate">
                <p className="text-xs text-white/60 font-medium">المكتبة المسجلة</p>
                <p className="text-sm font-bold text-white truncate">{customer?.libraryName || "مكتبة فردية"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MAIN DASHBOARD TABS ===== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1.5 rounded-2xl border shadow-sm w-full grid grid-cols-3 h-auto">
            <TabsTrigger
              value="orders"
              className="rounded-xl py-3 font-bold gap-2 data-[state=active]:bg-black data-[state=active]:text-white transition-all"
            >
              <Package className="h-4 w-4" /> طلباتي ({orders?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="buy-again"
              className="rounded-xl py-3 font-bold gap-2 data-[state=active]:bg-black data-[state=active]:text-white transition-all"
            >
              <RotateCcw className="h-4 w-4" /> شراء سريع
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="rounded-xl py-3 font-bold gap-2 data-[state=active]:bg-black data-[state=active]:text-white transition-all"
            >
              <UserIcon className="h-4 w-4" /> بيانات الحساب
            </TabsTrigger>
          </TabsList>

          {/* ----- TAB 1: ORDERS LIST ----- */}
          <TabsContent value="orders" className="space-y-4">
            {ordersLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-36 w-full rounded-3xl" />
                <Skeleton className="h-36 w-full rounded-3xl" />
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusInfo = statusConfig[order.status] || {
                    label: order.status,
                    bgClass: "bg-gray-100 text-gray-700",
                    dotClass: "bg-gray-400",
                  };
                  const canCancel = !["delivered", "cancelled"].includes(order.status);

                  return (
                    <Card key={order._id} className="rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
                      <CardContent className="p-6">
                        {/* Order Header */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-black/5 flex items-center justify-center font-bold text-sm">
                              #{order.orderNumber.slice(-4)}
                            </div>
                            <div>
                              <p className="font-black text-base">طلب رقم: {order.orderNumber}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className={`px-3 py-1 rounded-full border font-bold text-xs flex items-center gap-1.5 ${statusInfo.bgClass}`}>
                              <span className={`h-2 w-2 rounded-full ${statusInfo.dotClass}`} />
                              {statusInfo.label}
                            </Badge>

                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 rounded-xl border-gray-200"
                              onClick={() => setInvoiceOrder(order)}
                            >
                              <Printer className="h-3.5 w-3.5" /> الفاتورة
                            </Button>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="py-4 space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-muted overflow-hidden shrink-0 border">
                                  {item.image ? (
                                    <img src={item.image} alt={item.nameAr} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-xs">📦</div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground line-clamp-1">{item.nameAr}</p>
                                  <p className="text-xs text-muted-foreground">الكمية: {item.quantity}</p>
                                </div>
                              </div>
                              <span className="font-bold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer & Total */}
                        <div className="flex items-center justify-between pt-4 border-t bg-muted/20 -mx-6 -mb-6 px-6 py-4 mt-2">
                          <div>
                            <span className="text-xs text-muted-foreground block">إجمالي الطلب شامل الضريبة</span>
                            <span className="text-lg font-black text-foreground">{formatPrice(order.total)}</span>
                          </div>

                          {canCancel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 rounded-xl font-bold"
                              disabled={cancelMutation.isPending}
                              onClick={() => setCancelTarget(order)}
                            >
                              <XCircle className="h-4 w-4" /> إلغاء الطلب
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="rounded-3xl border p-12 text-center bg-white shadow-sm">
                <div className="h-20 w-20 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-black mb-2">لا توجد طلبات سابقة حتى الآن</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  استكشف تشكيلة الأدوات المكتبية والقلمية الفاخرة من متجر المهندس وابدأ طلبك الأول الآن.
                </p>
                <Link href="/shop">
                  <Button className="bg-black hover:bg-black/90 text-white rounded-2xl px-6 py-6 font-bold">
                    تسوّق الآن
                  </Button>
                </Link>
              </Card>
            )}
          </TabsContent>

          {/* ----- TAB 2: BUY AGAIN ----- */}
          <TabsContent value="buy-again">
            {buyAgainItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {buyAgainItems.map((item) => (
                  <Card key={item.productId} className="rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col bg-white">
                    <CardContent className="p-4 flex flex-col flex-1">
                      <Link href={`/product/${item.productId}`}>
                        <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-3 border">
                          {item.image ? (
                            <img src={item.image} alt={item.nameAr} className="h-full w-full object-cover hover:scale-105 transition-transform" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-3xl">📦</div>
                          )}
                        </div>
                        <p className="text-sm font-bold text-foreground line-clamp-2 mb-1">{item.nameAr}</p>
                      </Link>
                      <p className="text-base font-black text-foreground mb-3">{formatPrice(item.price)}</p>
                      <Button
                        size="sm"
                        className="bg-black hover:bg-black/90 text-white rounded-xl gap-1.5 mt-auto w-full font-bold"
                        onClick={() => handleBuyAgain(item)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> أضف للسلة
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-3xl border p-12 text-center bg-white shadow-sm">
                <p className="text-muted-foreground font-medium">ستظهر هنا المنتجات التي قمت بشرائها سابقاً لتتمكن من إعادة طلبها بضغطة واحدة.</p>
              </Card>
            )}
          </TabsContent>

          {/* ----- TAB 3: PERSONAL INFO ----- */}
          <TabsContent value="info">
            <Card className="rounded-3xl border shadow-sm bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <h3 className="text-lg font-black">البيانات الشخصية والمكتبة</h3>
                  <p className="text-xs text-muted-foreground">يمكنك تحديث اسمك، رقم هاتفك، وعنوان مكتبتك المسجلة</p>
                </div>
                {!editing && (
                  <Button
                    variant="outline"
                    className="rounded-xl gap-1.5 font-bold"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> تعديل
                  </Button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <Label className="font-bold">الاسم بالكامل</Label>
                    <Input
                      className="rounded-xl mt-1.5"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="font-bold">رقم الهاتف</Label>
                    <Input
                      className="rounded-xl mt-1.5 dir-ltr"
                      dir="ltr"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="font-bold">اسم المكتبة / التجارة</Label>
                    <Input
                      className="rounded-xl mt-1.5"
                      value={form.libraryName}
                      onChange={(e) => setForm({ ...form, libraryName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="font-bold">موقع المكتبة (المحافظة / العنوان)</Label>
                    <Input
                      className="rounded-xl mt-1.5"
                      value={form.libraryLocation}
                      onChange={(e) => setForm({ ...form, libraryLocation: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      className="bg-black hover:bg-black/90 text-white rounded-xl px-6 font-bold"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate()}
                    >
                      {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغيرات"}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setEditing(false);
                        if (customer) {
                          setForm({
                            name: customer.name,
                            phone: customer.phone,
                            libraryName: customer.libraryName || "",
                            libraryLocation: customer.libraryLocation || "",
                          });
                        }
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="p-4 rounded-2xl bg-muted/30 border space-y-1">
                    <span className="text-xs font-bold text-muted-foreground block">الاسم</span>
                    <span className="text-base font-black text-foreground">{customer?.name}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border space-y-1">
                    <span className="text-xs font-bold text-muted-foreground block">رقم الهاتف</span>
                    <span className="text-base font-black text-foreground dir-ltr block text-right" dir="ltr">{customer?.phone}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border space-y-1">
                    <span className="text-xs font-bold text-muted-foreground block">اسم المكتبة</span>
                    <span className="text-base font-black text-foreground">{customer?.libraryName || "غير محدد"}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border space-y-1">
                    <span className="text-xs font-bold text-muted-foreground block">موقع المكتبة</span>
                    <span className="text-base font-black text-foreground">{customer?.libraryLocation || "غير محدد"}</span>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Suggested Related Products Section */}
        {lastPurchasedProductId && (
          <div className="pt-6 border-t">
            <RelatedProducts productId={lastPurchasedProductId} title="منتجات نقترحها لك" />
          </div>
        )}
      </div>

      <InvoicePrint
        order={invoiceOrder}
        open={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 font-black">
              <AlertTriangle className="h-5 w-5" /> إلغاء الطلب
            </DialogTitle>
            <DialogDescription className="text-right pt-2">
              هل أنت متأكد من إلغاء طلب <strong>#{cancelTarget?.orderNumber}</strong>؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه وسيتم إخطار الإدارة بالإلغاء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setCancelTarget(null)}
            >
              رجوع
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (cancelTarget) {
                  cancelMutation.mutate(cancelTarget._id);
                }
              }}
            >
              {cancelMutation.isPending ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
