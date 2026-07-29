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
    <section className={`py-12 px-4 ${bgMuted ? "bg-muted/20" : ""}`}>
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <Link href={`/shop?${query}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              عرض الكل <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data ? (
            data.products.map((p) => <ProductCard key={p._id} product={p} />)
          ) : (
            Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
