import { useQuery } from "@tanstack/react-query";
import { useSearch, Link } from "wouter";
import { SlidersHorizontal, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  categoryId?: { name: string; nameAr: string };
}

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  parentId: string | null;
}

export default function Shop() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const searchParam = params.get("search") || "";
  const categorySlug = params.get("category") || "";
  const onSale = params.get("onSale") === "true";

  const [sort, setSort] = useState(params.get("sort") || "newest");
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  // Find category and its children/parents
  const selectedCategory = categories?.find((c) => c.slug === categorySlug);
  const subcategories = useMemo(() => {
    if (!categories || !selectedCategory) return [];
    return categories.filter((c) => c.parentId === selectedCategory._id);
  }, [categories, selectedCategory]);

  const showSubcategories = subcategories && subcategories.length > 0;

  const queryParams = new URLSearchParams({
    limit: "24",
    page: String(page),
    sort,
    ...(categorySlug ? { category: categorySlug } : {}),
    ...(searchParam ? { search: searchParam } : {}),
    ...(onSale ? { onSale: "true" } : {}),
  });

  const { data, isLoading } = useQuery<{
    products: Product[];
    total: number;
    totalPages: number;
  }>({
    queryKey: ["/api/products", categorySlug, searchParam, sort, page, onSale],
    queryFn: () => apiRequest("GET", `/api/products?${queryParams}`),
    // Only fetch products if we are not showing subcategories
    enabled: !showSubcategories,
  });

  useEffect(() => {
    setPage(1);
  }, [categorySlug, searchParam, sort, onSale]);

  const title = searchParam
    ? `نتائج البحث: "${searchParam}"`
    : selectedCategory
      ? selectedCategory.nameAr
      : "جميع المنتجات";

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!selectedCategory || !categories) return [];
    const crumbs: Category[] = [];
    let current: Category | undefined = selectedCategory;
    while (current) {
      crumbs.unshift(current);
      current = categories.find((c) => c._id === current!.parentId);
    }
    return crumbs;
  }, [categories, selectedCategory]);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {selectedCategory?.icon} {title}
            </h1>
            {data && !showSubcategories && (
              <p className="text-sm text-muted-foreground mt-1">
                {data.total} منتج
              </p>
            )}
          </div>
          {!showSubcategories && (
            <div className="flex items-center gap-2">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-40">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">الأحدث</SelectItem>
                  <SelectItem value="price_asc">السعر: الأقل</SelectItem>
                  <SelectItem value="price_desc">السعر: الأعلى</SelectItem>
                  <SelectItem value="name">الاسم</SelectItem>
                  <SelectItem value="best_selling">الأكثر مبيعًا</SelectItem>
                  <SelectItem value="top_rated">الأعلى تقييمًا</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Category Pills */}
        {categories && !searchParam && (
          <div className="flex flex-wrap gap-2 mb-6">
            {breadcrumbs.length > 0 ? (
              <>
                <Link href="/shop">
                  <Button variant="outline" size="sm">
                    الكل
                  </Button>
                </Link>
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb._id} className="flex items-center gap-2">
                    <span className="text-muted-foreground">/</span>
                    <Link href={`/shop?category=${crumb.slug}`}>
                      <Button
                        variant={
                          index === breadcrumbs.length - 1
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                      >
                        {crumb.nameAr}
                      </Button>
                    </Link>
                  </span>
                ))}
              </>
            ) : (
              categories
                .filter((c) => !c.parentId)
                .map((cat) => (
                  <Link key={cat._id} href={`/shop?category=${cat.slug}`}>
                    <Button variant="outline" size="sm">
                      {cat.icon} {cat.nameAr}
                    </Button>
                  </Link>
                ))
            )}
          </div>
        )}

        {/* Products Grid */}
        {showSubcategories ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {subcategories.map((cat) => (
              <Link key={cat._id} href={`/shop?category=${cat.slug}`}>
                <Card className="group hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center h-full">
                    <span className="text-4xl inline-block transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
                      {cat.icon}
                    </span>
                    <p className="text-sm font-medium leading-tight">
                      {cat.nameAr}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : data?.products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-medium">لا توجد منتجات</p>
            <p className="text-sm mt-1">جرب البحث بكلمة مختلفة</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {data?.products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  السابق
                </Button>
                <span className="flex items-center px-4 text-sm">
                  صفحة {page} من {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  التالي
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
