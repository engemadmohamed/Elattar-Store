import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, ThumbsUp } from "lucide-react";
import StarRating from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { useToast } from "@/hooks/use-toast";
import { customerRequest } from "@/lib/customer-api";

interface Review {
  _id: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpfulVotes: string[];
  helpfulCount: number;
}

interface ReviewsResponse {
  reviews: Review[];
  average: number;
  count: number;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { customer, isAuthenticated } = useCustomerAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);

  const { data } = useQuery<ReviewsResponse>({
    queryKey: ["/api/reviews/product", productId],
    queryFn: () => customerRequest("GET", `/api/reviews/product/${productId}`),
  });

  const myReview = data?.reviews.find((r) => r.customerId === customer?._id);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["/api/reviews/product", productId] });

  const saveMutation = useMutation({
    mutationFn: () =>
      customerRequest("POST", `/api/reviews/product/${productId}`, {
        rating,
        comment,
      }),
    onSuccess: () => {
      toast({ title: myReview ? "تم تحديث تقييمك ✓" : "شكرًا لتقييمك ✓" });
      setEditing(false);
      invalidate();
    },
    onError: (err) =>
      toast({
        title: "فشل إرسال التقييم",
        description: String(err),
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      customerRequest("DELETE", `/api/reviews/${myReview!._id}`),
    onSuccess: () => {
      toast({ title: "تم حذف تقييمك" });
      setRating(0);
      setComment("");
      setEditing(false);
      invalidate();
    },
    onError: (err) =>
      toast({
        title: "فشل حذف التقييم",
        description: String(err),
        variant: "destructive",
      }),
  });

  const helpfulMutation = useMutation({
    mutationFn: (reviewId: string) =>
      customerRequest("POST", `/api/reviews/${reviewId}/helpful`),
    onSuccess: () => {
      // Don't show a toast, it's a minor action. Just refetch.
      invalidate();
    },
    onError: (err) =>
      toast({
        title: "حدث خطأ",
        description: String(err),
        variant: "destructive",
      }),
  });

  const showForm = isAuthenticated && (!myReview || editing);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="font-medium">التقييمات</h3>
        {data && data.count > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <StarRating value={data.average} readOnly size={16} />
            <span>
              {data.average} ({data.count} تقييم)
            </span>
          </div>
        )}
      </div>

      {isAuthenticated ? (
        showForm || editing ? (
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">
              {myReview ? "تعديل تقييمك" : "أضف تقييمك"}
            </p>
            <StarRating value={rating} onChange={setRating} />
            <Textarea
              rows={2}
              placeholder="اكتب رأيك في المنتج (اختياري)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!rating || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending
                  ? "جاري الحفظ..."
                  : myReview
                    ? "حفظ التعديل"
                    : "إرسال التقييم"}
              </Button>
              {myReview && editing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setRating(myReview.rating);
                    setComment(myReview.comment || "");
                  }}
                >
                  إلغاء
                </Button>
              )}
            </div>
          </div>
        ) : null // The form is shown if creating or editing, otherwise nothing (the review is in the list below)
      ) : (
        <p className="text-sm text-muted-foreground">
          سجّل دخولك لإضافة تقييم على هذا المنتج.
        </p>
      )}

      <div className="space-y-4">
        {data?.reviews.map((r) => {
          // Don't show the review being edited in the list
          if (r._id === myReview?._id && editing) return null;

          const isMyReview = r.customerId === customer?._id;
          const hasVotedHelpful = r.helpfulVotes?.includes(customer?._id || "");

          return (
            <div
              key={r._id}
              className={`border-b last:border-b-0 p-4 rounded-lg ${isMyReview ? "bg-muted/50" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{r.customerName}</p>
                <StarRating value={r.rating} readOnly size={14} />
              </div>
              {r.comment && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {r.comment}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                {/* Left side: Helpful button or "Your review" text */}
                {isMyReview ? (
                  <span className="text-xs font-medium text-primary">
                    هذا تقييمك
                  </span>
                ) : (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {r.helpfulCount > 0 && (
                      <span>{r.helpfulCount} شخص وجد هذا التقييم مفيداً</span>
                    )}
                    {isAuthenticated && (
                      <button
                        disabled={helpfulMutation.isPending}
                        onClick={() => helpfulMutation.mutate(r._id)}
                        className={`flex items-center gap-1.5 transition-colors hover:text-primary ${hasVotedHelpful ? "text-primary font-medium" : ""}`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>مفيد</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Right side: Edit/Delete buttons for my review */}
                {isMyReview && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        if (!myReview) return;
                        setRating(myReview.rating);
                        setComment(myReview.comment || "");
                        setEditing(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate()}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {data && data.count === 0 && (
          <p className="text-sm text-muted-foreground">
            لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج.
          </p>
        )}
      </div>
    </div>
  );
}
