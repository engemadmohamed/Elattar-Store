import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Truck,
  Shield,
  RefreshCw,
  Sparkles,
  Star,
  ChevronDown,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Zap,
  Award,
  Heart,
  Quote,
  ChevronLeft,
  ChevronRight,
  Package,
  Pen,
  BookOpen,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import ProductSection from "@/components/ProductSection";
import { apiRequest } from "@/lib/queryClient";
import { useStoreSettings } from "@/lib/store-settings-context";
import { useLanguage } from "@/lib/language-context";

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  image?: string;
  parentId: string | null;
  isActive: boolean;
}

interface Product {
  _id: string;
  name: string;
  nameAr: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  brand?: string;
}

const HERO_IMG = "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=900&q=80";
const ABOUT_IMG = "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80";

// Map category to Unsplash image
const getCategoryImage = (cat: Category): string => {
  const name = (cat.nameAr + " " + cat.name).toLowerCase();
  if (name.includes("قلم") || name.includes("pen"))
    return "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=500&q=80";
  if (name.includes("دفتر") || name.includes("notebook") || name.includes("ورق"))
    return "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&q=80";
  if (name.includes("لون") || name.includes("color") || name.includes("رسم"))
    return "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80";
  if (name.includes("شنط") || name.includes("حقيب") || name.includes("bag"))
    return "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80";
  if (name.includes("مكتب") || name.includes("office"))
    return "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&q=80";
  if (name.includes("حساب") || name.includes("math") || name.includes("ألة"))
    return "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&q=80";
  if (name.includes("تعبئة") || name.includes("pack") || name.includes("صندوق"))
    return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80";
  if (name.includes("طلاب") || name.includes("student"))
    return "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=80";
  return "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500&q=80";
};

// Static reviews data
const REVIEWS = [
  {
    id: 1,
    name: "أحمد محمد",
    avatar: "أ",
    rating: 5,
    date: "يناير 2026",
    text: "منتجات رائعة وجودة ممتازة! الشحن وصل في الوقت المحدد والتغليف كان احترافي جداً. سأتسوق مرة أخرى بكل تأكيد.",
    product: "طقم أقلام فاخر",
    verified: true,
  },
  {
    id: 2,
    name: "سارة علي",
    avatar: "س",
    rating: 5,
    date: "ديسمبر 2025",
    text: "متجر ممتاز وأسعار معقولة جداً. الدفاتر التي اشتريتها كانت بجودة عالية ومواد ممتازة. خدمة العملاء كانت متعاونة ومحترفة.",
    product: "مجموعة دفاتر",
    verified: true,
  },
  {
    id: 3,
    name: "محمد حسن",
    avatar: "م",
    rating: 5,
    date: "نوفمبر 2025",
    text: "تجربة تسوق رائعة من البداية للنهاية. الموقع سهل الاستخدام والمنتجات وصفها مطابق تماماً. شكراً للفريق المتميز!",
    product: "أدوات رسم",
    verified: true,
  },
  {
    id: 4,
    name: "فاطمة أحمد",
    avatar: "ف",
    rating: 5,
    date: "أكتوبر 2025",
    text: "اشتريت حقيبة مدرسية وكانت أفضل من المتوقع! التصميم أنيق والخامة قوية. أنصح الجميع بالتسوق من هنا.",
    product: "حقيبة مدرسية",
    verified: true,
  },
  {
    id: 5,
    name: "عمر السيد",
    avatar: "ع",
    rating: 4,
    date: "سبتمبر 2025",
    text: "خدمة ممتازة وسريعة. المنتجات بجودة عالية. الشحن كان سريع جداً ولم يتأخر. سأشتري مرة أخرى قريباً.",
    product: "مستلزمات مكتبية",
    verified: true,
  },
  {
    id: 6,
    name: "نورا خالد",
    avatar: "ن",
    rating: 5,
    date: "أغسطس 2025",
    text: "متجر رائع! الأسعار ممتازة مقارنة بالجودة المقدمة. الدعم الفني كان متعاوناً ومستعداً للمساعدة في أي وقت.",
    product: "أقلام ملونة",
    verified: true,
  },
];

