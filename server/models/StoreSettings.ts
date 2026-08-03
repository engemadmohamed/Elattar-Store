import mongoose, { Schema, Document } from "mongoose";

export interface IStoreSettings extends Document {
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

export const defaultSettings = {
  storeName: "المهندس",
  storeTagline: "Stationery Co.",
  storeDescription: "متجرك الموثوق للأدوات المكتبية والقلمية بجودة عالية وأسعار مناسبة.",
  phone: "+20 10 98154983",
  email: "support@almohandes.com",
  address: "القاهرة، مصر",
  announcementBar: "🚚 توصيل مجاني للطلبات فوق 500 ج.م — اطلب الآن!",
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
  showAnnouncementBar: true,
  showNewsletter: false,
  showRatings: true,
  showCategories: true,
  showFeaturedProducts: true,
  showDiscountBanner: true,
};

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    storeName: { type: String, default: defaultSettings.storeName },
    storeTagline: { type: String, default: defaultSettings.storeTagline },
    storeDescription: { type: String, default: defaultSettings.storeDescription },
    phone: { type: String, default: defaultSettings.phone },
    email: { type: String, default: defaultSettings.email },
    address: { type: String, default: defaultSettings.address },
    announcementBar: { type: String, default: defaultSettings.announcementBar },
    heroBadge: { type: String, default: defaultSettings.heroBadge },
    heroTitle: { type: String, default: defaultSettings.heroTitle },
    heroFeaturedTitle: { type: String, default: defaultSettings.heroFeaturedTitle },
    heroDescription: { type: String, default: defaultSettings.heroDescription },
    heroImageUrl: { type: String, default: defaultSettings.heroImageUrl },
    heroPrimaryButton: { type: String, default: defaultSettings.heroPrimaryButton },
    heroSecondaryButton: { type: String, default: defaultSettings.heroSecondaryButton },
    discountBannerTitle: { type: String, default: defaultSettings.discountBannerTitle },
    discountBannerDescription: { type: String, default: defaultSettings.discountBannerDescription },
    aboutTitle: { type: String, default: defaultSettings.aboutTitle },
    aboutDescription: { type: String, default: defaultSettings.aboutDescription },
    shippingTitle: { type: String, default: defaultSettings.shippingTitle },
    shippingDescription: { type: String, default: defaultSettings.shippingDescription },
    policiesTitle: { type: String, default: defaultSettings.policiesTitle },
    policiesDescription: { type: String, default: defaultSettings.policiesDescription },
    ctaButtonText: { type: String, default: defaultSettings.ctaButtonText },
    discountPercent: { type: String, default: defaultSettings.discountPercent },
    instagram: { type: String, default: defaultSettings.instagram },
    facebook: { type: String, default: defaultSettings.facebook },
    twitter: { type: String, default: defaultSettings.twitter },
    whatsapp: { type: String, default: defaultSettings.whatsapp },
    primaryColor: { type: String, default: defaultSettings.primaryColor },
    primaryForeground: { type: String, default: defaultSettings.primaryForeground },
    backgroundColor: { type: String, default: defaultSettings.backgroundColor },
    cardBackground: { type: String, default: defaultSettings.cardBackground },
    buttonStyle: { type: String, default: defaultSettings.buttonStyle },
    heroShape: { type: String, default: defaultSettings.heroShape },
    sectionSpacing: { type: String, default: defaultSettings.sectionSpacing },
    showAnnouncementBar: { type: Boolean, default: defaultSettings.showAnnouncementBar },
    showNewsletter: { type: Boolean, default: defaultSettings.showNewsletter },
    showRatings: { type: Boolean, default: defaultSettings.showRatings },
    showCategories: { type: Boolean, default: defaultSettings.showCategories },
    showFeaturedProducts: { type: Boolean, default: defaultSettings.showFeaturedProducts },
    showDiscountBanner: { type: Boolean, default: defaultSettings.showDiscountBanner },
  },
  { timestamps: true }
);

export const StoreSettings = mongoose.model<IStoreSettings>("StoreSettings", StoreSettingsSchema);
