import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

interface InvoiceOrder {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: Array<{ nameAr: string; price: number; quantity: number }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod?: string;
  shipping?: {
    company?: string;
    address?: string;
    city?: string;
    governorate?: string;
    trackingNumber?: string;
  };
  createdAt: string;
  customerLibraryName?: string;
  customerLibraryLocation?: string;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Prints the invoice from a completely isolated, freshly-opened document.
// This sidesteps any interaction with the app's own layout/CSS (dialog
// centering, hidden-but-still-sized page content, etc.) that caused the
// printed invoice to start mid-page and spill onto a second page.
function printInvoice(order: InvoiceOrder) {
  const win = window.open("", "_blank", "width=850,height=1000");
  if (!win) return;

  const itemsRows = order.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.nameAr)}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:left">${formatPrice(item.price)}</td>
          <td style="text-align:left">${formatPrice(item.price * item.quantity)}</td>
        </tr>`,
    )
    .join("");

  const paymentLabel =
    order.paymentMethod === "cash_on_delivery"
      ? "الدفع عند الاستلام"
      : order.paymentMethod || "";

  const html = `<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<title>فاتورة ${escapeHtml(order.orderNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Tahoma, "Segoe UI", Arial, sans-serif;
    color: #1a1a1a;
    margin: 0;
    padding: 32px 40px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #16a34a;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .brand { font-size: 24px; font-weight: bold; color: #16a34a; }
  .brand-sub { font-size: 12px; color: #666; margin-top: 2px; }
  .meta { text-align: left; font-size: 13px; color: #444; }
  .meta div { margin-bottom: 2px; }
  .section-title { font-size: 11px; color: #888; margin-bottom: 3px; text-transform: uppercase; letter-spacing: .03em; }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 24px;
    margin-bottom: 24px;
    font-size: 14px;
  }
  .info-grid .full { grid-column: 1 / -1; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead th {
    text-align: right;
    font-size: 12px;
    color: #666;
    font-weight: normal;
    border-bottom: 2px solid #ddd;
    padding: 8px 6px;
  }
  tbody td {
    padding: 10px 6px;
    border-bottom: 1px solid #eee;
    font-size: 14px;
  }
  .totals { width: 260px; margin-inline-start: auto; font-size: 14px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; color: #555; }
  .totals-row.grand { font-weight: bold; font-size: 17px; color: #111; border-top: 2px solid #ddd; margin-top: 6px; padding-top: 10px; }
  .grand .amount { color: #16a34a; }
  .footer { text-align: center; font-size: 12px; color: #999; margin-top: 40px; padding-top: 14px; border-top: 1px solid #eee; }
  @media print {
    body { padding: 12mm 14mm; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">المهندس</div>
      <div class="brand-sub">فاتورة مبيعات</div>
    </div>
    <div class="meta">
      <div>رقم الفاتورة: <strong>${escapeHtml(order.orderNumber)}</strong></div>
      <div>${formatDate(order.createdAt)}</div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="section-title">العميل</div>
      <div>${escapeHtml(order.customerName)}</div>
    </div>
    <div>
      <div class="section-title">الهاتف</div>
      <div>${escapeHtml(order.customerPhone)}</div>
    </div>
    ${order.customerLibraryName ? `<div><div class="section-title">اسم المكتبة</div><div>${escapeHtml(order.customerLibraryName)}</div></div>` : ""}
    ${order.customerLibraryLocation ? `<div><div class="section-title">موقع المكتبة</div><div>${escapeHtml(order.customerLibraryLocation)}</div></div>` : ""}
    ${order.customerEmail ? `<div class="full"><div class="section-title">البريد الإلكتروني</div><div>${escapeHtml(order.customerEmail)}</div></div>` : ""}
    ${order.shipping?.address ? `<div class="full"><div class="section-title">عنوان الشحن</div><div>${escapeHtml(order.shipping.address)}${order.shipping.city ? "، " + escapeHtml(order.shipping.city) : ""}${order.shipping.governorate ? "، " + escapeHtml(order.shipping.governorate) : ""}</div></div>` : ""}
    ${order.shipping?.trackingNumber ? `<div><div class="section-title">رقم التتبع</div><div>${escapeHtml(order.shipping.trackingNumber)}</div></div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>المنتج</th>
        <th style="text-align:center">الكمية</th>
        <th style="text-align:left">السعر</th>
        <th style="text-align:left">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>المجموع الفرعي</span><span>${formatPrice(order.subtotal)}</span></div>
    <div class="totals-row"><span>الشحن</span><span>${formatPrice(order.shippingCost)}</span></div>
    <div class="totals-row grand"><span>الإجمالي</span><span class="amount">${formatPrice(order.total)}</span></div>
  </div>

  ${paymentLabel ? `<p style="font-size:13px;color:#666">طريقة الدفع: ${escapeHtml(paymentLabel)}</p>` : ""}

  <div class="footer">شكرًا لتسوقك من المهندس</div>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}

export default function InvoicePrint({
  order,
  open,
  onClose,
}: {
  order: InvoiceOrder | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>فاتورة #{order.orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm max-h-[60vh] overflow-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground text-xs">العميل</p>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">الهاتف</p>
              <p className="font-medium">{order.customerPhone}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>
                  {item.nameAr} × {item.quantity}
                </span>
                <span className="font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between font-bold">
            <span>الإجمالي</span>
            <span className="text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>

        <Button className="gap-2" onClick={() => printInvoice(order)}>
          <Printer className="h-4 w-4" /> طباعة الفاتورة
        </Button>
      </DialogContent>
    </Dialog>
  );
}
