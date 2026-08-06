import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  AlertTriangle,
  ImagePlus,
  X,
  FolderTree,
  FolderPlus,
  Search,
  Layers,
  Check,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { compressImage } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

function autoSlug(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon?: string;
  image?: string;
  isActive: boolean;
  parentId: string | null;
  discountPercent?: number;
}

export default function AdminCategories() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedSubcats, setExpandedSubcats] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    slug: "",
    icon: "📦",
    parentId: "",
    image: "",
  });
  const [imageUploading, setImageUploading] = useState(false);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const resetFormAndState = () => {
    setEditingCategory(null);
    setForm({ name: "", nameAr: "", slug: "", icon: "📦", parentId: "", image: "" });
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiRequest("POST", "/api/categories", {
        ...data,
        parentId: data.parentId || null,
        icon: data.icon || "📦",
        image: data.image,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/categories"] });
      setOpen(false);
      resetFormAndState();
      toast({ title: "تم إضافة الفئة بنجاح ✓" });
    },
    onError: (err) =>
      toast({
        title: "فشل إضافة الفئة",
        description: String(err),
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiRequest("PUT", `/api/categories/${editingCategory?._id}`, {
        ...data,
        parentId: data.parentId || null,
        icon: data.icon || "📦",
        image: data.image,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/categories"] });
      setOpen(false);
      resetFormAndState();
      toast({ title: "تم تعديل الفئة بنجاح ✓" });
    },
    onError: (err) =>
      toast({
        title: "فشل تعديل الفئة",
        description: String(err),
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "تم حذف الفئة بنجاح" });
    },
    onError: (err) =>
      toast({
        title: "فشل حذف الفئة",
        description: String(err),
        variant: "destructive",
      }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PUT", `/api/categories/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "تم تحديث حالة الفئة ✓" });
    },
    onError: (err) =>
      toast({
        title: "فشل تحديث الحالة",
        description: String(err),
        variant: "destructive",
      }),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleAddClick = () => {
    resetFormAndState();
    setOpen(true);
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      nameAr: category.nameAr,
      slug: category.slug,
      icon: category.icon || "📦",
      parentId: category.parentId || "",
      image: category.image || "",
    });
    setOpen(true);
  };

  const handleAddSubcategoryClick = (parentId: string) => {
    resetFormAndState();
    set("parentId", parentId);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setImageUploading(true);
    const token = localStorage.getItem("al-mohandes-token") || localStorage.getItem("adminToken");
    try {
      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressedBlob, file.name || "category.jpg");

      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        set("image", data.url);
        toast({ title: "تم رفع صورة الفئة بنجاح ✓" });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            set("image", e.target.result as string);
            toast({ title: "تم رفع صورة الفئة بنجاح ✓" });
          }
        };
        reader.readAsDataURL(compressedBlob);
      }
    } catch {
      const compressedBlob = await compressImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          set("image", e.target.result as string);
          toast({ title: "تم رفع صورة الفئة بنجاح ✓" });
        }
      };
      reader.readAsDataURL(compressedBlob);
    } finally {
      setImageUploading(false);
    }
  };

  const toggleSubcats = (catId: string) => {
    setExpandedSubcats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const rootCategories = categories.filter((c) => !c.parentId);
  const activeCount = categories.filter((c) => c.isActive).length;

  const filteredRootCategories = rootCategories.filter((cat) => {
    const matchesName = cat.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSub = categories.some((sub) => sub.parentId === cat._id && (
      sub.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));
    return matchesName || matchesSub;
  });

  const renderCategoryCard = (cat: Category, isSubcat = false) => {
    const subcats = categories.filter((c) => c.parentId === cat._id);
    const isSubcatsExpanded = !!expandedSubcats[cat._id];

    return (
      <div
        key={cat._id}
        className={`bg-card border rounded-2xl p-5 shadow-xs transition-all duration-200 hover:shadow-md ${
          !cat.isActive ? "opacity-60 bg-muted/20" : ""
        } ${isSubcat ? "ms-6 border-s-4 border-s-black/30 bg-muted/10" : ""}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Category Info with Image */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted border overflow-hidden shrink-0 flex items-center justify-center text-xl">
              {cat.image ? (
                <img src={cat.image} alt={cat.nameAr} className="h-full w-full object-cover" />
              ) : (
                <span>{cat.icon || "📦"}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-extrabold ${isSubcat ? "text-base" : "text-lg"}`}>{cat.nameAr}</h3>
                <Badge variant={cat.isActive ? "default" : "secondary"} className="text-xs font-bold">
                  {cat.isActive ? "مفعلة" : "معطلة"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subcats.length > 0 ? `${subcats.length} فئة فرعية` : isSubcat ? "فئة فرعية" : "فئة رئيسية"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {subcats.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleSubcats(cat._id)}
                className="rounded-xl text-xs gap-1 font-bold border-foreground/20"
              >
                <FolderTree className="h-3.5 w-3.5" />
                {isSubcatsExpanded ? "إخفاء الفئات الفرعية" : `عرض الفئات الفرعية (${subcats.length})`}
                {isSubcatsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddSubcategoryClick(cat._id)}
              className="rounded-xl font-bold gap-1 text-xs"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              إضافة فرعية
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleActiveMutation.mutate({ id: cat._id, isActive: !cat.isActive })}
              disabled={toggleActiveMutation.isPending}
              className="rounded-xl p-2"
              title={cat.isActive ? "تعطيل الفئة" : "تفعيل الفئة"}
            >
              {cat.isActive ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditClick(cat)}
              className="rounded-xl p-2"
              title="تعديل الفئة"
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteTarget(cat)}
              className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
              title="حذف الفئة"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Subcategories */}
        {isSubcatsExpanded && subcats.length > 0 && (
          <div className="mt-4 pt-4 border-t space-y-3 animate-fade-in-up">
            <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider mb-1">
              الفئات الفرعية لـ {cat.nameAr}:
            </h4>
            {subcats.map((subcat) => renderCategoryCard(subcat, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout title="إدارة الفئات والأقسام" subtitle="هيكلة وتنظيم فئات وأقسام المتجر بسهولة">
      <div className="space-y-6 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center shrink-0">
                <FolderTree className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">إجمالي الفئات</p>
                <h3 className="text-2xl font-black">{categories.length}</h3>
              </div>
            </div>
            <Button size="sm" onClick={handleAddClick} className="rounded-xl font-bold gap-1 bg-black text-white hover:bg-black/90">
              <Plus className="h-4 w-4" /> إضافة فئة
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">فئات رئيسية</p>
              <h3 className="text-2xl font-black">{rootCategories.length}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">فئات مفعلة</p>
              <h3 className="text-2xl font-black">{activeCount}</h3>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0 ms-2" />
          <Input
            placeholder="ابحث عن فئة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 text-sm"
          />
        </div>

        {/* Categories List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-muted/40 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredRootCategories.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-3xl border border-dashed">
            <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-lg">لا توجد فئات مطابقة</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRootCategories.map((cat) => renderCategoryCard(cat))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetFormAndState();
          }}
        >
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-black text-xl">
                {editingCategory
                  ? "تعديل الفئة"
                  : form.parentId
                    ? "إضافة فئة فرعية"
                    : "إضافة فئة رئيسية جديدة"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {/* Image upload */}
              <div>
                <Label className="font-bold text-xs">صورة الفئة التوضيحية</Label>
                <div className="mt-2 flex items-center gap-3">
                  {form.image ? (
                    <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-black group">
                      <img src={form.image} alt="Category" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => set("image", "")}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-20 w-20 rounded-2xl border-2 border-dashed border-black/20 flex items-center justify-center cursor-pointer hover:border-black hover:bg-black/5 transition-all">
                      {imageUploading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      ) : (
                        <ImagePlus className="h-6 w-6 text-black/40" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground">
                    اضغط هنا لرفع صورة رسمية للفئة
                  </p>
                </div>
              </div>

              <div>
                <Label className="font-bold text-xs">اسم الفئة *</Label>
                <Input
                  className="rounded-xl mt-1 h-11"
                  value={form.nameAr}
                  onChange={(e) => {
                    const val = e.target.value;
                    set("nameAr", val);
                    set("name", val);
                    set("slug", autoSlug(val));
                  }}
                  required
                />
              </div>

              <div>
                <Label className="font-bold text-xs">الفئة الرئيسية</Label>
                <Select
                  value={form.parentId || "none"}
                  onValueChange={(val) => set("parentId", val === "none" ? "" : val)}
                >
                  <SelectTrigger className="rounded-xl mt-1 h-11">
                    <SelectValue placeholder="فئة رئيسية" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="none">بدون فئة أصلية (فئة رئيسية)</SelectItem>
                    {rootCategories
                      .filter((c) => !editingCategory || c._id !== editingCategory._id)
                      .map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.nameAr}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/90 text-white font-bold rounded-xl h-11"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "جاري الحفظ..."
                  : editingCategory
                    ? "حفظ التعديلات"
                    : "إضافة الفئة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600 font-black">
                <AlertTriangle className="h-5 w-5" /> تأكيد حذف الفئة
              </DialogTitle>
              <DialogDescription className="text-right pt-2">
                هل أنت متأكد من حذف "<strong>{deleteTarget?.nameAr}</strong>"؟
                <br />
                سيتم حذف كافة الفئات الفرعية والمنتجات المرتبطة بها نهائياً.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2 sm:gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDeleteTarget(null)}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                className="flex-1 font-bold rounded-xl bg-rose-600 hover:bg-rose-700"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deleteTarget) {
                    deleteMutation.mutate(deleteTarget._id);
                    setDeleteTarget(null);
                  }
                }}
              >
                {deleteMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
