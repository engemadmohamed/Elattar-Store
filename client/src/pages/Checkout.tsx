import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Truck, CreditCard } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

const SHIPPING_COMPANIES = [
  { id: "bosta", name: "Bosta", nameAr: "بوسطة", cost: 50, days: "2-3 أيام" },
  { id: "aramex", name: "Aramex", nameAr: "أرامكس", cost: 65, days: "1-2 يوم" },
  { id: "jnt", name: "J&T Express", nameAr: "J&T إكسبريس", cost: 45, days: "3-5 أيام" },
  { id: "mylerz", name: "Mylerz", nameAr: "مايلرز", cost: 40, days: "3-4 أيام" },
];

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحيرة", "الفيوم", "الغربية",
  "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس",
  "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "الشرقية", "جنوب سيناء",
  "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهاج", "البحر الأحمر",
];

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { customer } = useCustomerAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState(SHIPPING_COMPANIES[0]);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    recipientName: "",
    recipientPhone: "",
    address: "",
    city: "",
    governorate: "",
    notes: "",
    paymentMethod: "cash_on_delivery",
  });

  // Prefill from the logged-in customer's profile, without overwriting
  // anything the person has already started typing
  useEffect(() => {
    if (!customer) return;
    setForm((f) => ({
      ...f,
      customerName: f.customerName || customer.name,
      customerEmail: f.customerEmail || customer.email,
      customerPhone: f.customerPhone || customer.phone,
    }));
  }, [customer]);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const grandTotal = total + selectedShipping.cost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.address || !form.governorate) {
      toast({ title: "الرجاء ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "السلة فارغة", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shipping: {
          company: selectedShipping.nameAr,
          cost: selectedShipping.cost,
          recipientName: form.recipientName || form.customerName,
          recipientPhone: form.recipientPhone || form.customerPhone,
          address: form.address,
          city: form.city,
          governorate: form.governorate,
        },
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      };

      const order = await apiRequest<{ orderNumber: string }>("POST", "/api/orders", orderData);
      clearCart();
      setSuccess(order.orderNumber);
    } catch (error) {
      toast({ title: "فشل إتمام الطلب", description: String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">تم تأكيد طلبك! 🎉</h1>
          <p className="text-muted-foreground mb-4">رقم الطلب: <span className="font-bold text-foreground">{success}</span></p>
          <p className="text-sm text-muted-foreground mb-6">سيتم التواصل معك قريباً لتأكيد الشحن</p>
          <Button onClick={() => navigate("/")}>العودة للمتجر</Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-xl font-medium mb-4">السلة فارغة</p>
          <Button onClick={() => navigate("/shop")}>تسوق الآن</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">إتمام الطلب</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>👤</span> بيانات العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>الاسم *</Label>
                      <Input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="الاسم الكامل" required />
                    </div>
                    <div>
                      <Label>رقم الهاتف *</Label>
                      <Input value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} placeholder="01xxxxxxxxx" required />
                    </div>
                  </div>
                  <div>
                    <Label>البريد الإلكتروني (اختياري)</Label>
                    <Input type="email" value={form.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} placeholder="email@example.com" />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" /> عنوان التوصيل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>المحافظة *</Label>
                      <Select value={form.governorate} onValueChange={(v) => set("governorate", v)} required>
                        <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                        <SelectContent>
                          {GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>المدينة / المنطقة *</Label>
                      <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="مدينة / حي" required />
                    </div>
                  </div>
                  <div>
                    <Label>العنوان التفصيلي *</Label>
                    <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="الشارع، رقم العقار، الدور، الشقة..." required />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Company */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    📦 شركة الشحن
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {SHIPPING_COMPANIES.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => setSelectedShipping(company)}
                        className={`p-3 rounded-lg border-2 text-left transition-colors ${selectedShipping.id === company.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                      >
                        <p className="font-semibold text-sm">{company.name}</p>
                        <p className="text-xs text-muted-foreground">{company.days}</p>
                        <p className="text-sm font-bold text-primary mt-1">{formatPrice(company.cost)}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> طريقة الدفع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { value: "cash_on_delivery", label: "💵 الدفع عند الاستلام" },
                      { value: "vodafone_cash", label: "📱 فودافون كاش" },
                      { value: "instapay", label: "💳 إنستاباي" },
                    ].map((method) => (
                      <label key={method.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${form.paymentMethod === method.value ? "border-primary bg-primary/5" : ""}`}>
                        <input type="radio" name="payment" value={method.value} checked={form.paymentMethod === method.value} onChange={(e) => set("paymentMethod", e.target.value)} className="text-primary" />
                        <span className="text-sm font-medium">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Order Summary */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-base">ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-2 text-sm">
                      <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
                        {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center">📦</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs">{item.nameAr}</p>
                        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                      </div>
                      <p className="text-xs font-semibold shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المجموع الفرعي</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الشحن ({selectedShipping.nameAr})</span>
                      <span>{formatPrice(selectedShipping.cost)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>الإجمالي</span>
                      <span className="text-primary">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "جاري إتمام الطلب..." : "تأكيد الطلب"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
