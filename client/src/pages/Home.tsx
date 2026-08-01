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
    { value: "+5000", label: t("عميل سعيد", "Happy Customers") },
    { value: "+800", label: t("منتج متنوع", "Products") },
    { value: "4.9", label: t("تقييم العملاء", "Rating") },
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/20 gradient-animate" />
        <div className="hero-blob absolute top-10 ltr:left-10 rtl:right-10 w-72 h-72 bg-primary/20 rounded-full animate-float" />
        <div className="hero-blob absolute bottom-10 ltr:right-10 rtl:left-10 w-96 h-96 bg-accent/40 rounded-full animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-7xl py-16 px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text + Category dropdown */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-primary mb-6 shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                {settings.heroBadge}
              </div>

              {/* Clickable categories in hero */}
              {settings.showCategories && rootCategories.length > 0 && (
                <div className="relative mb-6">
                  <button
                    onClick={() => setCatMenuOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-2xl border-2 border-primary/30 bg-background/80 backdrop-blur px-5 py-3 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 group"
                  >
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {rootCategories.slice(0, 4).map((cat, i) => (
                        <div
                          key={cat._id}
                          className="h-7 w-7 rounded-full border-2 border-background overflow-hidden bg-primary/10 flex items-center justify-center text-xs"
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
                              <div className="h-10 w-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center text-lg shrink-0 transition-transform duration-300 group-hover/item:scale-110">
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

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 leading-[1.15]">
                <span className="shimmer-text">{settings.heroFeaturedTitle}</span>
                <br />
                {settings.heroTitle}
              </h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl leading-relaxed">
                {settings.heroDescription}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/shop">
                  <Button size="lg" className="gap-2 animate-pulse-glow">
                    {settings.heroPrimaryButton} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </Link>
                <Link href="/shop?sort=price_asc">
                  <Button size="lg" variant="outline">
                    {settings.heroSecondaryButton}
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12">
                {stats.map((stat, i) => (
                  <div key={i} className={`animate-count-up stagger-${i + 1}`}>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero image */}
            <div className="relative animate-scale-in">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                <img
                  src={settings.heroImageUrl || HERO_IMG}
                  alt={settings.storeName}
                  className="w-full h-[420px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />

                {/* Floating badge */}
                <div className="absolute top-4 ltr:right-4 rtl:left-4 bg-background/90 backdrop-blur rounded-2xl px-4 py-3 shadow-lg animate-float">
                  <p className="text-2xl font-bold text-primary">{settings.discountPercent}%</p>
                  <p className="text-xs text-muted-foreground">{t("خصم", "OFF")}</p>
                </div>

                {/* Floating card bottom */}
                <div className="absolute bottom-4 ltr:left-4 rtl:right-4 bg-background/90 backdrop-blur rounded-2xl px-4 py-3 shadow-lg animate-float" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-xs font-medium">4.9 / 5.0</p>
                </div>
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
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-primary/5 group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
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
                <p className="text-sm text-muted-foreground mt-1">{t("اختر الفئة التي تناسب احتياجاتك", "Choose what fits your needs")}</p>
              </div>
              <Link href="/shop">
                <Button variant="ghost" size="sm" className="gap-1">
                  {t("الكل", "All")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {categories
                ? rootCategories.map((cat, i) => (
                    <Link key={cat._id} href={`/shop?category=${cat.slug}`}>
                      <Card
                        className="premium-card group h-full overflow-hidden border-primary/10 hover:border-primary/40 cursor-pointer animate-scale-in"
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/15 to-accent/30">
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                <p className="text-sm text-muted-foreground mt-1">{t("منتجات مختارة بعناية لك", "Handpicked for you")}</p>
              </div>
              <Link href="/shop">
                <Button variant="ghost" size="sm" className="gap-1">
                  {t("عرض كل شيء", "View All")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
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

      {/* Discount Banner */}
      {settings.showDiscountBanner && (
        <section className="py-14 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary/70 gradient-animate p-8 sm:p-12 text-primary-foreground shadow-2xl">
              <div className="absolute top-0 ltr:right-0 rtl:left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2" />
              <div className="absolute bottom-0 ltr:left-0 rtl:right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2" />

              <div className="relative grid sm:grid-cols-2 gap-6 items-center">
                <div className="animate-fade-in-up">
                  <div className="inline-block bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-bold mb-4">
                    {t("خصم", "Discount")} {settings.discountPercent}%
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                    {settings.discountBannerTitle}
                  </h2>
                  <p className="text-primary-foreground/90 text-lg mb-6 max-w-md">
                    {settings.discountBannerDescription}
                  </p>
                  <Link href="/shop?onSale=true">
                    <Button size="lg" variant="secondary" className="gap-2 shadow-lg">
                      {settings.ctaButtonText} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
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
                      className="h-12 w-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center hover:bg-white/25 hover:scale-110 transition-all duration-300"
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
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">{settings.aboutTitle}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {settings.aboutDescription}
              </p>
              <Link href="/about">
                <Button variant="outline" className="gap-2">
                  {t("اقرأ المزيد", "Read More")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
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
                  <div className="absolute bottom-4 ltr:left-4 rtl:right-4 bg-background/90 backdrop-blur rounded-2xl p-4 shadow-lg">
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
            <h2 className="text-2xl font-bold mb-3 animate-fade-in-up">{t("اشترك في نشرتنا", "Subscribe to Newsletter")}</h2>
            <p className="text-muted-foreground mb-6 animate-fade-in-up stagger-1">
              {t("كن أول من يعرف عن العروض والمنتجات الجديدة", "Be the first to know about new products and deals")}
            </p>
            <form className="flex gap-2 max-w-md mx-auto animate-fade-in-up stagger-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder={t("بريدك الإلكتروني", "Your email")}
                className="flex h-10 flex-1 rounded-md border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit">{t("اشترك", "Subscribe")}</Button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
