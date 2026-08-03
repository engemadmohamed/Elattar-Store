import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "./queryClient";

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  storeDescription: string;
  phone: string;
  email: string;
  address: string;
  announcementBar: string;
  heroBadge: string;
  heroTitle: string;
  heroFeaturedTitle: string;
  heroDescription: string;
  heroImageUrl: string;
  heroPrimaryButton: string;
  heroSecondaryButton: string;
  discountBannerTitle: string;
  discountBannerDescription: string;
  aboutTitle: string;
  aboutDescription: string;
  shippingTitle: string;
  shippingDescription: string;
  policiesTitle: string;
  policiesDescription: string;
  ctaButtonText: string;
  discountPercent: string;
  instagram: string;
  facebook: string;
  twitter: string;
  whatsapp: string;
  primaryColor: string;
  primaryForeground: string;
  backgroundColor: string;
  cardBackground: string;
  buttonStyle: string;
  heroShape: string;
  sectionSpacing: string;
  showAnnouncementBar: boolean;
  showNewsletter: boolean;
  showRatings: boolean;
  showCategories: boolean;
  showFeaturedProducts: boolean;
  showDiscountBanner: boolean;
}

const defaultSettings: StoreSettings = {
  storeName: "المهندس",
  storeTagline: "Stationery Co.",
  storeDescription: "متجرك الموثوق للأدوات المكتبية والقلمية بجودة عالية وأسعار مناسبة.",
  phone: "+20 10 98154983",
  email: "support@almohandes.com",
  address: "القاهرة، مصر",
  announcementBar: "",
  heroBadge: "تشكيلة 2026 وصلت الآن",
  heroTitle: "الجودة تبني الثقة وتصنع الجودة",
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
  showAnnouncementBar: false,
  showNewsletter: false,
  showRatings: true,
  showCategories: true,
  showFeaturedProducts: true,
  showDiscountBanner: true,
};

interface StoreSettingsContextType {
  settings: StoreSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  refreshSettings: async () => {},
});

function hexToHsl(hex: string): string {
  if (!hex || !hex.startsWith("#")) return "0 0% 7%";
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
  if (!hex || !hex.startsWith("#")) return "0 0% 100%";
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

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const data = await apiRequest<StoreSettings>("GET", "/api/settings");
      setSettings({ ...defaultSettings, ...data });
    } catch (e) {
      console.warn("Failed to refresh settings:", e);
    }
  };

  useEffect(() => {
    refreshSettings().finally(() => setIsLoading(false));
  }, []);

  // Dynamically apply settings colors to CSS root variables
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;

    if (settings.primaryColor) {
      const primaryHsl = hexToHsl(settings.primaryColor);
      root.style.setProperty("--primary", primaryHsl);
      root.style.setProperty("--ring", primaryHsl);
      root.style.setProperty("--sidebar-primary", primaryHsl);
      root.style.setProperty("--sidebar-ring", primaryHsl);
    }
    if (settings.primaryForeground) {
      root.style.setProperty("--primary-foreground", hexToHslRaw(settings.primaryForeground));
    }
    if (settings.backgroundColor) {
      root.style.setProperty("--background", hexToHslRaw(settings.backgroundColor));
    }
    if (settings.cardBackground) {
      root.style.setProperty("--card", hexToHslRaw(settings.cardBackground));
    }
  }, [settings]);

  return (
    <StoreSettingsContext.Provider value={{ settings, isLoading, refreshSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export const useStoreSettings = () => useContext(StoreSettingsContext);
