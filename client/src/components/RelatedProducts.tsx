import { useQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";
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

export default function RelatedProducts({ productId, title = "منتجات ذات صلة" }: { productId: string; title?: string }) {
  const { data } = useQuery<Product[]>({
    queryKey: ["/api/products", productId, "related"],
    queryFn: () => apiRequest("GET", `/api/products/${productId}/related`),
  });

  if (!data || data.length === 0) return null;

  return (
    <div className="mt-16 border-t pt-10 overflow-hidden">
      <h2 className="text-2xl sm:text-3xl font-black mb-6 text-foreground" data-reveal>
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {data.map((p, i) => (
          <div
            key={p._id}
            data-reveal
            data-reveal-delay={String((i % 4) + 1)}
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
