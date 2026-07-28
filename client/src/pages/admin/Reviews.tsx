import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/StarRating";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  productId: {
    _id: string;
    nameAr: string;
    images: string[];
  } | null;
}

export default function AdminReviews() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/reviews/admin/all"],
    queryFn: () =>
      apiRequest<{ reviews: Review[]; total: number }>(
        "GET",
        `/api/reviews/admin/all`,
      ),
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; rating: number; comment: string }) =>
      apiRequest("PUT", `/api/reviews/admin/${data.id}`, {
        rating: data.rating,
        comment: data.comment,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/reviews/admin/all"] });
      toast({ title: "تم تحديث التقييم" });
      setEditingReview(null);
    },
    onError: (err) =>
      toast({
        title: "فشل تحديث التقييم",
        description: String(err),
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/reviews/admin/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/reviews/admin/all"] });
      toast({ title: "تم حذف التقييم" });
    },
    onError: () => toast({ title: "فشل حذف التقييم", variant: "destructive" }),
  });

  const handleDelete = (review: Review) => {
    if (!confirm(`هل أنت متأكد من حذف تقييم العميل "${review.customerName}"؟`))
      return;
    deleteMutation.mutate(review._id);
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">تقييمات المنتجات</h1>
            <p className="text-sm text-muted-foreground">
              إجمالي: {data?.total || 0} تقييم
            </p>
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنتج</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead>التعليق</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="text-right">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.reviews.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    لا توجد تقييمات
                  </TableCell>
                </TableRow>
              ) : (
                data?.reviews.map((review) => (
                  <TableRow key={review._id}>
                    <TableCell>
                      {review.productId ? (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
                            {review.productId.images[0] ? (
                              <img
                                src={review.productId.images[0]}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-lg">
                                📦
                              </div>
                            )}
                          </div>
                          <p className="font-medium text-xs">
                            {review.productId.nameAr}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          منتج محذوف
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {review.customerName}
                    </TableCell>
                    <TableCell>
                      <StarRating value={review.rating} readOnly size={14} />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-xs truncate">
                        {review.comment || "-"}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingReview(review)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(review)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {editingReview && (
          <EditReviewDialog
            key={editingReview._id}
            review={editingReview}
            onClose={() => setEditingReview(null)}
            onSave={editMutation.mutate}
            isSaving={editMutation.isPending}
          />
        )}
      </main>
    </div>
  );
}

interface EditDialogProps {
  review: Review;
  onClose: () => void;
  onSave: (data: { id: string; rating: number; comment: string }) => void;
  isSaving: boolean;
}

function EditReviewDialog({
  review,
  onClose,
  onSave,
  isSaving,
}: EditDialogProps) {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || "");

  const handleSave = () => {
    onSave({ id: review._id, rating, comment });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل تقييم</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">التقييم</p>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">التعليق</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
