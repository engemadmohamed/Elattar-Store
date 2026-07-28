import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ShoppingCart, ArrowLeft, Package, Star, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import ProductReviews from "@/components/ProductReviews";
import RelatedProducts from "@/components/RelatedProducts";

interface Product {
  _id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  brand?: string;
  sku: string;
  tags: string[];
  categoryId?: { name: string; nameAr: string };
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", id],
    queryFn: () => apiRequest("GET", `/api/products/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-xl font-medium">المنتج غير موجود</p>
          <Link href="/shop"><Button className="mt-4">العودة للمتجر</Button></Link>
        </div>
      </div>
    );
  }

  const price = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const inStock = product.stock > 0;

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product._id,
        name: product.name,
        nameAr: product.nameAr,
        price,
        image: product.images[0],
      });
    }
    toast({ title: "تم إضافة المنتج للسلة ✓", description: `${qty}x ${product.nameAr}` });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.nameAr, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "تم نسخ الرابط" });
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">الرئيسية</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-foreground">المنتجات</Link>
          <span>/</span>
          <span className="text-foreground">{product.nameAr}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl border bg-muted overflow-hidden">
              {product.images[selectedImg] ? (
                <img src={product.images[selectedImg]} alt={product.nameAr} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-8xl">📦</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`h-16 w-16 rounded-lg border-2 overflow-hidden shrink-0 transition-colors ${selectedImg === i ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            {product.categoryId && (
              <Badge variant="secondary">{product.categoryId.nameAr}</Badge>
            )}

            <h1 className="text-2xl font-bold">{product.nameAr}</h1>

            {product.brand && (
              <p className="text-sm text-muted-foreground">
                الماركة: <span className="font-medium text-foreground">{product.brand}</span>
              </p>
            )}

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">{formatPrice(price)}</span>
              {hasDiscount && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
              )}
              {hasDiscount && (
                <Badge className="bg-destructive">
                  وفر {Math.round(((product.price - price) / product.price) * 100)}%
                </Badge>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${inStock ? "bg-green-500" : "bg-red-500"}`} />
              <span className={`text-sm font-medium ${inStock ? "text-green-600" : "text-red-500"}`}>
                {inStock ? `متوفر (${product.stock} قطعة)` : "نفدت الكمية"}
              </span>
            </div>

            <Separator />

            {/* Description */}
            {product.descriptionAr && (
              <div>
                <h3 className="font-medium mb-2">الوصف</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.descriptionAr}</p>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            {inStock && (
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-md">
                  <button
                    className="px-3 py-2 text-lg hover:bg-muted transition-colors"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >-</button>
                  <span className="px-4 py-2 font-medium w-12 text-center">{qty}</span>
                  <button
                    className="px-3 py-2 text-lg hover:bg-muted transition-colors"
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  >+</button>
                </div>
                <Button className="flex-1 gap-2 h-11" onClick={handleAddToCart}>
                  <ShoppingCart className="h-4 w-4" /> إضافة للسلة
                </Button>
                <Button variant="outline" size="icon" className="h-11 w-11" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* SKU */}
            <p className="text-xs text-muted-foreground">رمز المنتج (SKU): {product.sku}</p>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12 max-w-2xl">
          <ProductReviews productId={product._id} />
        </div>

        {/* Related products */}
        <div className="mt-12">
          <RelatedProducts productId={product._id} />
        </div>
      </div>
    </div>
  );
}
