import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Truck, CreditCard, Upload, Copy } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

import { useStoreSettings } from "@/lib/store-settings-context";

const FIXED_SHIPPING_COST = 50;

const GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "البحيرة",
  "الفيوم",
  "الغربية",
  "الإسماعيلية",
  "المنوفية",
  "المنيا",
  "القليوبية",
  "الوادي الجديد",
  "السويس",
  "أسوان",
  "أسيوط",
  "بني سويف",
  "بورسعيد",
  "دمياط",
  "الشرقية",
  "جنوب سيناء",
  "كفر الشيخ",
  "مطروح",
  "الأقصر",
  "قنا",
  "شمال سيناء",
  "سوهاج",
  "البحر الأحمر",
];

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { customer } = useCustomerAuth();
  const { settings } = useStoreSettings();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transferScreenshot, setTransferScreenshot] = useState<string | null>(
    null,
  );

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    recipientName: "",
    recipientPhone: "",
    address: "",
    city: "",
    governorate: "",
    notes: "",
    paymentMethod: "cash_on_delivery",
  });

  useEffect(() => {
    if (!customer) return;
    setForm((f) => ({
      ...f,
      customerName: f.customerName || customer.name,
      customerPhone: f.customerPhone || customer.phone,
    }));
  }, [customer]);

  const set = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));
  const grandTotal = total + FIXED_SHIPPING_COST;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    const token = localStorage.getItem("al-mohandes-customer-token");
    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload image");
      setTransferScreenshot(data.url);
      toast({ title: "تم رفع إثبات التحويل بنجاح ✓" });
    } catch (err: any) {
      toast({
        title: "فشل رفع الصورة",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const availablePaymentMethods = [
    settings.enableCashOnDelivery !== false && {
      value: "cash_on_delivery",
      label: "💵 الدفع عند الاستلام (COD)",
      info: "ادفع نقداً عند استلام طلبك من المندوب",
    },
    settings.enableVodafoneCash !== false && {
      value: "vodafone_cash",
      label: "📱 فودافون كاش (Vodafone Cash)",
      number: settings.vodafoneCashNumber || "01098154983",
      info: `حوالة فودافون كاش على رقم: ${settings.vodafoneCashNumber || "01098154983"}`,
    },
    settings.enableInstapay !== false && {
      value: "instapay",
      label: "⚡ إنستاباي (Instapay)",
      number: settings.instapayAddress || "01098154983@instapay",
      info: `التحويل على عنوان إنستاباي: ${settings.instapayAddress || "01098154983@instapay"}`,
    },
    settings.enableBankTransfer !== false && {
      value: "bank_transfer",
      label: "🏦 تحويل بنكي (Bank Transfer)",
      number: settings.bankAccountDetails || "البنك الأهلي المصري",
      info: settings.bankAccountDetails || "البنك الأهلي المصري",
    },
  ].filter(Boolean) as Array<{ value: string; label: string; number?: string; info?: string }>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.customerName ||
      !form.customerPhone ||
      !form.address ||
      !form.governorate
    ) {
      toast({
        title: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    if (items.length === 0) {
      toast({ title: "السلة فارغة", variant: "destructive" });
      return;
    }
    if (form.paymentMethod !== "cash_on_delivery" && !transferScreenshot) {
      toast({ title: "الرجاء رفع صورة إثبات التحويل", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          color: i.color,
        })),
        shipping: {
          company: "شحن",
          cost: FIXED_SHIPPING_COST,
          recipientName: form.recipientName || form.customerName,
          recipientPhone: form.recipientPhone || form.customerPhone,
          address: form.address,
          city: form.city,
          governorate: form.governorate,
        },
        paymentMethod: form.paymentMethod,
        transferScreenshotUrl: transferScreenshot,
        notes: form.notes,
        customerLibraryName: customer?.libraryName,
        customerLibraryLocation: customer?.libraryLocation,
      };

      const order = await apiRequest<{ orderNumber: string }>(
        "POST",
        "/api/orders",
        orderData,
      );
      clearCart();
      setSuccess(order.orderNumber);
    } catch (error) {
      toast({
        title: "فشل إتمام الطلب",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">تم تأكيد طلبك! 🎉</h1>
          <p className="text-muted-foreground mb-4">
            رقم الطلب:{" "}
            <span className="font-bold text-foreground">{success}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            سيتم التواصل معك قريباً لتأكيد الشحن
          </p>
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
                      <Input
                        value={form.customerName}
                        onChange={(e) => set("customerName", e.target.value)}
                        placeholder="الاسم الكامل"
                        required
                      />
                    </div>
                    <div>
                      <Label>رقم الهاتف *</Label>
                      <Input
                        value={form.customerPhone}
                        onChange={(e) => set("customerPhone", e.target.value)}
                        placeholder="01xxxxxxxxx"
                        required
                      />
                    </div>
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
                      <Select
                        value={form.governorate}
                        onValueChange={(v) => set("governorate", v)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المحافظة" />
                        </SelectTrigger>
                        <SelectContent>
                          {GOVERNORATES.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>المدينة / المنطقة *</Label>
                      <Input
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                        placeholder="مدينة / حي"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>العنوان التفصيلي *</Label>
                    <Input
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="الشارع، رقم العقار، الدور، الشقة..."
                      required
                    />
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
                <CardContent className="space-y-4">
                  <div className="space-y-2.5">
                    {availablePaymentMethods.map((method) => (
                      <div
                        key={method.value}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          form.paymentMethod === method.value
                            ? "border-black bg-black/5 dark:bg-white/10 shadow-xs"
                            : "bg-card border-border hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="radio"
                              name="payment"
                              value={method.value}
                              checked={form.paymentMethod === method.value}
                              onChange={(e) => set("paymentMethod", e.target.value)}
                              className="text-black accent-black h-4 w-4"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-extrabold block">
                                {method.label}
                              </span>
                              {method.info && (
                                <span className="text-xs text-muted-foreground block mt-0.5">
                                  {method.info}
                                </span>
                              )}
                            </div>
                          </label>

                          {method.number && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigator.clipboard.writeText(method.number!);
                                toast({ title: "تم نسخ الرقم/البيانات بنجاح 📋" });
                              }}
                              className="h-8 rounded-xl text-xs font-bold gap-1 px-3 border-black/20 hover:bg-black hover:text-white transition-all shrink-0"
                              title="نسخ بيانات التحويل"
                            >
                              <Copy className="h-3.5 w-3.5" /> نسخ
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Instructions if Transfer Method Selected */}
                  {form.paymentMethod !== "cash_on_delivery" && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      {settings.paymentInstructions && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                          <p className="font-bold mb-1">تعليمات التحويل والتأكيد:</p>
                          <p className="leading-relaxed">{settings.paymentInstructions}</p>
                        </div>
                      )}
                      <Label>إثبات التحويل *</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        بعد التحويل، الرجاء رفع صورة من إيصال الدفع.
                      </p>
                      {transferScreenshot ? (
                        <div className="relative h-24 w-24 rounded-lg border overflow-hidden">
                          <img
                            src={transferScreenshot}
                            alt="إثبات التحويل"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setTransferScreenshot(null)}
                            className="absolute top-0 right-0 h-6 w-6 bg-black/50 text-white flex items-center justify-center rounded-bl-lg"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <Label
                            htmlFor="transfer-upload"
                            className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors"
                          >
                            {uploading ? (
                              <span className="text-sm text-primary">
                                جاري الرفع...
                              </span>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 text-muted-foreground" />{" "}
                                <span className="text-sm text-muted-foreground">
                                  رفع صورة
                                </span>
                              </>
                            )}
                          </Label>
                          <input
                            id="transfer-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                        </>
                      )}
                    </div>
                  )}
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
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs">{item.nameAr}</p>
                        <p className="text-xs text-muted-foreground">
                          × {item.quantity}
                        </p>
                      </div>
                      <p className="text-xs font-semibold shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        المجموع الفرعي
                      </span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الشحن</span>
                      <span>{formatPrice(FIXED_SHIPPING_COST)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>الإجمالي</span>
                      <span className="text-primary">
                        {formatPrice(grandTotal)}
                      </span>
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
