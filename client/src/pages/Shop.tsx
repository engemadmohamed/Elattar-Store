import { useQuery } from "@tanstack/react-query";
import { useSearch, Link, useLocation } from "wouter";
import { SlidersHorizontal, Lock } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/language-context";

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
  image?: string;
  isActive: boolean;
  parentId: string | null;
}

export default function Shop() {
  const { t, lang } = useLanguage();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const searchParam = params.get("search") || "";
  const categorySlug = params.get("category") || "";
  const onSale = params.get("onSale") === "true";
  const sort = params.get("sort") || "newest";
  const page = Number(params.get("page") || "1");

  const handleQueryChange = (updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) =>
      newParams.set(key, String(value)),
    );
    // If a filter other than page changes, reset to page 1
    if (!("page" in updates)) newParams.delete("page");
    navigate(`/shop?${newParams.toString()}`);
  };

  const { data: categories, isLoading: isLoadingCategories } = useQuery<
    Category[]
  >({
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
    enabled:
      !!categories &&
      !showSubcategories &&
      (selectedCategory ? selectedCategory.isActive : true),
  });

  const title = searchParam
    ? `${t("نتائج البحث", "Search Results")}: "${searchParam}"`
    : selectedCategory
      ? (lang === "ar" ? selectedCategory.nameAr : selectedCategory.name)
      : t("جميع المنتجات", "All Products");

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
              {title}
            </h1>
            {data && !showSubcategories && (
              <p className="text-sm text-muted-foreground mt-1">
                {data.total} {t("منتج", "products")}
              </p>
            )}
          </div>
          {!showSubcategories && (
            <div className="flex items-center gap-2">
              <Select
                value={sort}
                onValueChange={(newSort) =>
                  handleQueryChange({ sort: newSort })
                }
              >
                <SelectTrigger className="w-40">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("الأحدث", "Newest")}</SelectItem>
                  <SelectItem value="price_asc">{t("السعر: الأقل", "Price: Low")}</SelectItem>
                  <SelectItem value="price_desc">{t("السعر: الأعلى", "Price: High")}</SelectItem>
                  <SelectItem value="name">{t("الاسم", "Name")}</SelectItem>
                  <SelectItem value="best_selling">{t("الأكثر مبيعًا", "Best Selling")}</SelectItem>
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
                    {t("الكل", "All")}
                  </Button>
                </Link>
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb._id} className="flex items-center gap-2">
                    <span className="text-muted-foreground">/</span>
                    {index < breadcrumbs.length - 1 || crumb.isActive ? (
                      <Link href={`/shop?category=${crumb.slug}`}>
                        <Button
                          variant={
                            index === breadcrumbs.length - 1
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                        >
                          {lang === "ar" ? crumb.nameAr : crumb.name}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        disabled
                        className="opacity-50"
                      >
                        <Lock className="h-3 w-3 ml-1" />
                        {lang === "ar" ? crumb.nameAr : crumb.name}
                      </Button>
                    )}
                  </span>
                ))}
              </>
            ) : (
              categories
                .filter((c) => !c.parentId)
                .map((cat) =>
                  cat.isActive ? (
                    <Link key={cat._id} href={`/shop?category=${cat.slug}`}>
                      <Button variant="outline" size="sm">
                        {lang === "ar" ? cat.nameAr : cat.name}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      key={cat._id}
                      variant="outline"
                      size="sm"
                      disabled
                      className="opacity-50 pointer-events-none"
                    >
                      <Lock className="h-3 w-3 ml-1" /> {lang === "ar" ? cat.nameAr : cat.name}
                    </Button>
                  ),
                )
            )}
          </div>
        )}

        {/* Products Grid */}
        {isLoadingCategories ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : showSubcategories ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-3">
            {subcategories.map((cat) => {
              const cardContent = (
                <Card
                  className={`group transition-all duration-300 h-full ${
                    cat.isActive
                      ? "hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 cursor-pointer"
                      : "opacity-50 bg-muted/50"
                  }`}
                >
                  <CardContent className="relative p-4 flex flex-col items-center justify-center text-center h-full min-h-[100px]">
                    {!cat.isActive && (
                      <Lock className="absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center text-lg mb-2">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.nameAr} className="h-full w-full object-cover" />
                      ) : (
                        <span>{cat.icon || "📦"}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-tight">
                      {lang === "ar" ? cat.nameAr : cat.name}
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
            })}
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
            <p className="text-lg font-medium">{t("لا توجد منتجات", "No products found")}</p>
            <p className="text-sm mt-1">{t("جرب البحث بكلمة مختلفة", "Try a different search")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {data?.products.map((p, i) => (
                <div
                  key={p._id}
                  data-reveal
                  data-reveal-delay={String(Math.min(i + 1, 8))}
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => handleQueryChange({ page: page - 1 })}
                >
                  {t("السابق", "Previous")}
                </Button>
                <span className="flex items-center px-4 text-sm">
                  {t("صفحة", "Page")} {page} {t("من", "of")} {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= data.totalPages}
                  onClick={() => handleQueryChange({ page: page + 1 })}
                >
                  {t("التالي", "Next")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
