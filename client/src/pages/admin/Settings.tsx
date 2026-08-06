import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, Save, RotateCcw, Eye, EyeOff, Palette, Database, Smartphone, Monitor, RefreshCw, ExternalLink } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings, type StoreSettings } from "@/lib/store-settings-context";

const defaultSettings: StoreSettings = {
  storeName: "المهندس",
  storeTagline: "Stationery Co.",
  storeDescription: "متجرك الموثوق للأدوات المكتبية والقلمية بجودة عالية وأسعار مناسبة.",
  phone: "+20 10 98154983",
  email: "support@almohandes.com",
  address: "القاهرة، مصر",
  announcementBar: "🚚 توصيل مجاني للطلبات فوق 500 ج.م — اطلب الآن!",
  heroBadge: "تشكيلة 2026 وصلت الآن",
  heroTitle: "نصنع الجودة ونكسب الثقة",
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
  primaryColor: "#111111",
  primaryForeground: "#ffffff",
  backgroundColor: "#FFFFFF",
  cardBackground: "#FFFFFF",
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

function hexToHsl(hex: string): string {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return "0 0% 7%";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hexToHslRaw(hex: string): string {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return "0 0% 100%";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function AdminSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { refreshSettings } = useStoreSettings();
  const [form, setForm] = useState<StoreSettings>(defaultSettings);

  const { data, isLoading } = useQuery<StoreSettings>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest("GET", "/api/settings"),
  });

  useEffect(() => {
    if (data) setForm({ ...defaultSettings, ...data });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (data: StoreSettings) => {
      const cleanData = { ...data } as Record<string, unknown>;
      delete cleanData._id;
      delete cleanData.__v;
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      return apiRequest("PUT", "/api/settings", cleanData);
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["/api/settings"] });
      await refreshSettings();
      toast({ title: "تم حفظ التغييرات بنجاح ✓" });
    },
    onError: (err) =>
      toast({ title: "فشل الحفظ", description: err instanceof Error ? err.message : String(err), variant: "destructive" }),
  });

  const set = (key: keyof StoreSettings, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => saveMutation.mutate(form);

  const handleResetData = () => {
    setForm(() => ({
      ...defaultSettings,
    }));
    toast({ title: "تمت إعادة تعيين بيانات المتجر للوضع الافتراضي ✓" });
  };

  if (isLoading) {
    return (
      <AdminLayout title="إعدادات المتجر">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="إعدادات المتجر" subtitle="تخصيص نصوص وشكل وتصميم المتجر">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" /> تخصيص المتجر
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              تحكم في الهوية البصرية والنصوص والميزات الظاهرة للموقع من مكان واحد
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-2" onClick={handleResetData}>
              <Database className="h-3.5 w-3.5" /> إعادة تعيين البيانات
            </Button>
            <Button size="sm" className="gap-1.5 rounded-xl bg-black hover:bg-black/90 text-white font-bold px-4" onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-3.5 w-3.5" /> {saveMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Settings form */}
          <div>
            <Tabs defaultValue="identity">
              <TabsList className="mb-6 flex-wrap h-auto p-1.5 bg-white border-2 rounded-2xl">
                <TabsTrigger value="identity" className="rounded-xl font-semibold">الهوية الأساسية</TabsTrigger>
                <TabsTrigger value="hero" className="rounded-xl font-semibold">النصوص الرئيسية</TabsTrigger>
                <TabsTrigger value="banners" className="rounded-xl font-semibold">البنرات والتواصل</TabsTrigger>
                <TabsTrigger value="visibility" className="rounded-xl font-semibold">العناصر الظاهرة</TabsTrigger>
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
                          <span className={`text-xs font-medium ${form[item.key] ? "text-foreground" : "text-muted-foreground"}`}>
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
        </div>
      </div>
    </AdminLayout>
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
