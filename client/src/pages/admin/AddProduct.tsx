import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Plus, X, Upload, QrCode, Copy, Check } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import QRModal from "@/components/QRModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ADMIN_BASE } from "@/lib/admin-path";
import { compressImage } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  parentId: string | null;
}

const PRESET_COLORS = [
  { label: "أحمر", bg: "bg-red-500 text-white border-red-600" },
  { label: "أزرق", bg: "bg-blue-500 text-white border-blue-600" },
  { label: "أسود", bg: "bg-black text-white border-black" },
  { label: "أخضر", bg: "bg-green-500 text-white border-green-600" },
  { label: "أصفر", bg: "bg-yellow-400 text-black border-yellow-500" },
  { label: "أبيض", bg: "bg-white text-black border-gray-300" },
  { label: "رمادي", bg: "bg-gray-500 text-white border-gray-600" },
  { label: "بني", bg: "bg-amber-800 text-white border-amber-900" },
  { label: "وردي", bg: "bg-pink-500 text-white border-pink-600" },
  { label: "بنفسجي", bg: "bg-purple-500 text-white border-purple-600" },
  { label: "برتقالي", bg: "bg-orange-500 text-white border-orange-600" },
  { label: "شفاف", bg: "bg-slate-100 text-slate-700 border-slate-300" },
];

// Helper function to find the path to a category from root to child
const findCategoryPath = (
  allCategories: Category[],
  categoryId: string,
): string[] => {
  const path: string[] = [];
  let currentId: string | null = categoryId ? String(categoryId) : null;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const category = allCategories.find((c) => String(c._id) === currentId);
    if (category) {
      path.unshift(String(category._id));
      const parent = category.parentId;
      if (!parent) {
        currentId = null;
      } else if (typeof parent === "object" && parent !== null) {
        currentId = String((parent as any)._id || "");
      } else {
        currentId = String(parent);
      }
    } else {
      currentId = null;
    }
  }
  return path;
};

interface ExistingProduct {
  _id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  salePrice?: number;
  stock: number;
  categoryId: { _id: string; name: string; nameAr: string; slug: string } | string;
  sku: string;
  brand?: string;
  saleUnit?: string;
  colors?: string[];
  images: string[];
  isActive: boolean;
}

