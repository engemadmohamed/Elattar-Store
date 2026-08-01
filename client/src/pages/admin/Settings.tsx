import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, Save, RotateCcw, Eye, EyeOff } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StoreSettings } from "@/lib/store-settings-context";

const defaultSettings: StoreSettings = {
  storeName: "المهندس",
  storeTagline: "Stationery Co.",
  storeDescription: "متجرك الموثوق للأدوات المكتبية والقلمية بجودة عالية وأسعار مناسبة.",
  phone: "+20 10 98154983",
  email: "support@almohandes.com",
  address: "القاهرة، مصر",
  announcementBar: "🚚 توصيل مجاني للطلبات فوق 500 ج.م — اطلب الآن!",
  heroBadge: "تشكيلة 2026 وصلت الآن",
  heroTitle: "كل ما يحتاجه مكتبك الفاخر",
  heroFeaturedTitle: "المهندس",
  heroDescription: "اكتشف تشكيلتنا الواسعة من الأدوات المكتبية وقراطيس من أفضل العلامات التجارية العالمية. جودة استثنائية وأسعار تنافسية وتوصيل سريع.",
  heroImageUrl: "",
  heroPrimaryButton: "تسوّق الآن",
  heroSecondaryButton: "الدفاتر والمذكرات",
  discountBannerTitle: "عروض حصرية لفترة محدودة",
  discountBannerDescription: "خصم يصل إلى 30% على تشكيلة واسعة من المنتجات المختارة",
  aboutTitle: "أدوات مكتبية فاخرة",
  aboutDescription: "متجرنا الأول للأدوات المكتبية الفاخرة في مصر. نوفّر منتجات عالية الجودة من أفضل العلامات التجارية العالمية بأسعار تنافسية.",
  shippingTitle: "شحن سريع",
  shippingDescription: "توصيل لجميع محافظات مصر خلال 2-5 أيام عمل",
  policiesTitle: "ضمان الجودة",
  policiesDescription: "إرجاع مجاني خلال 14 يوم بدون أسئلة",
  ctaButtonText: "تسوق الآن",
  discountPercent: "30",
  instagram: "",
  facebook: "",
  twitter: "",
  whatsapp: "201098154983",
  primaryColor: "#F59E0B",
  primaryForeground: "#ffffff",
  backgroundColor: "#FFFFFF",
  cardBackground: "#FFFBF0",
  buttonStyle: "rounded",
  heroShape: "split",
  sectionSpacing: "normal",
  showAnnouncementBar: true,
  showNewsletter: false,
  showRatings: true,
  showCategories: true,
  showFeaturedProducts: true,
  showDiscountBanner: true,
};

