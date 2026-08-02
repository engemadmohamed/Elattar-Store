import { useState, useEffect } from "react";
import { Printer, Download, X, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  productId: string;
  productName: string;
  productSku: string;
  price: number;
  open: boolean;
  onClose: () => void;
}

export default function QRModal({
  productId,
  productName,
  productSku,
  price,
  open,
  onClose,
}: Props) {
  const [qrData, setQrData] = useState<{ qrCode: string; url: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !productId) return;
    setLoading(true);
    const token = localStorage.getItem("al-mohandes-token");
    fetch(`/api/products/${productId}/qr`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then(setQrData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, productId]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !qrData) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${productName}</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: white; }
          .label { border: 2px solid #333; border-radius: 8px; padding: 20px; text-align: center; width: 280px; }
          .store { font-size: 18px; font-weight: bold; color: #3b82f6; margin-bottom: 4px; }
          .product-name { font-size: 13px; font-weight: 600; margin: 8px 0; direction: rtl; }
          .sku { font-size: 11px; color: #666; margin: 4px 0; }
          .price { font-size: 16px; font-weight: bold; color: #3b82f6; margin: 8px 0; }
          img { width: 200px; height: 200px; margin: 10px auto; display: block; }
          .scan-text { font-size: 11px; color: #888; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="store">متجر المهندس</div>
          <img src="${qrData.qrCode}" alt="QR Code" />
          <div class="product-name">${productName}</div>
          <div class="sku">SKU: ${productSku}</div>
          <div class="price">${price.toFixed(2)} ج.م</div>
          <div class="scan-text">امسح الكود لعرض المنتج والشراء</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleDownload = () => {
    if (!qrData) return;
    const a = document.createElement("a");
    a.href = qrData.qrCode;
    a.download = `qr-${productSku}.png`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            QR Code المنتج
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {loading ? (
            <div className="h-48 w-48 bg-muted rounded-lg animate-pulse" />
          ) : qrData ? (
            <>
              <div className="border-2 border-primary/20 rounded-xl p-3 bg-white">
                <img src={qrData.qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{productName}</p>
                <p className="text-xs text-muted-foreground">
                  SKU: {productSku}
                </p>
                <p className="text-xs text-muted-foreground break-all">
                  {qrData.url}
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <Button onClick={handlePrint} className="flex-1 gap-2">
                  <Printer className="h-4 w-4" /> طباعة
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex-1 gap-2"
                >
                  <Download className="h-4 w-4" /> تحميل
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                ضع هذا الكود على كرتونة المنتج. عند مسحه سيفتح صفحة المنتج
                للشراء.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">فشل تحميل QR Code</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
