import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
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
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> سلة التسوق ({items.length})
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 opacity-30" />
              <p>السلة فارغة</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3">
                <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.nameAr} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.nameAr}</p>
                  <p className="text-sm text-primary font-semibold">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.productId, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.productId, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive ml-auto" onClick={() => removeItem(item.productId)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المجموع الفرعي</span>
              <span className="font-semibold">{formatPrice(total)}</span>
            </div>
            <Separator />
            <Link href="/checkout" onClick={onClose}>
              <Button className="w-full">إتمام الطلب</Button>
            </Link>
            <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={clearCart}>
              مسح السلة
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
