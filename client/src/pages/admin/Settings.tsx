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
  const [showPreview, setShowPreview] = useState(true);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const applyColorsToIframe = () => {
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc || !doc.documentElement) return;

      const root = doc.documentElement;
      if (form.primaryColor) {
        const hsl = hexToHsl(form.primaryColor);
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--ring", hsl);
        root.style.setProperty("--sidebar-primary", hsl);
        root.style.setProperty("--sidebar-ring", hsl);
      }
      if (form.primaryForeground) {
        root.style.setProperty("--primary-foreground", hexToHslRaw(form.primaryForeground));
      }
      if (form.backgroundColor) {
        root.style.setProperty("--background", hexToHslRaw(form.backgroundColor));
      }
      if (form.cardBackground) {
        root.style.setProperty("--card", hexToHslRaw(form.cardBackground));
      }
    } catch (e) {
      console.warn("Could not update preview colors live:", e);
    }
  };

  useEffect(() => {
    applyColorsToIframe();
  }, [form.primaryColor, form.primaryForeground, form.backgroundColor, form.cardBackground, iframeKey, deviceMode]);

  const { data, isLoading } = useQuery<StoreSettings>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest("GET", "/api/settings"),
  });

  useEffect(() => {
    if (data) setForm({ ...defaultSettings, ...data });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (data: StoreSettings) => apiRequest("PUT", "/api/settings", data),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["/api/settings"] });
      await refreshSettings();
      setIframeKey((k) => k + 1);
      toast({ title: "تم حفظ التغييرات وانعكست على المعاينة المباشرة بنجاح ✓" });
    },
    onError: (err) =>
      toast({ title: "فشل الحفظ", description: String(err), variant: "destructive" }),
  });

  const set = (key: keyof StoreSettings, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => saveMutation.mutate(form);

  const handleResetData = () => {
    setForm((f) => ({
      ...defaultSettings,
      primaryColor: f.primaryColor,
      primaryForeground: f.primaryForeground,
      backgroundColor: f.backgroundColor,
      cardBackground: f.cardBackground,
    }));
    toast({ title: "تمت إعادة تعيين بيانات المتجر للوضع الافتراضي ✓" });
  };

  const handleResetColors = () => {
    setForm((f) => ({
      ...f,
      primaryColor: defaultSettings.primaryColor,
      primaryForeground: defaultSettings.primaryForeground,
      backgroundColor: defaultSettings.backgroundColor,
      cardBackground: defaultSettings.cardBackground,
    }));
    toast({ title: "تمت إعادة تعيين الألوان للوضع الافتراضي ✓" });
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
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-2" onClick={handleResetColors}>
              <Palette className="h-3.5 w-3.5" /> إعادة تعيين الألوان
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
                <TabsTrigger value="colors" className="rounded-xl font-semibold">الألوان والتنسيق</TabsTrigger>
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

          {/* ===== LIVE DEVICE PREVIEW SECTION ===== */}
          <div className="mt-12 space-y-4 pt-8 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border shadow-sm">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <Eye className="h-5 w-5" /> معاينة المتجر المباشرة (Live Preview)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  شاهد التعديلات والألوان وتنسيق المتجر حياً كأنك على جهاز عميلك بدون مغادرة صفحة الإعدادات
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Device Switcher */}
                <div className="flex items-center bg-muted p-1 rounded-2xl border">
                  <button
                    type="button"
                    onClick={() => setDeviceMode("desktop")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      deviceMode === "desktop"
                        ? "bg-black text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" /> كمبيوتر
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceMode("mobile")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      deviceMode === "mobile"
                        ? "bg-black text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" /> موبايل
                  </button>
                </div>

                {/* Refresh iframe button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-2xl gap-1.5 text-xs font-bold border"
                  onClick={() => setIframeKey((k) => k + 1)}
                  title="إعادة تحديث المعاينة"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> تحديث
                </Button>

                {/* Open in new tab */}
                <a href="/" target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="sm" className="rounded-2xl gap-1 text-xs font-bold text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Preview Frame Container */}
            <div className="flex justify-center bg-muted/40 p-4 sm:p-8 rounded-3xl border-2 border-dashed overflow-hidden min-h-[600px] transition-all">
              {deviceMode === "desktop" ? (
                /* Desktop Browser Frame */
                <div className="w-full max-w-5xl bg-white rounded-2xl border shadow-2xl overflow-hidden flex flex-col h-[650px] transition-all">
                  {/* Browser Bar */}
                  <div className="bg-muted/80 px-4 py-2.5 border-b flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                      <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                      <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <div className="bg-white/80 border rounded-lg px-4 py-1 font-mono text-[11px] w-72 text-center text-foreground/70 shadow-inner">
                      https://almohandesstore.com
                    </div>
                    <div className="w-12 text-left font-bold text-[10px]">مباشر LIVE</div>
                  </div>
                  {/* Storefront Iframe */}
                  <iframe
                    ref={iframeRef}
                    key={iframeKey}
                    src="/"
                    title="Desktop Preview"
                    onLoad={applyColorsToIframe}
                    className="w-full flex-1 border-none bg-white"
                  />
                </div>
              ) : (
                /* Mobile Phone Frame */
                <div className="w-[380px] bg-black p-3.5 rounded-[44px] shadow-2xl border-4 border-black/80 flex flex-col h-[680px] transition-all relative">
                  {/* Speaker Notch */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                  </div>
                  {/* Screen */}
                  <div className="w-full h-full bg-white rounded-[32px] overflow-hidden pt-4 flex flex-col border">
                    <iframe
                      ref={iframeRef}
                      key={iframeKey}
                      src="/"
                      title="Mobile Preview"
                      onLoad={applyColorsToIframe}
                      className="w-full flex-1 border-none bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
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