export default function AddProduct() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    price: "",
    salePrice: "",
    stock: "0",
    categoryId: "",
    brand: "",
    saleUnit: "piece",
    colors: [] as string[],
    images: [] as string[],
    isActive: true,
  });
  const [colorInput, setColorInput] = useState("");
  const [categoryChain, setCategoryChain] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const [savedProductSku, setSavedProductSku] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [formPopulated, setFormPopulated] = useState(false);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const { data: existingProduct, isLoading: isLoadingProduct } =
    useQuery<ExistingProduct>({
      queryKey: ["/api/products", id],
      queryFn: () => apiRequest("GET", `/api/products/${id}`),
      enabled: isEdit,
    });

  const handleCategoryChange = (level: number, value: string) => {
    // Truncate the chain at the current level
    const newChain = categoryChain.slice(0, level);
    // Add the new value if it's not empty
    if (value) {
      newChain.push(value);
    }
    setCategoryChain(newChain);

    // The form's categoryId is the last selected category in the chain.
    // If the user selects the placeholder, the categoryId becomes the parent's ID.
    const finalCategoryId =
      newChain.length > 0 ? newChain[newChain.length - 1] : "";
    set("categoryId", finalCategoryId);
  };

  useEffect(() => {
    if (isEdit && existingProduct && categories) {
      const rawCat = existingProduct.categoryId;
      const productCategoryId = typeof rawCat === "object" && rawCat !== null ? String(rawCat._id) : String(rawCat || "");
      setSavedProductSku(existingProduct.sku || "");

      if (productCategoryId) {
        const path = findCategoryPath(categories, productCategoryId);
        setCategoryChain(path);
      }

      setForm({
        name: existingProduct.name || "",
        nameAr: existingProduct.nameAr || "",
        description: existingProduct.description || "",
        descriptionAr: existingProduct.descriptionAr || "",
        price: existingProduct.price !== undefined ? String(existingProduct.price) : "",
        salePrice: existingProduct.salePrice ? String(existingProduct.salePrice) : "",
        stock: existingProduct.stock !== undefined ? String(existingProduct.stock) : "0",
        categoryId: productCategoryId,
        brand: existingProduct.brand || "",
        saleUnit: existingProduct.saleUnit || "piece",
        colors: existingProduct.colors || [],
        images: existingProduct.images || [],
        isActive: existingProduct.isActive ?? true,
      });
    }
  }, [existingProduct, categories]);

  const set = (key: string, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val as any }));

  const addColor = () => {
    if (colorInput.trim()) {
      set("colors", [...form.colors, colorInput.trim()]);
      setColorInput("");
    }
  };

  const addImageUrl = () => {
    if (imageUrl.trim()) {
      set("images", [...form.images, imageUrl.trim()]);
      setImageUrl("");
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const token = localStorage.getItem("al-mohandes-token");
    try {
      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressedBlob, file.name || "product.jpg");
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        toast({
          title: "فشل رفع الصورة",
          description: data.message || `خطأ من السيرفر (${res.status})`,
          variant: "destructive",
        });
        return;
      }
      set("images", [...form.images, data.url]);
      toast({ title: "تم رفع الصورة ✓" });
    } catch (err) {
      toast({
        title: "فشل رفع الصورة",
        description: "تعذر الاتصال بالسيرفر، تأكد من الاتصال بالإنترنت",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = {
        ...data,
        price: parseFloat(data.price),
        salePrice: data.salePrice ? parseFloat(data.salePrice) : undefined,
        stock: parseInt(data.stock),
      };
      return apiRequest<ExistingProduct>(
        isEdit ? "PUT" : "POST",
        isEdit ? `/api/products/${id}` : "/api/products",
        payload,
      );
    },
    onSuccess: (updatedProduct) => {
      qc.invalidateQueries({ queryKey: ["/api/products/admin/all"] });

      if (isEdit) {
        qc.setQueryData(["/api/products", id], updatedProduct);
      } else {
        // Reset form for creating a new product so admin can add another without reloading
        setForm({
          name: "",
          nameAr: "",
          description: "",
          descriptionAr: "",
          price: "",
          salePrice: "",
          stock: "0",
          categoryId: "",
          brand: "",
          saleUnit: "piece",
          colors: [],
          images: [],
          isActive: true,
        });
        setCategoryChain([]);
        setColorInput("");
        setImageUrl("");
      }

      setSavedProductId(updatedProduct._id);
      setSavedProductSku(updatedProduct.sku);
      toast({
        title: isEdit ? "تم تحديث المنتج ✓" : "تم إضافة المنتج بنجاح ✓",
        description: isEdit ? "تم حفظ جميع التعديلات" : "تم تفريغ الحقول لإمكانية إضافة منتج جديد",
      });
    },
    onError: (err) =>
      toast({
        title: "فشل الحفظ",
        description: String(err),
        variant: "destructive",
      }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr || !form.price || !form.categoryId) {
      toast({ title: "الرجاء ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <AdminLayout
      title={isEdit ? "تعديل منتج" : "إضافة منتج جديد"}
      subtitle={isEdit ? form.nameAr : "أدخل تفاصيل ومواصفات المنتج جديد"}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`${ADMIN_BASE}/products`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {isEdit ? "تعديل المنتج" : "إضافة منتج جديد"}
              </h1>
            </div>
          </div>
          {savedProductId && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowQR(true)}
            >
              <QrCode className="h-4 w-4" /> طباعة QR Code
            </Button>
          )}
        </div>

        {isEdit && isLoadingProduct ? (
          <div className="max-w-4xl space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">معلومات المنتج</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>اسم المنتج *</Label>
                      <Input
                        value={form.nameAr}
                        onChange={(e) => {
                          const val = e.target.value;
                          set("nameAr", val);
                          set("name", val); // Also set english name for backend requirement
                        }}
                        placeholder="مثال: قلم بيك أزرق"
                        required
                      />
                    </div>
                    <div>
                      <Label>الوصف</Label>
                      <Textarea
                        rows={3}
                        value={form.descriptionAr}
                        onChange={(e) => set("descriptionAr", e.target.value)}
                        placeholder="وصف تفصيلي للمنتج..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing & Stock */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">السعر والمخزون</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>السعر (ج.م) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={form.price}
                          onChange={(e) => set("price", e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div>
                        <Label>سعر البيع (خصم)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={form.salePrice}
                          onChange={(e) => set("salePrice", e.target.value)}
                          placeholder="اتركه فارغاً"
                        />
                      </div>
                      <div>
                        <Label>الكمية المتاحة *</Label>
                        <Input
                          type="number"
                          min="0"
                          value={form.stock}
                          onChange={(e) => set("stock", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label>الماركة / العلامة التجارية</Label>
                      <Input
                        value={form.brand}
                        onChange={(e) => set("brand", e.target.value)}
                        placeholder="مثال: Bic, Faber-Castell"
                      />
                    </div>
                    <div>
                      <Label>وحدة البيع</Label>
                      <Select
                        value={form.saleUnit}
                        onValueChange={(v) => set("saleUnit", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="piece">قطعة</SelectItem>
                          <SelectItem value="box">علبة</SelectItem>
                          <SelectItem value="jar">برطمان</SelectItem>
                          <SelectItem value="stand">استاند</SelectItem>
                          <SelectItem value="carton">كرتونة</SelectItem>
                          <SelectItem value="dozen">دستة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ألوان المنتج المتاحة (اختياري)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Preset Color Choices */}
                    <div>
                      <Label className="mb-2.5 block text-xs font-bold text-muted-foreground">
                        اختر من الألوان المتاحة بنقرة واحدة:
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((preset) => {
                          const isSelected = form.colors.includes(preset.label);
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  set("colors", form.colors.filter((c) => c !== preset.label));
                                } else {
                                  set("colors", [...form.colors, preset.label]);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                isSelected
                                  ? `${preset.bg} ring-2 ring-offset-1 ring-black scale-105 shadow-sm`
                                  : "bg-muted/40 text-foreground border-input hover:bg-accent"
                              }`}
                            >
                              <span>{preset.label}</span>
                              {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 opacity-50" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Color Input */}
                    <div className="pt-2 border-t">
                      <Label className="mb-1.5 block text-xs text-muted-foreground">أو اكتب اسم لون إضافي:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          placeholder="مثلاً: فيروزي، كحلي..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addColor();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addColor}>
                          <Plus className="h-4 w-4" /> إضافة
                        </Button>
                      </div>
                    </div>

                    {/* Selected Colors Summary */}
                    {form.colors.length > 0 && (
                      <div className="pt-2 border-t">
                        <Label className="mb-1.5 block text-xs font-bold">الألوان المختارة للمنتج ({form.colors.length}):</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {form.colors.map((c, i) => (
                            <Badge key={i} variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border bg-black text-white">
                              {c}
                              <button
                                type="button"
                                onClick={() => set("colors", form.colors.filter((_, j) => j !== i))}
                                className="text-white/80 hover:text-white transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Images */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">صور المنتج</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {form.images.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {form.images.map((img, i) => (
                          <div key={i} className="relative h-20 w-20 group">
                            <img
                              src={img}
                              alt=""
                              className="h-full w-full object-cover rounded-xl border shadow-sm"
                            />
                            {/* Copy URL Button */}
                            <button
                              type="button"
                              title="نسخ رابط الصورة"
                              onClick={() => {
                                navigator.clipboard.writeText(img);
                                toast({ title: "تم نسخ رابط الصورة بنجاح ✓" });
                              }}
                              className="absolute -top-1.5 -left-1.5 h-6 w-6 rounded-full bg-black text-white flex items-center justify-center shadow hover:scale-110 transition-transform"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            {/* Delete Button */}
                            <button
                              type="button"
                              title="حذف الصورة"
                              onClick={() =>
                                set(
                                  "images",
                                  form.images.filter((_, j) => j !== i),
                                )
                              }
                              className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center shadow hover:scale-110 transition-transform"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="رابط الصورة (URL)..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addImageUrl}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label
                        htmlFor="img-upload"
                        className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        {uploading ? (
                          <span className="text-sm text-primary">
                            جاري رفع الصورة...
                          </span>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              رفع صورة من الجهاز (حتى 5 ميجابايت)
                            </span>
                          </>
                        )}
                      </Label>
                      <input
                        id="img-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">الفئة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      if (!categories)
                        return <Skeleton className="h-10 w-full" />;

                      const dropdowns = [];

                      // Level 0 dropdown (root categories)
                      const rootCategories = categories.filter(
                        (c) => !c.parentId || c.parentId === null || String(c.parentId) === ""
                      );
                      dropdowns.push(
                        <div key="level-0">
                          <Label>الفئة الرئيسية *</Label>
                          <Select
                            value={categoryChain[0] || ""}
                            onValueChange={(value) =>
                              handleCategoryChange(0, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الفئة الرئيسية" />
                            </SelectTrigger>
                            <SelectContent>
                              {rootCategories.map((opt) => (
                                <SelectItem key={opt._id} value={opt._id}>
                                  {opt.nameAr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>,
                      );

                      // Subsequent dropdowns for subcategories
                      categoryChain.forEach((catId, i) => {
                        const subcategories = categories.filter(
                          (c) => c.parentId && String(typeof c.parentId === "object" ? (c.parentId as any)._id : c.parentId) === String(catId)
                        );
                        if (subcategories.length > 0) {
                          dropdowns.push(
                            <div key={`level-${i + 1}`}>
                              <Label>فئة فرعية</Label>
                              <Select
                                value={categoryChain[i + 1] || ""}
                                onValueChange={(value) =>
                                  handleCategoryChange(i + 1, value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر فئة فرعية" />
                                </SelectTrigger>
                                <SelectContent>
                                  {subcategories.map((opt) => (
                                    <SelectItem key={opt._id} value={opt._id}>
                                      {opt.nameAr}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>,
                          );
                        }
                      });

                      return dropdowns;
                    })()}
                  </CardContent>
                </Card>

                {/* Status */}
                <Card className="border-2 overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">نشر المنتج</p>
                        <Badge
                          variant={form.isActive ? "default" : "outline"}
                          className={form.isActive ? "bg-foreground text-background font-bold text-[10px]" : "text-muted-foreground text-[10px]"}
                        >
                          {form.isActive ? "منشور الآن" : "مسودة خفية"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {form.isActive ? "المنتج ظاهر للعملاء ويمكن شراؤه" : "المنتج مخفي ولن يظهر للزوار"}
                      </p>
                    </div>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(v) => set("isActive", v)}
                    />
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending
                    ? "جاري الحفظ..."
                    : isEdit
                      ? "حفظ التعديلات"
                      : "إضافة المنتج"}
                </Button>

                {savedProductId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowQR(true)}
                  >
                    <QrCode className="h-4 w-4" /> عرض وطباعة QR Code
                  </Button>
                )}
              </div>
            </div>
          </form>
        )}
      {savedProductId && showQR && (
        <QRModal
          productId={savedProductId}
          productName={form.nameAr}
          productSku={savedProductSku}
          price={parseFloat(form.salePrice || form.price)}
          open={showQR}
          onClose={() => setShowQR(false)}
        />
      )}
      </div>
    </AdminLayout>
  );
}
