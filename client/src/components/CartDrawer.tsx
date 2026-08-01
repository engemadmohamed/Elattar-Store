import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { Link } from "wouter";

interface Props { open: boolean; onClose: () => void; }

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQty, total, clearCart } = useCart();

  if (!open) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Cart Drawer positioned on the LEFT (ناحية الشمال) */}
      <div className="fixed left-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-[0_0_50px_hsl(0_0%_0%/0.25)] flex flex-col animate-slide-in-left border-r-2 border-foreground/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-foreground text-background font-bold flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">سلة التسوق</h2>
              <p className="text-xs text-muted-foreground">{items.length} منتجات في السلة</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-xl hover:bg-foreground/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground text-center py-12">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center animate-bounce-in">
                <ShoppingBag className="h-10 w-10 opacity-40" />
              </div>
              <div>
                <p className="font-bold text-base text-foreground mb-1">السلة فارغة حالياً</p>
                <p className="text-xs text-muted-foreground">تصفح المنتجات وأضف ما يعجبك إلى السلة</p>
              </div>
              <Link href="/shop" onClick={onClose}>
                <Button className="rounded-xl px-6 font-bold gap-2">
                  تصفح المنتجات <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-3 p-3 rounded-2xl border-2 border-foreground/8 bg-white hover:border-foreground/20 transition-all duration-200"
              >
                <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden shrink-0 border">
                  {item.image ? (
                    <img src={item.image} alt={item.nameAr} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-bold truncate leading-tight">{item.nameAr}</p>
                    <p className="text-sm font-black text-foreground mt-1">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <div className="flex items-center gap-1.5 bg-muted rounded-xl p-1">
                      <button
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                        className="h-6 w-6 rounded-lg bg-white flex items-center justify-center hover:bg-foreground hover:text-background transition-colors text-xs font-bold shadow-xs"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        className="h-6 w-6 rounded-lg bg-white flex items-center justify-center hover:bg-foreground hover:text-background transition-colors text-xs font-bold shadow-xs"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-xs text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> حذف
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && (
          <div className="border-t p-5 bg-white space-y-3 shadow-[0_-8px_24px_hsl(0_0%_0%/0.06)]">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-semibold">المجموع الكلي</span>
              <span className="font-black text-xl text-foreground">{formatPrice(total)}</span>
            </div>
            <Separator />
            <Link href="/checkout" onClick={onClose}>
              <Button className="w-full h-12 rounded-xl font-bold text-base gap-2 group shadow-md">
                إتمام الطلب <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
              </Button>
            </Link>
            <button
              onClick={clearCart}
              className="w-full text-center text-xs text-destructive hover:underline font-semibold py-1"
            >
              مسح محتويات السلة
            </button>
          </div>
        )}
      </div>
    </>
  );
}
