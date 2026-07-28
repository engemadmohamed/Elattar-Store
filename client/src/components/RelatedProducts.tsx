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
    <div>
      <h3 className="font-medium mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
