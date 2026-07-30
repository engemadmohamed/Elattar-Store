import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect } from "wouter";
import {
  Package,
  User as UserIcon,
  Pencil,
  Printer,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  customerEmail: string;
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
}

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "تم التأكيد",
  processing: "جاري التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

async function customerRequest<T>(
  method: string,
  url: string,
  data?: unknown,
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
    const err = await res.json().catch(() => ({ message: "حدث خطأ" }));
    throw new Error(err.message || "حدث خطأ");
  }
  return res.json();
}

export default function Profile() {
  const { customer, isAuthenticated, isLoading } = useCustomerAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { addItem } = useCart();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    libraryName: "",
    libraryLocation: "",
  });
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  useEffect(() => {
    if (customer)
      setForm({
        name: customer.name,
        phone: customer.phone,
        libraryName: customer.libraryName || "",
        libraryLocation: customer.libraryLocation || "",
      });
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
      toast({ title: "تم تحديث بياناتك ✓" });
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

  // Suggest products related to the last thing they bought
  const lastPurchasedProductId = orders?.[0]?.items?.[0]?.productId;

  // "Buy it again" — every distinct product they've ordered before, most
  // recently bought first (Amazon-style repeat-purchase shortcut)
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

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserIcon className="h-6 w-6" /> حسابي
        </h1>

        {/* Profile info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">البيانات الشخصية</CardTitle>
            {!editing && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" /> تعديل
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading || !customer ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : editing ? (
              <div className="space-y-4">
                <div>
                  <Label>الاسم</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>اسم المكتبة</Label>
                  <Input
                    value={form.libraryName}
                    onChange={(e) =>
                      setForm({ ...form, libraryName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>موقع المكتبة</Label>
                  <Input
                    value={form.libraryLocation}
                    onChange={(e) =>
                      setForm({ ...form, libraryLocation: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input value={customer.email} disabled />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate()}
                  >
                    {updateMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      if (customer)
                        setForm({
                          name: customer.name,
                          phone: customer.phone,
                          libraryName: customer.libraryName || "",
                          libraryLocation: customer.libraryLocation || "",
                        });
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm leading-relaxed">
                <p>
                  <span className="text-muted-foreground">الاسم: </span>
                  {customer.name}
                </p>
                <p>
                  <span className="text-muted-foreground">
                    البريد الإلكتروني:{" "}
                  </span>
                  {customer.email}
                </p>
                <p>
                  <span className="text-muted-foreground">رقم الهاتف: </span>
                  {customer.phone}
                </p>
                <p>
                  <span className="text-muted-foreground">اسم المكتبة: </span>
                  {customer.libraryName || "-"}
                </p>
                <p>
                  <span className="text-muted-foreground">موقع المكتبة: </span>
                  {customer.libraryLocation || "-"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" /> طلباتي
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => {
                  const canCancel = ![
                    "shipped",
                    "delivered",
                    "cancelled",
                  ].includes(order.status);
                  return (
                    <div key={order._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          طلب #{order.orderNumber}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {statusLabels[order.status] || order.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setInvoiceOrder(order)}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1 mb-2">
                        {order.items.map((item, i) => (
                          <p key={i}>
                            {item.nameAr} × {item.quantity}
                          </p>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {formatPrice(order.total)}
                        </p>
                        {canCancel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive gap-1 h-7"
                            disabled={cancelMutation.isPending}
                            onClick={() => setCancelTarget(order)}
                          >
                            <XCircle className="h-3.5 w-3.5" /> إلغاء الطلب
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                لسه معملتش أي طلب.{" "}
                <Link href="/shop" className="text-primary hover:underline">
                  تسوق دلوقتي
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Buy it again */}
        {buyAgainItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RotateCcw className="h-4 w-4" /> اشترِ مرة أخرى
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {buyAgainItems.map((item) => (
                  <div
                    key={item.productId}
                    className="border rounded-lg p-3 flex flex-col"
                  >
                    <Link href={`/product/${item.productId}`}>
                      <div className="aspect-square bg-muted rounded-md overflow-hidden mb-2">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.nameAr}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-3xl">
                            📦
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium line-clamp-2 mb-1">
                        {item.nameAr}
                      </p>
                    </Link>
                    <p className="text-sm font-semibold text-primary mb-2">
                      {formatPrice(item.price)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 mt-auto"
                      onClick={() => handleBuyAgain(item)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> أضف للسلة
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggested for you */}
        {lastPurchasedProductId && (
          <div>
            <RelatedProducts
              productId={lastPurchasedProductId}
              title="نقترح عليك أيضًا"
            />
          </div>
        )}
      </div>

      <InvoicePrint
        order={invoiceOrder}
        open={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />
    </div>
  );
}