// Intersection observer hook for scroll animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export default function Home() {
  const { settings } = useStoreSettings();
  const { t, lang } = useLanguage();
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const reviewsPerPage = 3;

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const { data: productsData } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/products", "featured"],
    queryFn: () => apiRequest("GET", "/api/products?limit=8&sort=newest"),
  });

  const rootCategories = categories?.filter((c) => !c.parentId && c.isActive) || [];

  const stats = [
    { value: "+5000", label: t("عميل سعيد", "Happy Customers"), icon: Heart },
    { value: "+800", label: t("منتج متنوع", "Products"), icon: Sparkles },
    { value: "4.9", label: t("تقييم العملاء", "Rating"), icon: Star },
    { value: "24/7", label: t("دعم فني", "Support"), icon: Shield },
  ];

  const catName = (cat: Category) => (lang === "ar" ? cat.nameAr : cat.name);

  const visibleReviews = REVIEWS.slice(reviewIdx, reviewIdx + reviewsPerPage);
  const canPrev = reviewIdx > 0;
  const canNext = reviewIdx + reviewsPerPage < REVIEWS.length;

  const { ref: reviewRef, inView: reviewInView } = useInView();
  const { ref: statsRef, inView: statsInView } = useInView();

  return (
    <div className="min-h-screen">
      {/* Announcement Bar */}
      {settings.showAnnouncementBar && settings.announcementBar && (
        <div className="bg-foreground text-background py-2.5 overflow-hidden">
          <div className="flex gap-0" style={{ animation: "marquee 25s linear infinite" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className="whitespace-nowrap text-sm font-medium px-8">
                {settings.announcementBar} &nbsp;&nbsp;·&nbsp;&nbsp; {settings.announcementBar}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-white">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(0 0% 0%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 0%) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Morphing animated 3D shapes */}
        <div className="absolute -top-16 -left-16 w-80 h-80 bg-foreground/5 animate-morph-shape border border-foreground/10 pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-foreground/4 animate-morph-shape pointer-events-none" style={{ animationDelay: "-7s" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-foreground/[0.02] rounded-full blur-2xl animate-pulse pointer-events-none" />

        <div className="relative mx-auto max-w-7xl py-16 px-4 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="animate-fade-in-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/15 bg-foreground/5 px-4 py-1.5 text-sm font-bold mb-6 shadow-xs animate-bounce-in">
                <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: "6s" }} />
                {settings.heroBadge}
              </div>

              {/* Category quick-nav */}
              {settings.showCategories && rootCategories.length > 0 && (
                <div className="relative mb-7">
                  <button
                    onClick={() => setCatMenuOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-2xl border-2 border-foreground/12 bg-white px-5 py-3 shadow-sm hover:shadow-md hover:border-foreground/25 transition-all duration-300 group"
                  >
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {rootCategories.slice(0, 4).map((cat, i) => (
                        <div
                          key={cat._id}
                          className="h-8 w-8 rounded-full border-2 border-white overflow-hidden bg-muted shrink-0 transition-transform duration-300 group-hover:scale-110"
                          style={{ zIndex: 10 - i }}
                        >
                          <img src={cat.image || getCategoryImage(cat)} alt={catName(cat)} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-semibold">{t("تسوق بالفئة", "Shop by Category")}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${catMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {catMenuOpen && (
                    <div className="absolute top-full mt-2 w-full max-w-sm rounded-2xl border bg-white shadow-[0_20px_60px_hsl(0_0%_0%/0.15)] z-50 overflow-hidden animate-scale-in origin-top">
                      <div className="p-2 grid grid-cols-2 gap-1">
                        {rootCategories.map((cat, i) => (
                          <Link key={cat._id} href={`/shop?category=${cat.slug}`} onClick={() => setCatMenuOpen(false)}>
                            <div
                              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent transition-all duration-200 cursor-pointer group/item"
                              style={{ animation: `fadeInUp 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s both` }}
                            >
                              <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted shrink-0 transition-transform duration-300 group-hover/item:scale-110">
                                <img src={cat.image || getCategoryImage(cat)} alt={catName(cat)} className="h-full w-full object-cover" />
                              </div>
                              <span className="text-sm font-medium leading-tight">{catName(cat)}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-[1.12] animate-text-pop">
                <span className="shimmer-text">{settings.heroFeaturedTitle}</span>
                <br />
                {settings.heroTitle}
              </h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl leading-relaxed animate-fade-in-up stagger-1">
                {settings.heroDescription}
              </p>
              <div className="flex flex-wrap items-center gap-3 animate-fade-in-up stagger-2">
                <Link href="/shop">
                  <Button size="lg" className="gap-2 rounded-xl animate-pulse-glow group px-7">
                    {settings.heroPrimaryButton}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
                  </Button>
                </Link>
                <Link href="/shop?sort=price_asc">
                  <Button size="lg" variant="outline" className="rounded-xl px-7 border-2 hover:bg-foreground hover:text-background transition-all duration-300">
                    {settings.heroSecondaryButton}
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className={`group cursor-default ${statsInView ? `animate-count-up stagger-${i + 1}` : "opacity-0"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-lg bg-foreground/8 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-foreground/15">
                        <stat.icon className="h-4 w-4 text-foreground" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative animate-scale-in">
              <div className="relative rounded-3xl overflow-hidden shadow-[0_32px_64px_hsl(0_0%_0%/0.22)] group animate-float-3d">
                <img
                  src={settings.heroImageUrl || HERO_IMG}
                  alt={settings.storeName}
                  className="w-full h-[440px] object-cover transition-transform duration-700 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* Floating discount badge */}
                <div className="absolute top-4 ltr:right-4 rtl:left-4 bg-white rounded-2xl px-4 py-3 shadow-lg animate-float">
                  <p className="text-2xl font-black">{settings.discountPercent}%</p>
                  <p className="text-xs text-muted-foreground font-medium">{t("خصم", "OFF")}</p>
                </div>

                {/* Floating rating */}
                <div className="absolute bottom-4 ltr:left-4 rtl:right-4 bg-white rounded-2xl px-4 py-3 shadow-lg animate-float" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-foreground text-foreground" />
                    ))}
                  </div>
                  <p className="text-xs font-bold">4.9 / 5.0</p>
                </div>

                {/* NEW badge */}
                <div className="absolute top-1/2 ltr:-right-3 rtl:-left-3 bg-foreground text-background rounded-full px-3 py-1.5 text-xs font-black shadow-lg animate-float" style={{ animationDelay: "1.5s" }}>
                  {t("جديد", "NEW")}
                </div>
              </div>

              {/* Decorative dots grid */}
              <div className="absolute -bottom-4 ltr:-left-4 rtl:-right-4 grid grid-cols-5 gap-1.5 opacity-20 hidden sm:grid">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-foreground" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES STRIP ===== */}
      <section className="border-y bg-foreground text-background py-5 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
            {[
              { icon: Truck, title: settings.shippingTitle, desc: settings.shippingDescription },
              { icon: Shield, title: settings.policiesTitle, desc: settings.policiesDescription },
              { icon: RefreshCw, title: t("إرجاع سهل", "Easy Returns"), desc: t("خلال 14 يوم من الاستلام", "Within 14 days") },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/10 group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white/25">
                  <f.icon className="h-5 w-5 text-background" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-background/65">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES SECTION ===== */}
      {settings.showCategories && (
        <section className="py-16 px-4 bg-white">
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="flex items-end justify-between mb-10">
              <div className={"animate-fade-in-up"}>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  {t("فئاتنا", "Our Categories")}
                </p>
                <h2 className="text-3xl font-black">{t("تسوق بالفئة", "Shop by Category")}</h2>
                <p className="text-sm text-muted-foreground mt-2">{t("اختر الفئة التي تناسب احتياجاتك", "Choose what fits your needs")}</p>
              </div>
              <Link href="/shop">
                <Button variant="outline" size="sm" className={"gap-1.5 border-2 rounded-xl group animate-fade-in stagger-3"}>
                  {t("الكل", "All")}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {categories
                ? rootCategories.map((cat, i) => (
                    <Link key={cat._id} href={`/shop?category=${cat.slug}`}>
                      <div
                        data-reveal
                        data-reveal-delay={String(Math.min(i + 1, 8))}
                        className="category-card card-shine group h-full overflow-hidden rounded-2xl border-2 border-transparent bg-white cursor-pointer"
                        style={{ boxShadow: "0 4px 24px hsl(0 0% 0% / 0.07)" }}
                      >
                        {/* Image */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          <img
                            src={cat.image || getCategoryImage(cat)}
                            alt={catName(cat)}
                            className="h-full w-full object-cover transition-transform duration-600 group-hover:scale-115"
                          />
                          {/* Dark overlay with gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                          {/* Browse button slides up */}
                          <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out">
                            <div className="flex items-center justify-center gap-1.5 text-white text-xs font-bold bg-white/15 backdrop-blur-sm rounded-xl py-2">
                              {t("تصفح المنتجات", "Browse")}
                              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                            </div>
                          </div>
                          {/* Category number badge */}
                          <div className="absolute top-2.5 rtl:left-2.5 ltr:right-2.5 h-6 w-6 rounded-full bg-white/90 backdrop-blur text-foreground text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                            {i + 1}
                          </div>
                        </div>
                        {/* Name */}
                        <div className="px-3 py-3 text-center">
                          <p className="cat-name text-sm font-bold leading-tight">{catName(cat)}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                : Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
                  ))}

            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURED PRODUCTS ===== */}
      {settings.showFeaturedProducts && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-10 animate-fade-in-up">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  {t("منتجاتنا", "Our Products")}
                </p>
                <h2 className="text-3xl font-black">{t("أشهر المنتجات", "Featured Products")}</h2>
                <p className="text-sm text-muted-foreground mt-2">{t("منتجات مختارة بعناية لك", "Handpicked for you")}</p>
              </div>
              <Link href="/shop">
                <Button variant="outline" size="sm" className="gap-1.5 border-2 rounded-xl group">
                  {t("عرض كل شيء", "View All")}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {productsData
                ? productsData.products.map((p, i) => (
                    <div
                      key={p._id}
                      data-reveal
                      data-reveal-delay={String(Math.min(i + 1, 8))}
                    >
                      <ProductCard product={p} />
                    </div>
                  ))
                : Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-xl" />
                  ))}
            </div>

            {productsData?.products.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>{t("لم يتم إضافة منتجات بعد", "No products yet")}</p>
              </div>
            )}
          </div>
        </section>
      )}



      {/* ===== DISCOUNT BANNER ===== */}
      {settings.showDiscountBanner && (
        <section className="py-16 px-4 bg-muted/20">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-8 sm:p-14 shadow-[0_24px_64px_hsl(0_0%_0%/0.20)]">
              {/* Subtle pattern */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                  backgroundSize: "24px 24px",
                }}
              />
              {/* Blobs */}
              <div className="absolute top-0 ltr:right-0 rtl:left-0 w-72 h-72 bg-white/8 rounded-full blur-3xl -translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2 animate-float" />
              <div className="absolute bottom-0 ltr:left-0 rtl:right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 animate-float" style={{ animationDelay: "1.5s" }} />

              <div className="relative grid sm:grid-cols-2 gap-8 items-center">
                <div className="animate-fade-in-up">
                  <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm font-bold mb-5">
                    <Zap className="h-3.5 w-3.5" />
                    {t("خصم", "Discount")} {settings.discountPercent}%
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">
                    {settings.discountBannerTitle}
                  </h2>
                  <p className="text-background/80 text-base mb-7 max-w-md">
                    {settings.discountBannerDescription}
                  </p>
                  <Link href="/shop?onSale=true">
                    <Button size="lg" className="bg-white text-foreground hover:bg-white/90 gap-2 rounded-xl font-bold shadow-lg group px-7">
                      {settings.ctaButtonText}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
                    </Button>
                  </Link>
                </div>

                <div className="flex sm:justify-end gap-3 animate-fade-in-up stagger-2">
                  {[
                    { icon: Instagram, href: settings.instagram },
                    { icon: Facebook, href: settings.facebook },
                    { icon: Twitter, href: settings.twitter },
                    { icon: MessageCircle, href: settings.whatsapp ? `https://wa.me/${settings.whatsapp}` : "" },
                  ]
                    .filter((s) => s.href)
                    .map((s, i) => (
                      <a
                        key={i}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-12 w-12 rounded-full bg-white/12 backdrop-blur flex items-center justify-center hover:bg-white/22 hover:scale-110 hover:-rotate-6 transition-all duration-300"
                      >
                        <s.icon className="h-5 w-5" />
                      </a>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== ABOUT SECTION ===== */}
      <section className="py-16 px-4 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="animate-slide-in-right rtl:order-2 ltr:order-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                {t("من نحن", "About Us")}
              </p>
              <div className="h-12 w-12 rounded-2xl bg-foreground flex items-center justify-center mb-5 animate-tilt">
                <Award className="h-6 w-6 text-background" />
              </div>
              <h2 className="text-3xl font-black mb-5 leading-tight">{settings.aboutTitle}</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-7">
                {settings.aboutDescription}
              </p>
              <div className="flex flex-wrap gap-4 mb-7">
                {[
                  { icon: Truck, label: t("شحن سريع", "Fast Shipping") },
                  { icon: Shield, label: t("دفع آمن", "Secure Payment") },
                  { icon: Award, label: t("جودة عالية", "High Quality") },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm border rounded-xl px-3 py-2 hover:border-foreground/30 transition-colors">
                    <div className="h-6 w-6 rounded-md bg-foreground/8 flex items-center justify-center">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
              <Link href="/about">
                <Button variant="outline" className="gap-2 rounded-xl border-2 px-6 group hover:bg-foreground hover:text-background transition-all duration-300">
                  {t("اقرأ المزيد", "Read More")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="animate-slide-in-left rtl:order-1 ltr:order-2">
              <div className="relative rounded-3xl overflow-hidden shadow-[0_24px_48px_hsl(0_0%_0%/0.14)] group">
                <img
                  src={ABOUT_IMG}
                  alt={settings.aboutTitle}
                  className="w-full h-[340px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {settings.showRatings && (
                  <div className="absolute bottom-4 ltr:left-4 rtl:right-4 bg-white rounded-2xl p-4 shadow-lg animate-float">
                    <div className="flex items-center gap-0.5 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
                      ))}
                    </div>
                    <p className="text-sm font-black">4.9 {t("من 5", "out of 5")}</p>
                    <p className="text-xs text-muted-foreground">+5000 {t("تقييم", "reviews")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BEST SELLERS ===== */}
      <ProductSection
        title={t("الأكثر مبيعًا", "Best Sellers")}
        query="sort=best_selling"
        limit={8}
      />

      {/* ===== DEALS ===== */}
      <ProductSection
        title={t("عروض وخصومات", "Deals & Discounts")}
        query="onSale=true"
        limit={8}
        bgMuted
      />

      {/* ===== REVIEWS SECTION ===== */}
      <section className="py-20 px-4 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div ref={reviewRef} className={`text-center mb-12 ${reviewInView ? "animate-fade-in-up" : "opacity-0"}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              {t("آراء عملائنا", "Customer Reviews")}
            </p>
            <h2 className="text-3xl font-black mb-3">{t("ماذا يقول عملاؤنا", "What Our Customers Say")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("آراء حقيقية من عملاء حقيقيين يثقون في منتجاتنا يومياً", "Real reviews from real customers who trust our products daily")}
            </p>

            {/* Overall Rating */}
            <div className={`inline-flex items-center gap-3 mt-5 bg-foreground text-background px-6 py-3 rounded-2xl ${reviewInView ? "animate-scale-in stagger-2" : "opacity-0"}`}>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${reviewInView ? `animate-star-pop stagger-${i + 1}` : ""} fill-background text-background`}
                  />
                ))}
              </div>
              <span className="font-black text-lg">4.9</span>
              <span className="text-background/70 text-sm">{t("من 5000+ تقييم", "from 5000+ reviews")}</span>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {visibleReviews.map((review, i) => (
              <div
                key={review.id}
                className={`review-card bg-white rounded-2xl border-2 border-transparent p-6 ${reviewInView ? `animate-review-slide stagger-${i + 1}` : "opacity-0"}`}
                style={{ boxShadow: "0 4px 24px hsl(0 0% 0% / 0.07)" }}
              >
                {/* Quote icon */}
                <div className="mb-4">
                  <Quote className="h-8 w-8 text-foreground/12" />
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 transition-colors ${idx < review.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>

                {/* Review text */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                  "{review.text}"
                </p>

                {/* Product badge */}
                <div className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-full mb-4">
                  <Package className="h-3 w-3" />
                  {review.product}
                </div>

                {/* Reviewer */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="h-10 w-10 rounded-full bg-foreground text-background text-sm font-black flex items-center justify-center shrink-0">
                    {review.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold truncate">{review.name}</p>
                      {review.verified && (
                        <span className="text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded-full font-bold shrink-0">
                          {t("موثّق", "✓")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setReviewIdx((idx) => Math.max(0, idx - reviewsPerPage))}
              disabled={!canPrev}
              className="h-10 w-10 rounded-full border-2 flex items-center justify-center disabled:opacity-30 hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {Array.from({ length: Math.ceil(REVIEWS.length / reviewsPerPage) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewIdx(i * reviewsPerPage)}
                  className={`rounded-full transition-all duration-300 ${
                    Math.floor(reviewIdx / reviewsPerPage) === i
                      ? "w-6 h-2.5 bg-foreground"
                      : "w-2.5 h-2.5 bg-foreground/25 hover:bg-foreground/50"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setReviewIdx((idx) => Math.min(REVIEWS.length - reviewsPerPage, idx + reviewsPerPage))}
              disabled={!canNext}
              className="h-10 w-10 rounded-full border-2 flex items-center justify-center disabled:opacity-30 hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      {settings.showNewsletter && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="mx-auto max-w-xl text-center">
            <div className="h-14 w-14 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-5 animate-float">
              <Heart className="h-7 w-7 text-background" />
            </div>
            <h2 className="text-2xl font-black mb-3 animate-fade-in-up">{t("اشترك في نشرتنا", "Subscribe to Newsletter")}</h2>
            <p className="text-muted-foreground mb-6 animate-fade-in-up stagger-1">
              {t("كن أول من يعرف عن العروض والمنتجات الجديدة", "Be the first to know about new products and deals")}
            </p>
            <form className="flex gap-2 max-w-sm mx-auto animate-fade-in-up stagger-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder={t("بريدك الإلكتروني", "Your email")}
                className="flex h-11 flex-1 rounded-full border-2 border-input bg-white px-5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
              />
              <Button type="submit" className="rounded-full gap-1 px-5 font-bold">
                {t("اشترك", "Subscribe")}
              </Button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