export default function AdminSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<StoreSettings>(defaultSettings);
  const [showPreview, setShowPreview] = useState(true);

  const { data, isLoading } = useQuery<StoreSettings>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest("GET", "/api/settings"),
  });

  useEffect(() => {
    if (data) setForm({ ...defaultSettings, ...data });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (data: StoreSettings) => apiRequest("PUT", "/api/settings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "تم حفظ التغييرات ✓" });
    },
    onError: (err) =>
      toast({ title: "فشل الحفظ", description: String(err), variant: "destructive" }),
  });

  const set = (key: keyof StoreSettings, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => saveMutation.mutate(form);

  const handleReset = () => {
    setForm(defaultSettings);
    toast({ title: "تمت إعادة الألوان والبيانات للوضع الافتراضي" });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-6 w-6" /> إعدادات المتجر
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              تحكم في الهوية البصرية والنصوص والميزات الظاهرة للموقع من مكان واحد
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" /> إعادة الألوان / البيانات
            </Button>
            <Button size="sm" className="gap-1" onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-3.5 w-3.5" /> حفظ التغييرات
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          {/* Settings form */}
          <div>
            <Tabs defaultValue="identity">
              <TabsList className="mb-4 flex-wrap h-auto">
                <TabsTrigger value="identity">الهوية الأساسية</TabsTrigger>
                <TabsTrigger value="hero">النصوص الرئيسية</TabsTrigger>
                <TabsTrigger value="banners">البنرات والتواصل</TabsTrigger>
                <TabsTrigger value="colors">الألوان والتنسيق</TabsTrigger>
                <TabsTrigger value="visibility">العناصر الظاهرة</TabsTrigger>
              </TabsList>

              {/* Identity */}
              <TabsContent value="identity">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">الهوية الأساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="اسم المتجر" value={form.storeName} onChange={(v) => set("storeName", v)} />
                      <Field label="الشعار / اللقب" value={form.storeTagline} onChange={(v) => set("storeTagline", v)} />
                    </div>
                    <Field label="وصف المتجر" value={form.storeDescription} onChange={(v) => set("storeDescription", v)} textarea />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="الهاتف" value={form.phone} onChange={(v) => set("phone", v)} />
                      <Field label="البريد الإلكتروني" value={form.email} onChange={(v) => set("email", v)} />
                    </div>
                    <Field label="العنوان" value={form.address} onChange={(v) => set("address", v)} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Hero texts */}
              <TabsContent value="hero">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">النصوص الرئيسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Field label="شريط الإعلان" value={form.announcementBar} onChange={(v) => set("announcementBar", v)} />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="شارة الهيرو" value={form.heroBadge} onChange={(v) => set("heroBadge", v)} />
                      <Field label="عنوان الهيرو (المميز)" value={form.heroFeaturedTitle} onChange={(v) => set("heroFeaturedTitle", v)} />
                    </div>
                    <Field label="عنوان الهيرو" value={form.heroTitle} onChange={(v) => set("heroTitle", v)} />
                    <Field label="وصف الهيرو" value={form.heroDescription} onChange={(v) => set("heroDescription", v)} textarea />
                    <Field label="رابط صورة الهيرو (اختياري)" value={form.heroImageUrl} onChange={(v) => set("heroImageUrl", v)} placeholder="https://..." />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="زر أساسي" value={form.heroPrimaryButton} onChange={(v) => set("heroPrimaryButton", v)} />
                      <Field label="زر ثانوي" value={form.heroSecondaryButton} onChange={(v) => set("heroSecondaryButton", v)} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Banners & social */}
              <TabsContent value="banners">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">بنر الخصومات ووسائل التواصل</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Field label="عنوان بنر الخصومات" value={form.discountBannerTitle} onChange={(v) => set("discountBannerTitle", v)} />
                    <Field label="وصف بنر الخصومات" value={form.discountBannerDescription} onChange={(v) => set("discountBannerDescription", v)} textarea />
                    <Field label="عنوان (عن المتجر)" value={form.aboutTitle} onChange={(v) => set("aboutTitle", v)} />
                    <Field label="وصف (عن المتجر)" value={form.aboutDescription} onChange={(v) => set("aboutDescription", v)} textarea />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="عنوان الشحن" value={form.shippingTitle} onChange={(v) => set("shippingTitle", v)} />
                      <Field label="وصف الشحن" value={form.shippingDescription} onChange={(v) => set("shippingDescription", v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="عنوان السياسات" value={form.policiesTitle} onChange={(v) => set("policiesTitle", v)} />
                      <Field label="وصف السياسات" value={form.policiesDescription} onChange={(v) => set("policiesDescription", v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="نص الزر" value={form.ctaButtonText} onChange={(v) => set("ctaButtonText", v)} />
                      <Field label="نسبة الخصم (%)" value={form.discountPercent} onChange={(v) => set("discountPercent", v)} />
                    </div>

                    <div className="pt-4 border-t">
                      <p className="font-medium text-sm mb-3">روابط التواصل</p>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Instagram" value={form.instagram} onChange={(v) => set("instagram", v)} placeholder="https://instagram.com/..." />
                        <Field label="Facebook" value={form.facebook} onChange={(v) => set("facebook", v)} placeholder="https://facebook.com/..." />
                        <Field label="Twitter/X" value={form.twitter} onChange={(v) => set("twitter", v)} placeholder="https://x.com/..." />
                        <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="201098154983" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Colors */}
              <TabsContent value="colors">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">الألوان والتنسيق</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <ColorField label="اللون الأساسي" value={form.primaryColor} onChange={(v) => set("primaryColor", v)} />
                      <ColorField label="لون النص على اللون الأساسي" value={form.primaryForeground} onChange={(v) => set("primaryForeground", v)} />
                      <ColorField label="خلفية الصفحة" value={form.backgroundColor} onChange={(v) => set("backgroundColor", v)} />
                      <ColorField label="خلفية البطاقات" value={form.cardBackground} onChange={(v) => set("cardBackground", v)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <Label className="mb-2 block">نمط الأزرار</Label>
                        <div className="flex gap-2">
                          {["rounded", "outline"].map((s) => (
                            <Button
                              key={s}
                              type="button"
                              size="sm"
                              variant={form.buttonStyle === s ? "default" : "outline"}
                              onClick={() => set("buttonStyle", s)}
                            >
                              {s === "rounded" ? "مملوء" : "حدود فقط"}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block">شكل الهيرو</Label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { v: "classic", l: "كلاسيكي" },
                            { v: "split", l: "مقسم" },
                            { v: "minimal", l: "مبسط" },
                          ].map((s) => (
                            <Button
                              key={s.v}
                              type="button"
                              size="sm"
                              variant={form.heroShape === s.v ? "default" : "outline"}
                              onClick={() => set("heroShape", s.v)}
                            >
                              {s.l}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block">تباعد الأقسام</Label>
                        <div className="flex gap-2">
                          {[
                            { v: "compact", l: "مضغوط" },
                            { v: "normal", l: "عادي" },
                            { v: "wide", l: "واسع" },
                          ].map((s) => (
                            <Button
                              key={s.v}
                              type="button"
                              size="sm"
                              variant={form.sectionSpacing === s.v ? "default" : "outline"}
                              onClick={() => set("sectionSpacing", s.v)}
                            >
                              {s.l}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Visibility */}
              <TabsContent value="visibility">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">العناصر الظاهرة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {[
                      { key: "showAnnouncementBar" as const, label: "شريط الإعلان" },
                      { key: "showNewsletter" as const, label: "قسم النشرة البريدية" },
                      { key: "showRatings" as const, label: "أقسام التقييمات" },
                      { key: "showCategories" as const, label: "قسم التصنيفات" },
                      { key: "showFeaturedProducts" as const, label: "قسم المنتجات المميزة" },
                      { key: "showDiscountBanner" as const, label: "بنر الخصومات" },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <span className="text-sm font-medium">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${form[item.key] ? "text-green-600" : "text-muted-foreground"}`}>
                            {form[item.key] ? "مرئي" : "مخفي"}
                          </span>
                          <Switch
                            checked={form[item.key]}
                            onCheckedChange={(v) => set(item.key, v)}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview */}
          <div>
            <Card className="sticky top-6 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">معاينة المتجر</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </CardHeader>
              {showPreview && (
                <CardContent>
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={{ background: form.backgroundColor }}
                  >
                    {/* Announcement */}
                    {form.showAnnouncementBar && form.announcementBar && (
                      <div
                        className="py-2 text-center text-xs font-medium truncate px-2"
                        style={{ background: form.primaryColor, color: form.primaryForeground }}
                      >
                        {form.announcementBar}
                      </div>
                    )}
                    {/* Hero */}
                    <div className="p-4" style={{ background: form.cardBackground }}>
                      <div
                        className="inline-block text-[10px] px-2 py-0.5 rounded-full mb-2"
                        style={{ background: form.primaryColor, color: form.primaryForeground }}
                      >
                        {form.heroBadge}
                      </div>
                      <p className="text-lg font-bold mb-1" style={{ color: form.primaryColor }}>
                        {form.heroFeaturedTitle}
                      </p>
                      <p className="text-sm font-semibold mb-2">{form.heroTitle}</p>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{form.heroDescription}</p>
                      <div className="flex gap-2">
                        <span
                          className="text-xs px-3 py-1.5 rounded-md font-medium"
                          style={{ background: form.primaryColor, color: form.primaryForeground }}
                        >
                          {form.heroPrimaryButton}
                        </span>
                        <span
                          className="text-xs px-3 py-1.5 rounded-md font-medium border"
                          style={{ borderColor: form.primaryColor, color: form.primaryColor }}
                        >
                          {form.heroSecondaryButton}
                        </span>
                      </div>
                    </div>
                    {/* Discount banner */}
                    {form.showDiscountBanner && (
                      <div
                        className="p-4 text-center"
                        style={{ background: form.primaryColor, color: form.primaryForeground }}
                      >
                        <p className="text-xs opacity-80 mb-1">خصم {form.discountPercent}%</p>
                        <p className="text-sm font-bold mb-1">{form.discountBannerTitle}</p>
                        <p className="text-[10px] opacity-80 line-clamp-2">{form.discountBannerDescription}</p>
                      </div>
                    )}
                    {/* Store info */}
                    <div className="p-4 text-center">
                      <p className="text-sm font-bold">{form.storeName}</p>
                      <p className="text-[10px] text-muted-foreground">{form.storeTagline}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{form.phone}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {textarea ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded-md border cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );
}
