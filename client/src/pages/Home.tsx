import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
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

const HERO_IMG = "https://images.pexels.com/photos/7657377/pexels-photo-7657377.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";
const ABOUT_IMG = "https://images.pexels.com/photos/5594313/pexels-photo-5594313.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";

const GALLERY_IMAGES = [
  "https://images.pexels.com/photos/7657382/pexels-photo-7657382.jpeg?auto=compress&cs=tinysrgb&h=400&w=600",
  "https://images.pexels.com/photos/8251060/pexels-photo-8251060.jpeg?auto=compress&cs=tinysrgb&h=400&w=600",
  "https://images.pexels.com/photos/38807889/pexels-photo-38807889.jpeg?auto=compress&cs=tinysrgb&h=400&w=600",
  "https://images.pexels.com/photos/164645/pexels-photo-164645.jpeg?auto=compress&cs=tinysrgb&h=400&w=600",
  "https://images.pexels.com/photos/8478403/pexels-photo-8478403.jpeg?auto=compress&cs=tinysrgb&h=400&w=600",
  "https://images.pexels.com/photos/8850766/pexels-photo-8850766.jpeg?auto=compress&cs=tinysrgb&h=400&w=600",
];

export default function Home() {
  const { settings } = useStoreSettings();
  const { t, lang } = useLanguage();
  const [catMenuOpen, setCatMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen">
      {/* Announcement Bar */}
      {settings.showAnnouncementBar && settings.announcementBar && (
        <div className="bg-primary text-primary-foreground py-2.5 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-sm font-medium">
            {settings.announcementBar}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-muted/40 gradient-animate" />
        {/* Decorative shapes */}
        <div className="hero-blob absolute top-10 ltr:left-10 rtl:right-10 w-72 h-72 bg-primary/10 rounded-full animate-float" />
        <div className="hero-blob absolute bottom-10 ltr:right-10 rtl:left-10 w-96 h-96 bg-muted-foreground/10 rounded-full animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 ltr:right-1/4 rtl:left-1/4 w-32 h-32 border-2 border-primary/10 rounded-3xl rotate-12 animate-tilt hidden lg:block" />

        <div className="relative mx-auto max-w-7xl py-16 px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text + Category dropdown */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-primary mb-6 shadow-sm backdrop-blur animate-glow-pulse">
                <Sparkles className="h-3.5 w-3.5" />
                {settings.heroBadge}
              </div>

              {/* Clickable categories in hero */}
              {settings.showCategories && rootCategories.length > 0 && (
                <div className="relative mb-6">
                  <button
                    onClick={() => setCatMenuOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-2xl border-2 border-primary/20 bg-background/80 backdrop-blur px-5 py-3 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 group"
                  >
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {rootCategories.slice(0, 4).map((cat, i) => (
                        <div
                          key={cat._id}
                          className="h-8 w-8 rounded-full border-2 border-background overflow-hidden bg-muted flex items-center justify-center text-xs shrink-0 transition-transform duration-300 group-hover:scale-110"
                          style={{ zIndex: 10 - i }}
                        >
                          {cat.image ? (
                            <img src={cat.image} alt={catName(cat)} className="h-full w-full object-cover" />
                          ) : (
                            <span>{cat.icon || "📦"}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-semibold">
                      {t("تسوق بالفئة", "Shop by Category")}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${catMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {catMenuOpen && (
                    <div className="absolute top-full mt-2 w-full max-w-md rounded-2xl border bg-popover shadow-2xl z-50 overflow-hidden animate-scale-in origin-top">
                      <div className="p-2 grid grid-cols-2 gap-1">
                        {rootCategories.map((cat, i) => (
                          <Link
                            key={cat._id}
                            href={`/shop?category=${cat.slug}`}
                            onClick={() => setCatMenuOpen(false)}
                          >
                            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent transition-all duration-200 hover:scale-[1.02] cursor-pointer group/item animate-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                              <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center text-lg shrink-0 transition-transform duration-300 group-hover/item:scale-110 group-hover/item:rotate-3">
                                {cat.image ? (
                                  <img src={cat.image} alt={catName(cat)} className="h-full w-full object-cover" />
                                ) : (
                                  <span>{cat.icon || "📦"}</span>
                                )}
                              </div>
                              <span className="text-sm font-medium">{catName(cat)}</span>
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 group-hover/item:ltr:translate-x-1 group-hover/item:rtl:-translate-x-1 transition-all" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 leading-[1.15] animate-text-pop">
                <span className="shimmer-text">{settings.heroFeaturedTitle}</span>
                <br />
                {settings.heroTitle}
              </h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl leading-relaxed animate-fade-in-up stagger-1">
                {settings.heroDescription}
              </p>
              <div className="flex flex-wrap items-center gap-3 animate-fade-in-up stagger-2">
                <Link href="/shop">
                  <Button size="lg" className="gap-2 animate-pulse-glow group">
                    {settings.heroPrimaryButton}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
                  </Button>
                </Link>
                <Link href="/shop?sort=price_asc">
                  <Button size="lg" variant="outline" className="group">
                    {settings.heroSecondaryButton}
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className={`animate-count-up stagger-${i + 1} group cursor-default`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                        <stat.icon className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-primary">{stat.value}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero image with floating elements */}
            <div className="relative animate-scale-in">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                <img
                  src={settings.heroImageUrl || HERO_IMG}
                  alt={settings.storeName}
                  className="w-full h-[420px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Floating discount badge */}
                <div className="absolute top-4 ltr:right-4 rtl:left-4 bg-background/90 backdrop-blur rounded-2xl px-4 py-3 shadow-lg animate-float">
                  <p className="text-2xl font-bold text-primary">{settings.discountPercent}%</p>
                  <p className="text-xs text-muted-foreground">{t("خصم", "OFF")}</p>
                </div>

                {/* Floating rating card */}
                <div className="absolute bottom-4 ltr:left-4 rtl:right-4 bg-background/90 backdrop-blur rounded-2xl px-4 py-3 shadow-lg animate-float" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-xs font-medium">4.9 / 5.0</p>
                </div>

                {/* Floating new badge */}
                <div className="absolute top-1/2 ltr:-right-3 rtl:-left-3 bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-xs font-bold shadow-lg animate-float" style={{ animationDelay: "1.5s" }}>
                  {t("جديد", "NEW")}
                </div>
              </div>

              {/* Decorative dots */}
              <div className="absolute -bottom-4 ltr:-left-4 rtl:-right-4 grid grid-cols-4 gap-1.5 opacity-30 hidden sm:grid">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-y bg-card/50 py-6 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Truck, title: settings.shippingTitle, desc: settings.shippingDescription },
              { icon: Shield, title: settings.policiesTitle, desc: settings.policiesDescription },
              { icon: RefreshCw, title: t("إرجاع سهل", "Easy Returns"), desc: t("خلال 14 يوم من الاستلام", "Within 14 days") },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-primary/5 hover:scale-[1.02] group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary/20">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories grid with images */}
      {settings.showCategories && (
        <section className="py-14 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold animate-fade-in-up">{t("تسوق بالفئة", "Shop by Category")}</h2>
                <p className="text-sm text-muted-foreground mt-1 animate-fade-in-up stagger-1">{t("اختر الفئة التي تناسب احتياجاتك", "Choose what fits your needs")}</p>
              </div>
              <Link href="/shop">
                <Button variant="ghost" size="sm" className="gap-1 group">
                  {t("الكل", "All")} <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {categories
                ? rootCategories.map((cat, i) => (
                    <Link key={cat._id} href={`/shop?category=${cat.slug}`}>
                      <Card
                        className="premium-card group h-full overflow-hidden border-primary/10 hover:border-primary/40 cursor-pointer animate-flip-in"
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={catName(cat)}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-6xl transition-transform duration-500 group-hover:scale-125">
                              {cat.icon || "📦"}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-3 ltr:left-3 rtl:right-3 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                            {t("تصفح", "Browse")} <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                          </div>
                        </div>
                        <CardContent className="p-4 text-center">
                          <p className="text-base font-semibold leading-tight">{catName(cat)}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                : Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[16/10] rounded-xl" />
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {settings.showFeaturedProducts && (
        <section className="py-14 px-4 bg-muted/20">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold animate-fade-in-up">{t("أشهر المنتجات", "Featured Products")}</h2>
                <p className="text-sm text-muted-foreground mt-1 animate-fade-in-up stagger-1">{t("منتجات مختارة بعناية لك", "Handpicked for you")}</p>
              </div>
              <Link href="/shop">
                <Button variant="ghost" size="sm" className="gap-1 group">
                  {t("عرض كل شيء", "View All")} <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {productsData
                ? productsData.products.map((p, i) => (
                    <div key={p._id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                      <ProductCard product={p} />
                    </div>
                  ))
                : Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-xl" />
                  ))}
            </div>

            {productsData?.products.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-4xl mb-3">🛒</p>
                <p>{t("لم يتم إضافة منتجات بعد", "No products yet")}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Gallery Section */}
      <section className="py-14 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold animate-fade-in-up">{t("معرض الصور", "Gallery")}</h2>
            <p className="text-sm text-muted-foreground mt-1 animate-fade-in-up stagger-1">{t("اكتشف تشكيلتنا المتنوعة", "Discover our collection")}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {GALLERY_IMAGES.map((img, i) => (
              <div
                key={i}
                className={`relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer animate-zoom-in ${i === 0 || i === 3 ? "md:row-span-2 aspect-[3/4] md:aspect-auto" : "aspect-square"}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <img
                  src={img}
                  alt={`Gallery ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 ltr:left-3 rtl:right-3 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-y-0 translate-y-4">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <Sparkles className="h-3 w-3" /> {t("تشكيلة مميزة", "Featured")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discount Banner */}
      {settings.showDiscountBanner && (
        <section className="py-14 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-3xl bg-primary gradient-animate p-8 sm:p-12 text-primary-foreground shadow-2xl">
              <div className="absolute top-0 ltr:right-0 rtl:left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2 animate-float" />
              <div className="absolute bottom-0 ltr:left-0 rtl:right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 animate-float" style={{ animationDelay: "1.5s" }} />

              <div className="relative grid sm:grid-cols-2 gap-6 items-center">
                <div className="animate-fade-in-up">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-bold mb-4">
                    <Zap className="h-3.5 w-3.5" />
                    {t("خصم", "Discount")} {settings.discountPercent}%
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                    {settings.discountBannerTitle}
                  </h2>
                  <p className="text-primary-foreground/90 text-lg mb-6 max-w-md">
                    {settings.discountBannerDescription}
                  </p>
                  <Link href="/shop?onSale=true">
                    <Button size="lg" variant="secondary" className="gap-2 shadow-lg group">
                      {settings.ctaButtonText}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
                    </Button>
                  </Link>
                </div>

                {/* Social links */}
                <div className="flex sm:justify-end gap-3 animate-fade-in-up stagger-2">
                  {[
                    { icon: Instagram, href: settings.instagram },
                    { icon: Facebook, href: settings.facebook },
                    { icon: Twitter, href: settings.twitter },
                    { icon: MessageCircle, href: settings.whatsapp ? `https://wa.me/${settings.whatsapp}` : "" },
                  ].filter((s) => s.href).map((s, i) => (
                    <a
                      key={i}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center hover:bg-white/25 hover:scale-110 hover:-rotate-6 transition-all duration-300"
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

      {/* About section with image */}
      <section className="py-14 px-4 bg-muted/20">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-slide-in-right rtl:order-2 ltr:order-1">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 animate-tilt">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">{settings.aboutTitle}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {settings.aboutDescription}
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                {[
                  { icon: Truck, label: t("شحن سريع", "Fast Shipping") },
                  { icon: Shield, label: t("دفع آمن", "Secure Payment") },
                  { icon: Award, label: t("جودة عالية", "High Quality") },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
              <Link href="/about">
                <Button variant="outline" className="gap-2 group">
                  {t("اقرأ المزيد", "Read More")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="animate-slide-in-left rtl:order-1 ltr:order-2">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                <img
                  src={ABOUT_IMG}
                  alt={settings.aboutTitle}
                  className="w-full h-[300px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {settings.showRatings && (
                  <div className="absolute bottom-4 ltr:left-4 rtl:right-4 bg-background/90 backdrop-blur rounded-2xl p-4 shadow-lg animate-float">
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm font-bold">4.9 {t("من 5", "out of 5")}</p>
                    <p className="text-xs text-muted-foreground">+5000 {t("تقييم", "reviews")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <ProductSection
        title={t("الأكثر مبيعًا", "Best Sellers")}
        query="sort=best_selling"
        limit={8}
      />

      {/* Discounts */}
      <ProductSection
        title={t("عروض وخصومات", "Deals & Discounts")}
        query="onSale=true"
        limit={8}
        bgMuted
      />

      {/* Newsletter */}
      {settings.showNewsletter && (
        <section className="py-14 px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-float">
              <Heart className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3 animate-fade-in-up">{t("اشترك في نشرتنا", "Subscribe to Newsletter")}</h2>
            <p className="text-muted-foreground mb-6 animate-fade-in-up stagger-1">
              {t("كن أول من يعرف عن العروض والمنتجات الجديدة", "Be the first to know about new products and deals")}
            </p>
            <form className="flex gap-2 max-w-md mx-auto animate-fade-in-up stagger-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder={t("بريدك الإلكتروني", "Your email")}
                className="flex h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <Button type="submit" className="rounded-full gap-2 group">
                {t("اشترك", "Subscribe")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
              </Button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
