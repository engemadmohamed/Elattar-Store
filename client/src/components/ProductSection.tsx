import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import { apiRequest } from "@/lib/queryClient";

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

export default function ProductSection({
  title,
  query,
  limit = 8,
  bgMuted = false,
}: {
  title: string;
  query: string; // extra query params, e.g. "sort=best_selling"
  limit?: number;
  bgMuted?: boolean;
}) {
  const { data } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/products", "section", query, limit],
    queryFn: () => apiRequest("GET", `/api/products?limit=${limit}&${query}`),
  });

  if (data && data.products.length === 0) return null;

  return (
    <section className={`py-16 px-4 overflow-hidden ${bgMuted ? "bg-muted/20" : "bg-white"} border-t border-border/40`}>
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8" data-reveal>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">{title}</h2>
          <Link href={`/shop?${query}`}>
            <Button variant="outline" size="sm" className="gap-1.5 border-2 rounded-xl group font-black hover:bg-black hover:text-white transition-all shadow-xs">
              عرض الكل <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {data ? (
            data.products.map((p, i) => (
              <div
                key={p._id}
                data-reveal
                data-reveal-delay={String((i % 4) + 1)}
              >
                <ProductCard product={p} />
              </div>
            ))
          ) : (
            Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-3xl" />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
