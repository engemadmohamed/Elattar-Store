import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Truck, Shield, RefreshCw, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import ProductSection from "@/components/ProductSection";
import { apiRequest } from "@/lib/queryClient";
import { useStoreSettings } from "@/lib/store-settings-context";

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  icon: string;
  slug: string;
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

export default function Home() {
  const { settings } = useStoreSettings();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const { data: productsData } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/products", "featured"],
    queryFn: () => apiRequest("GET", "/api/products?limit=8&sort=newest"),
  });

  const stats = [
    { value: "+5000", label: "عميل سعيد" },
    { value: "+800", label: "منتج متنوع" },
    { value: "4.9", label: "تقييم العملاء" },
  ];

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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/30 gradient-animate" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-7xl py-20 px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-primary mb-6 shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                {settings.heroBadge}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 leading-[1.15]">
                <span className="text-primary">{settings.heroFeaturedTitle}</span>
                <br />
                {settings.heroTitle}
              </h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl leading-relaxed">
                {settings.heroDescription}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/shop">
                  <Button size="lg" className="gap-2 animate-pulse-glow">
                    {settings.heroPrimaryButton} <ArrowRight className="h-4 w-4" />
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

            {/* Right: Hero image / floating cards */}
            <div className="relative animate-scale-in">
              {settings.heroImageUrl ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={settings.heroImageUrl}
                    alt={settings.storeName}
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              ) : (
                <div className="relative h-[400px] flex items-center justify-center">
                  {/* Floating product cards */}
                  <div className="absolute top-0 right-8 w-48 animate-float">
                    <Card className="overflow-hidden shadow-xl border-primary/20">
                      <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/40 flex items-center justify-center text-6xl">
                        📓
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">دفاتر فاخرة</p>
                        <p className="text-primary font-bold">٨٩ ج.م</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="absolute bottom-0 left-8 w-48 animate-float" style={{ animationDelay: "1.5s" }}>
                    <Card className="overflow-hidden shadow-xl border-primary/20">
                      <div className="aspect-square bg-gradient-to-br from-accent/40 to-primary/20 flex items-center justify-center text-6xl">
                        ✒️
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">أقلام فاخرة</p>
                        <p className="text-primary font-bold">١٢٩ ج.م</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 animate-float" style={{ animationDelay: "0.8s" }}>
                    <Card className="overflow-hidden shadow-2xl border-primary/30 bg-card/80 backdrop-blur">
                      <div className="aspect-square bg-gradient-to-br from-primary/30 to-accent/50 flex items-center justify-center text-7xl">
                        🎨
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">أدوات رسم احترافية</p>
                        <p className="text-primary font-bold">٢٤٩ ج.م</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
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
              { icon: RefreshCw, title: "إرجاع سهل", desc: "خلال 14 يوم من الاستلام" },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-primary/5 group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
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

      {/* Categories */}
      {settings.showCategories && (
        <section className="py-14 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold animate-fade-in-up">تسوق بالفئة</h2>
                <p className="text-sm text-muted-foreground mt-1">اختر الفئة التي تناسب احتياجاتك</p>
              </div>
              <Link href="/shop">
                <Button variant="ghost" size="sm" className="gap-1">
                  الكل <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {categories
                ? categories
                    .filter((c) => !c.parentId)
                    .map((cat, i) => {
                      const cardContent = (
                        <Card
                          className={`group transition-all duration-300 h-full min-h-[100px] hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/50 ${
                            cat.isActive ? "cursor-pointer" : "opacity-50 bg-muted/50"
                          } animate-scale-in`}
                          style={{ animationDelay: `${i * 0.05}s` }}
                        >
                          <CardContent className="relative p-4 flex flex-col items-center justify-center text-center h-full">
                            <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-125">
                              {cat.icon || "📦"}
                            </div>
                            <p className="text-xs font-medium leading-tight">
                              {cat.nameAr}
                            </p>
                          </CardContent>
                        </Card>
                      );

                      return cat.isActive ? (
                        <Link key={cat._id} href={`/shop?category=${cat.slug}`}>
                          {cardContent}
                        </Link>
                      ) : (
                        <div key={cat._id} className="pointer-events-none">
                          {cardContent}
                        </div>
                      );
                    })
                : Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
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
                <h2 className="text-2xl font-bold animate-fade-in-up">أشهر المنتجات</h2>
                <p className="text-sm text-muted-foreground mt-1">منتجات مختارة بعناية لك</p>
              </div>
              <Link href="/shop">
                <Button variant="ghost" size="sm" className="gap-1">
                  عرض كل شيء <ArrowRight className="h-4 w-4" />
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
                <p>لم يتم إضافة منتجات بعد</p>
                <p className="text-sm mt-1">ادخل لوحة التحكم وأضف منتجاتك</p>
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
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative grid sm:grid-cols-2 gap-6 items-center">
                <div className="animate-fade-in-up">
                  <div className="inline-block bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-bold mb-4">
                    خصم {settings.discountPercent}%
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                    {settings.discountBannerTitle}
                  </h2>
                  <p className="text-primary-foreground/90 text-lg mb-6 max-w-md">
                    {settings.discountBannerDescription}
                  </p>
                  <Link href="/shop?onSale=true">
                    <Button size="lg" variant="secondary" className="gap-2 shadow-lg">
                      {settings.ctaButtonText} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Social links */}
                <div className="flex sm:justify-end gap-3 animate-fade-in-up stagger-2">
                  {[
                    { label: "Instagram", href: settings.instagram },
                    { label: "Facebook", href: settings.facebook },
                    { label: "Twitter", href: settings.twitter },
                    { label: "WhatsApp", href: settings.whatsapp ? `https://wa.me/${settings.whatsapp}` : "" },
                  ].filter((s) => s.href).map((s, i) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-sm font-bold hover:bg-white/25 hover:scale-110 transition-all duration-300"
                    >
                      {s.label.charAt(0)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About section */}
      <section className="py-14 px-4 bg-muted/20">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-slide-in-right">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">{settings.aboutTitle}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {settings.aboutDescription}
              </p>
              <Link href="/about">
                <Button variant="outline" className="gap-2">
                  اقرأ المزيد <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {settings.showRatings && (
              <div className="animate-slide-in-left">
                <Card className="p-8 border-primary/20">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-2xl font-bold mb-2">4.9 من 5</p>
                  <p className="text-muted-foreground mb-4">
                    تقييم عملائنا هو أفضل دليل على جودة منتجاتنا وخدمتنا
                  </p>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary">+5000</p>
                      <p className="text-xs text-muted-foreground">عميل</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary">+800</p>
                      <p className="text-xs text-muted-foreground">منتج</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary">14 يوم</p>
                      <p className="text-xs text-muted-foreground">إرجاع</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <ProductSection
        title="الأكثر مبيعًا"
        query="sort=best_selling"
        limit={8}
      />

      {/* Discounts */}
      <ProductSection
        title="عروض وخصومات"
        query="onSale=true"
        limit={8}
        bgMuted
      />

      {/* Newsletter */}
      {settings.showNewsletter && (
        <section className="py-14 px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold mb-3 animate-fade-in-up">اشترك في نشرتنا البريدية</h2>
            <p className="text-muted-foreground mb-6 animate-fade-in-up stagger-1">
              كن أول من يعرف عن العروض والمنتجات الجديدة
            </p>
            <form className="flex gap-2 max-w-md mx-auto animate-fade-in-up stagger-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="بريدك الإلكتروني"
                className="flex h-10 flex-1 rounded-md border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit">اشترك</Button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
