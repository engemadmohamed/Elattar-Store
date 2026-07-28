import { ShoppingCart, Eye } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import StarRating from "@/components/StarRating";

interface Product {
  _id: string;
  name: string;
  nameAr: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  brand?: string;
  categoryId?: { name: string; nameAr: string };
  ratingAverage?: number;
  ratingCount?: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const price = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const inStock = product.stock > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    addItem({
      productId: product._id,
      name: product.name,
      nameAr: product.nameAr,
      price,
      image: product.images[0],
    });
    toast({ title: "تم الإضافة للسلة ✓", description: product.nameAr });
  };

  return (
    <Link href={`/product/${product._id}`}>
      <div className="group relative rounded-xl border bg-card hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 overflow-hidden cursor-pointer will-change-transform">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.nameAr}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-5xl">📦</div>
          )}
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-destructive">
              خصم {Math.round(((product.price - price) / product.price) * 100)}%
            </Badge>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <Badge variant="secondary">نفدت الكمية</Badge>
            </div>
          )}
          {/* Quick view overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Eye className="h-6 w-6 text-white scale-75 group-hover:scale-100 transition-transform duration-300" />
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          {product.brand && (
            <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
          )}
          <h3 className="text-sm font-medium leading-snug line-clamp-2 mb-1">{product.nameAr}</h3>
          <div className="flex items-center gap-1 mb-1.5">
            <StarRating value={product.ratingAverage || 0} readOnly size={12} />
            <span className="text-xs text-muted-foreground">({product.ratingCount || 0})</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div>
              <span className="font-bold text-primary">{formatPrice(price)}</span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through ml-1">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            <Button
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
