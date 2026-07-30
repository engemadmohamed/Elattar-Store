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
} from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
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

// Auto-generate a URL-friendly slug from Arabic text
function autoSlug(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w\u0600-\u06FF-]/g, "") // Keep only word chars, Arabic, and hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, "") // Trim hyphens from start/end
    .toLowerCase();
}

// Helper function to find the path to a category from root to child
const findCategoryPath = (
  allCategories: Category[],
  categoryId: string | null,
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
      currentId = null; // Category not found, break loop
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
    slug: "", // Add slug to form state
    icon: "📦", // Keep icon in form state with default, but not in UI
    parentId: "",
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const resetFormAndState = () => {
    setEditingCategory(null);
    setForm({ name: "", nameAr: "", slug: "", icon: "📦", parentId: "" }); // Reset slug
    setCategoryChain([]);
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiRequest("POST", "/api/categories", {
        ...data,
        parentId: data.parentId || null,
        icon: data.icon || "📦", // Ensure icon is not empty
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/categories"] });
      setOpen(false);
      resetFormAndState();
      toast({ title: "تم إضافة الفئة ✓" });
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
        icon: data.icon || "📦", // Ensure icon is not empty
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/categories"] });
      setOpen(false);
      resetFormAndState();
      toast({ title: "تم تعديل الفئة ✓" });
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
      toast({ title: "تم حذف الفئة" });
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
      slug: category.slug, // Populate slug when editing
      icon: category.icon,
      parentId: category.parentId || "",
    });
    setCategoryChain(
      categories ? findCategoryPath(categories, category.parentId) : [],
    );
    setOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (
      confirm(
        "هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف أي فئات فرعية تابعة لها أيضًا.",
      )
    ) {
      deleteMutation.mutate(id);
    }
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

  const handleToggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSubcategories = (parentId: string) =>
    categories?.filter((c) => c.parentId === parentId) || [];
  const getDescendants = (catId: string): string[] => {
    // Made iterative to prevent stack overflow from cycles
    if (!categories) return [];
    const descendants: string[] = [];
    const queue: string[] = [catId];
    const visited = new Set<string>(); // Use a set to track visited nodes to break cycles

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
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">الفئات</h1>
          <Button className="gap-2" onClick={handleAddClick}>
            <Plus className="h-4 w-4" /> إضافة فئة
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              الفئات ({categories?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
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
              <p className="text-center text-muted-foreground py-4">
                لا توجد فئات
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetFormAndState();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? "تعديل الفئة"
                : form.parentId
                  ? "إضافة فئة فرعية"
                  : "إضافة فئة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>الاسم بالعربية *</Label>
              <Input
                value={form.nameAr}
                onChange={(e) => {
                  const val = e.target.value;
                  set("nameAr", val);
                  set("name", val); // Keep for compatibility
                  set("slug", autoSlug(val)); // Generate slug
                }}
                required
              />
            </div>
            <div>
              <Label>الفئه الرئسية</Label>
              {(() => {
                if (!categories) return <Skeleton className="h-10 w-full" />;

                const dropdowns = [];
                const excludedFromSelection = editingCategory
                  ? [
                      editingCategory._id,
                      ...getDescendants(editingCategory._id),
                    ]
                  : [];

                // Level 0 dropdown (root categories)
                const rootCategories = categories.filter(
                  (c) => !c.parentId && !excludedFromSelection.includes(c._id),
                );
                dropdowns.push(
                  <div key="level-0">
                    <Select
                      value={categoryChain[0] || ""}
                      onValueChange={(value) => handleCategoryChange(0, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر فئة رئيسية" />
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
                    (c) =>
                      c.parentId === catId &&
                      !excludedFromSelection.includes(c._id),
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

                return <div className="space-y-2">{dropdowns}</div>;
              })()}
            </div>
            <Button
              type="submit"
              className="w-full"
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> حذف الفئة
            </DialogTitle>
            <DialogDescription className="text-right pt-2">
              هل أنت متأكد من حذف "<strong>{deleteTarget?.nameAr}</strong>"؟
              <br />
              سيتم حذف أي فئات فرعية تابعة لها أيضًا. هذا الإجراء لا يمكن
              التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
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
  );
}

interface CategoryTreeProps {
  categories: Category[];
  parentId: string | null;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSub: (parentId: string) => void;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  path?: Set<string>; // To detect circular dependencies
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
    <div className={parentId ? "pl-4 border-l-2 border-primary/20 ml-4" : ""}>
      {children.map((cat) => {
        if (path.has(cat._id)) {
          console.error(
            "Circular dependency detected in categories for ID:",
            cat._id,
          );
          return (
            <div key={cat._id} className="text-destructive text-xs pl-4">
              Error: Circular reference detected.
            </div>
          );
        }
        const newPath = new Set(path);
        newPath.add(cat._id);

        return (
          <div key={cat._id} className="my-1">
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
      toast({ title: "تم تحديث حالة الفئة" });
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
      className={`flex items-center justify-between p-2 rounded-lg border bg-background hover:bg-muted/50 transition-colors ${
        !category.isActive ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onToggle}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            <ChevronRight
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          ) : (
            <span className="w-4" /> // Placeholder for alignment
          )}
        </Button>
        <div>
          <p className="font-medium text-sm">{category.nameAr}</p>
        </div>
      </div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
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
            <Unlock className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="إضافة فئة فرعية"
          onClick={() => onAddSub(category._id)}
        >
          <Plus className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onEdit(category)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
