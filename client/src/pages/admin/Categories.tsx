import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  ChevronRight,
  Lock,
  Unlock,
  AlertTriangle,
  ImagePlus,
  X,
  FolderTree,
  FolderPlus,
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

const findCategoryPath = (
  allCategories: Category[],
  categoryId: string | null
): string[] => {
  if (!categoryId) return [];
  const path: string[] = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const category = allCategories.find((c) => c._id === currentId);
    if (category) {
      path.unshift(category._id);
      currentId = category.parentId;
    } else {
      currentId = null;
    }
  }
  return path;
};

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

export default function AdminCategories() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [categoryChain, setCategoryChain] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    slug: "",
    icon: "📦",
    parentId: "",
    image: "",
  });
  const [imageUploading, setImageUploading] = useState(false);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const resetFormAndState = () => {
    setEditingCategory(null);
    setForm({ name: "", nameAr: "", slug: "", icon: "📦", parentId: "", image: "" });
    setCategoryChain([]);
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
      icon: category.icon,
      parentId: category.parentId || "",
      image: category.image || "",
    });
    setCategoryChain(
      categories ? findCategoryPath(categories, category.parentId) : []
    );
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

  const handleAddSubcategoryClick = (parentId: string) => {
    resetFormAndState();
    set("parentId", parentId);
    setCategoryChain(categories ? findCategoryPath(categories, parentId) : []);
    setOpen(true);
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

  const handleToggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getDescendants = (catId: string): string[] => {
    if (!categories) return [];
    const descendants: string[] = [];
    const queue: string[] = [catId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = categories.filter((c) => c.parentId === currentId);
      for (const child of children) {
        if (!visited.has(child._id)) {
          visited.add(child._id);
          descendants.push(child._id);
          queue.push(child._id);
        }
      }
    }
    return descendants;
  };

  const handleCategoryChange = (level: number, value: string) => {
    const newChain = categoryChain.slice(0, level);
    if (value) {
      newChain.push(value);
    }
    setCategoryChain(newChain);

    const finalParentId =
      newChain.length > 0 ? newChain[newChain.length - 1] : "";
    set("parentId", finalParentId);
  };

  return (
    <AdminLayout title="إدارة الفئات والأقسام" subtitle="هيكلة وتنظيم شجرة أقسام المتجر">
      <div className="space-y-6 max-w-5xl">
        
        {/* Header Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <FolderTree className="h-6 w-6" /> شجرة فئات المتجر
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              إجمالي الفئات والأقسام المسجلة: {categories?.length || 0} فئة
            </p>
          </div>

          <Button onClick={handleAddClick} className="bg-black hover:bg-black/90 text-white font-bold rounded-2xl gap-2 px-5 shadow-md">
            <Plus className="h-4 w-4" /> إضافة فئة رئيسية
          </Button>
        </div>

        {/* Tree Container */}
        <Card className="rounded-3xl border shadow-sm bg-white overflow-hidden p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base font-black">قائمة الفئات الهيكلية</CardTitle>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-bold">
              {categories?.length || 0} قسم
            </Badge>
          </CardHeader>

          <CardContent className="p-0 space-y-2">
            {categories && (
              <CategoryTree
                categories={categories}
                parentId={null}
                onEdit={handleEditClick}
                onDelete={(cat) => setDeleteTarget(cat)}
                onAddSub={handleAddSubcategoryClick}
                expanded={expanded}
                onToggle={handleToggle}
              />
            )}
            {(!categories || categories.length === 0) && (
              <p className="text-center text-muted-foreground py-8 font-medium">
                لا توجد فئات مسجلة حالياً
              </p>
            )}
          </CardContent>
        </Card>

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
                    اضغط المربع لرفع صورة توضيحية للفئة
                  </p>
                </div>
              </div>

              <div>
                <Label className="font-bold text-xs">اسم الفئة بالعربية *</Label>
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

              {editingCategory && (
                <div>
                  <Label className="font-bold text-xs">الفئة الرئيسية الأب</Label>
                  {(() => {
                    if (!categories) return <Skeleton className="h-10 w-full rounded-xl" />;

                    const dropdowns = [];
                    const excludedFromSelection = editingCategory
                      ? [editingCategory._id, ...getDescendants(editingCategory._id)]
                      : [];

                    const rootCategories = categories.filter(
                      (c) => !c.parentId && !excludedFromSelection.includes(c._id)
                    );
                    dropdowns.push(
                      <div key="level-0">
                        <Select
                          value={categoryChain[0] || ""}
                          onValueChange={(value) => handleCategoryChange(0, value)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="اختر الفئة الرئيسية" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {rootCategories.map((opt) => (
                              <SelectItem key={opt._id} value={opt._id}>
                                {opt.nameAr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );

                    categoryChain.forEach((catId, i) => {
                      const subcategories = categories.filter(
                        (c) =>
                          c.parentId === catId &&
                          !excludedFromSelection.includes(c._id)
                      );
                      if (subcategories.length > 0) {
                        dropdowns.push(
                          <div key={`level-${i + 1}`} className="mt-2">
                            <Select
                              value={categoryChain[i + 1] || ""}
                              onValueChange={(value) =>
                                handleCategoryChange(i + 1, value)
                              }
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="اختر الفئة الفرعية" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                {subcategories.map((opt) => (
                                  <SelectItem key={opt._id} value={opt._id}>
                                    {opt.nameAr}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }
                    });

                    return <div className="space-y-2 mt-1">{dropdowns}</div>;
                  })()}
                </div>
              )}

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

// --- Tree Renderers ---

interface CategoryTreeProps {
  categories: Category[];
  parentId: string | null;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSub: (parentId: string) => void;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  path?: Set<string>;
}

function CategoryTree({
  categories,
  parentId,
  onEdit,
  onDelete,
  onAddSub,
  expanded,
  onToggle,
  path = new Set(),
}: CategoryTreeProps) {
  const children = categories.filter((c) => c.parentId === parentId);
  if (!children.length) return null;

  return (
    <div className={parentId ? "pl-4 border-l-2 border-black/10 ml-4 space-y-1.5 pt-1" : "space-y-1.5"}>
      {children.map((cat) => {
        if (path.has(cat._id)) return null;
        const newPath = new Set(path);
        newPath.add(cat._id);

        return (
          <div key={cat._id}>
            <CategoryItem
              category={cat}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSub={onAddSub}
              hasChildren={categories.some((c) => c.parentId === cat._id)}
              isExpanded={!!expanded[cat._id]}
              onToggle={() => onToggle(cat._id)}
            />
            {expanded[cat._id] && (
              <CategoryTree
                categories={categories}
                parentId={cat._id}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddSub={onAddSub}
                expanded={expanded}
                onToggle={onToggle}
                path={newPath}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface CategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSub: (parentId: string) => void;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

function CategoryItem({
  category,
  onEdit,
  onDelete,
  onAddSub,
  hasChildren,
  isExpanded,
  onToggle,
}: CategoryItemProps) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const toggleMutation = useMutation({
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

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-2xl border bg-white hover:border-black/30 transition-all ${
        !category.isActive ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl"
          onClick={onToggle}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            <ChevronRight
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          ) : (
            <span className="w-4" />
          )}
        </Button>

        <div className="h-9 w-9 rounded-xl overflow-hidden bg-black/5 flex items-center justify-center text-lg shrink-0 border">
          {category.image ? (
            <img src={category.image} alt={category.nameAr} className="h-full w-full object-cover" />
          ) : (
            <span>{category.icon || "📦"}</span>
          )}
        </div>

        <div>
          <p className="font-bold text-sm text-foreground">{category.nameAr}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl"
          title={category.isActive ? "قفل الفئة" : "فتح الفئة"}
          onClick={() =>
            toggleMutation.mutate({
              id: category._id,
              isActive: !category.isActive,
            })
          }
          disabled={toggleMutation.isPending}
        >
          {category.isActive ? (
            <Unlock className="h-4 w-4 text-black" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl hover:bg-black/5"
          title="إضافة فئة فرعية"
          onClick={() => onAddSub(category._id)}
        >
          <FolderPlus className="h-4 w-4 text-black" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl hover:bg-black/5"
          onClick={() => onEdit(category)}
        >
          <Edit className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl text-rose-600 hover:bg-rose-50"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
