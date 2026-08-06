import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, ShoppingBag, User, Phone, MapPin, Building2, Calendar, Hash, FileText } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

interface InvoiceOrder {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
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

function getPaymentMethodLabel(method?: string) {
  if (!method) return "غير محدد";
  if (method === "cash_on_delivery") return "💵 الدفع عند الاستلام (COD)";
  if (method === "vodafone_cash") return "📱 فودافون كاش (Vodafone Cash)";
  if (method === "instapay") return "⚡ إنستاباي (Instapay)";
  if (method === "bank_transfer") return "🏦 تحويل بنكي (Bank Transfer)";
  return method;
}

function printInvoice(order: InvoiceOrder) {
  const win = window.open("", "_blank", "width=850,height=1000");
  if (!win) return;

  const itemsRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="font-weight: 600;">${escapeHtml(item.nameAr)}</td>
          <td style="text-align:center; font-weight: 600;">${item.quantity}</td>
          <td style="text-align:left">${formatPrice(item.price)}</td>
          <td style="text-align:left; font-weight: 700;">${formatPrice(item.price * item.quantity)}</td>
        </tr>`,
    )
    .join("");

  const paymentLabel = getPaymentMethodLabel(order.paymentMethod);

  const html = `<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<title>فاتورة مبيعات #${escapeHtml(order.orderNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #0f172a;
    margin: 0;
    padding: 36px 44px;
    background-color: #ffffff;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 18px;
    margin-bottom: 24px;
  }
  .brand { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
  .brand-sub { font-size: 13px; font-weight: 600; color: #475569; margin-top: 2px; }
  .meta { text-align: left; font-size: 13px; color: #334155; }
  .meta-box { background: #f8fafc; padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block; }
  .section-title { font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .04em; }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 20px;
    margin-bottom: 24px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 16px;
    border-radius: 12px;
    font-size: 13px;
  }
  .info-grid .full { grid-column: 1 / -1; }
  .info-val { font-weight: 600; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th {
    text-align: right;
    font-size: 12px;
    color: #475569;
    font-weight: 700;
    background-color: #f1f5f9;
    border-bottom: 2px solid #cbd5e1;
    padding: 10px 12px;
  }
  tbody td {
    padding: 12px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 13px;
  }
  .totals { width: 280px; margin-inline-start: auto; font-size: 13px; margin-bottom: 24px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; color: #475569; }
  .totals-row.grand { font-weight: 900; font-size: 18px; color: #0f172a; border-top: 2px solid #0f172a; margin-top: 8px; padding-top: 12px; }
  .grand .amount { color: #0f172a; }
  .payment-tag { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; color: #334155; display: inline-block; margin-bottom: 24px; }
  .footer { text-align: center; font-size: 12px; font-weight: 600; color: #64748b; margin-top: 36px; padding-top: 16px; border-top: 1px dashed #cbd5e1; }
  @media print {
    body { padding: 10mm 12mm; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">المهندس</div>
      <div class="brand-sub">فاتورة مبيعات معتمدة</div>
    </div>
    <div class="meta">
      <div class="meta-box">
        <div>رقم الفاتورة: <strong>${escapeHtml(order.orderNumber)}</strong></div>
        <div style="margin-top:2px; font-size:12px; color:#64748b;">${formatDate(order.createdAt)}</div>
      </div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="section-title">اسم العميل</div>
      <div class="info-val">${escapeHtml(order.customerName)}</div>
    </div>
    <div>
      <div class="section-title">رقم الهاتف</div>
      <div class="info-val" dir="ltr" style="text-align:right">${escapeHtml(order.customerPhone)}</div>
    </div>
    ${order.customerLibraryName ? `<div><div class="section-title">اسم المكتبة</div><div class="info-val">${escapeHtml(order.customerLibraryName)}</div></div>` : ""}
    ${order.customerLibraryLocation ? `<div><div class="section-title">عنوان المكتبة</div><div class="info-val">${escapeHtml(order.customerLibraryLocation)}</div></div>` : ""}
    ${order.shipping?.address ? `<div class="full"><div class="section-title">عنوان الشحن والتسليم</div><div class="info-val">${escapeHtml(order.shipping.address)}${order.shipping.city ? "، " + escapeHtml(order.shipping.city) : ""}${order.shipping.governorate ? "، " + escapeHtml(order.shipping.governorate) : ""}</div></div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>المنتج / الصنف</th>
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
    <div class="totals-row"><span>المجموع الفرعي:</span><span>${formatPrice(order.subtotal)}</span></div>
    <div class="totals-row"><span>مصاريف الشحن:</span><span>${formatPrice(order.shippingCost)}</span></div>
    <div class="totals-row grand"><span>الإجمالي النهائي:</span><span class="amount">${formatPrice(order.total)}</span></div>
  </div>

  <div class="payment-tag">
    طريقة الدفع: <strong>${escapeHtml(paymentLabel)}</strong>
  </div>

  <div class="footer">شكرًا لتسوقك من متجر المهندس للأدوات المكتبية والقلمية 🖤</div>
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
      <DialogContent className="max-w-xl rounded-3xl p-6">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="font-black text-xl flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> معاينة الفاتورة #{order.orderNumber}
            </span>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-xl">
              {formatDate(order.createdAt)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-xs max-h-[65vh] overflow-y-auto pr-1">
          {/* Customer Card */}
          <div className="bg-muted/30 p-4 rounded-2xl border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground font-semibold">العميل:</p>
                <p className="font-extrabold text-sm">{order.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold">الهاتف:</p>
                <p className="font-extrabold text-sm" dir="ltr">{order.customerPhone}</p>
              </div>
              {order.customerLibraryName && (
                <div className="col-span-2 border-t pt-2 mt-1">
                  <p className="text-muted-foreground font-semibold">المكتبة:</p>
                  <p className="font-bold">{order.customerLibraryName} ({order.customerLibraryLocation})</p>
                </div>
              )}
              {order.shipping?.address && (
                <div className="col-span-2 border-t pt-2 mt-1">
                  <p className="text-muted-foreground font-semibold">عنوان الشحن:</p>
                  <p className="font-bold">{order.shipping.address} - {order.shipping.city} - {order.shipping.governorate}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items List Table */}
          <div className="border rounded-2xl overflow-hidden">
            <div className="bg-muted/60 px-4 py-2.5 font-extrabold flex justify-between text-xs border-b">
              <span>المنتج</span>
              <div className="flex gap-8">
                <span>الكمية</span>
                <span>الإجمالي</span>
              </div>
            </div>
            <div className="divide-y bg-card">
              {order.items.map((item, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <span className="font-bold text-sm">{item.nameAr}</span>
                  <div className="flex items-center gap-8">
                    <span className="font-semibold text-muted-foreground">× {item.quantity}</span>
                    <span className="font-extrabold text-sm w-20 text-left">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-muted/30 p-4 rounded-2xl border space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>المجموع الفرعي:</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>مصاريف الشحن:</span>
              <span>{formatPrice(order.shippingCost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-black text-base text-foreground pt-1">
              <span>الإجمالي النهائي:</span>
              <span className="text-black dark:text-white">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl border text-xs font-bold flex justify-between items-center">
            <span>طريقة الدفع:</span>
            <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
          </div>
        </div>

        <div className="pt-3 border-t flex justify-end">
          <Button className="gap-2 rounded-xl font-bold bg-black text-white hover:bg-black/90 px-6 h-11" onClick={() => printInvoice(order)}>
            <Printer className="h-4 w-4" /> طباعة الفاتورة الآن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
