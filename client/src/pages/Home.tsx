import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Star, Truck, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import ProductSection from "@/components/ProductSection";
import { apiRequest } from "@/lib/queryClient";

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  icon: string;
  slug: string;
  parentId: string | null;
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
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const { data: productsData } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/products", "featured"],
    queryFn: () => apiRequest("GET", "/api/products?limit=8&sort=newest"),
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/20 py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-sm text-primary mb-4 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              شركة العطار للأدوات المكتبية
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
              <span className="text-primary">Al Attar</span>
              <br />
              نصنع الجودة ونكسب الثقة{" "}
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              أقلام أدوات رسم، مستلزمات مكتبية وخردوات. جودة عالية وأسعار
              تنافسية.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/shop">
                <Button size="lg" className="gap-2">
                  تسوق الآن <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/shop?sort=price_asc">
                <Button size="lg" variant="outline">
                  أفضل الأسعار
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">تسوق بالفئة</h2>
            <Link href="/shop">
              <Button variant="ghost" size="sm" className="gap-1">
                الكل <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {categories
              ? categories
                  .filter((c) => !c.parentId)
                  .slice(0, 6)
                  .map((cat) => (
                    <Link key={cat._id} href={`/shop?category=${cat.slug}`}>
                      <Card className="group hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 transition-all duration-300 cursor-pointer">
                        <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                          <span className="text-3xl inline-block transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
                            {cat.icon}
                          </span>
                          <p className="text-xs font-medium leading-tight">
                            {cat.nameAr}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 px-4 bg-muted/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">أحدث المنتجات</h2>
            <Link href="/shop">
              <Button variant="ghost" size="sm" className="gap-1">
                عرض الكل <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {productsData
              ? productsData.products.map((p) => (
                  <ProductCard key={p._id} product={p} />
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

      {/* Top Rated */}
      <ProductSection title="الأعلى تقييمًا" query="sort=top_rated" limit={8} />

      {/* Features */}
      <section className="border-t py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Truck, title: "توصيل سريع", desc: "خلال 2-3 أيام عمل" },
              { icon: Shield, title: "ضمان الجودة", desc: "منتجات أصلية 100%" },
              { icon: RefreshCw, title: "إرجاع مجاني", desc: "خلال 7 أيام" },
              {
                icon: Star,
                title: "تقييم ممتاز",
                desc: "آلاف العملاء الراضين",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/60 group"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
