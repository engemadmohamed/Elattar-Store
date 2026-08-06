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
  // Payment & Transfer settings
  vodafoneCashNumber: string;
  instapayAddress: string;
  bankAccountDetails: string;
  paymentInstructions: string;
  enableVodafoneCash: boolean;
  enableInstapay: boolean;
  enableBankTransfer: boolean;
  enableCashOnDelivery: boolean;
  // Appearance & Layout settings
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
  heroTitle: "نصنع الجودة ونكسب الثقة",
  heroFeaturedTitle: "المهندس",
  heroDescription: "اكتشف تشكيلتنا الواسعة من الأدوات المكتبية والخردوات من أفضل العلامات التجارية العالمية. جودة استثنائية وأسعار تنافسية وتوصيل سريع.",
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
  // Payment transfer defaults
  vodafoneCashNumber: "01098154983",
  instapayAddress: "01098154983@instapay",
  bankAccountDetails: "البنك الأهلي المصري - رقم حساب: 123456789",
  paymentInstructions: "يرجى تحويل المبلغ المطلوب على إحدى طرق الدفع التالية ثم إرفاق صورة إثبات التحويل عند الطلب لتأكيد الحجز سريعاً.",
  enableVodafoneCash: true,
  enableInstapay: true,
  enableBankTransfer: true,
  enableCashOnDelivery: true,
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

const STORAGE_KEY = "al-mohandes-store-settings";

function getCachedSettings(): StoreSettings {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    // Ignore storage parse errors
  }
  return defaultSettings;
}

interface StoreSettingsContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  isLoading: boolean;
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  isLoading: false,
});

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(getCachedSettings);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await apiRequest<Partial<StoreSettings>>("GET", "/api/settings");
        if (res) {
          const merged = { ...defaultSettings, ...res };
          setSettings(merged);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // Ignore storage set errors
          }
        }
      } catch (error) {
        console.error("Failed to fetch store settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage set errors
      }
      return updated;
    });
  };

  useEffect(() => {
    const root = document.documentElement;

    const hexToHsl = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return "0 0% 0%";
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    if (settings.primaryColor) {
      root.style.setProperty("--primary", hexToHsl(settings.primaryColor));
    }
    if (settings.primaryForeground) {
      root.style.setProperty("--primary-foreground", hexToHsl(settings.primaryForeground));
    }
  }, [settings]);

  return (
    <StoreSettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
