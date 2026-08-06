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
  if (method === "cash_on_delivery") return "الدفع عند الاستلام (COD)";
  if (method === "vodafone_cash") return "فودافون كاش (Vodafone Cash)";
  if (method === "instapay") return "إنستاباي (Instapay)";
  if (method === "bank_transfer") return "تحويل بنكي (Bank Transfer)";
  return method;
}

function printInvoice(order: InvoiceOrder) {
  const win = window.open("", "_blank", "width=880,height=1050");
  if (!win) return;

  const itemsRows = order.items
    .map(
      (item, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? "background-color: #fafafa;" : ""}">
          <td style="padding: 14px 16px; font-weight: 700; color: #0f172a;">${escapeHtml(item.nameAr)}</td>
          <td style="padding: 14px 16px; text-align: center; font-weight: 800; color: #1e293b;">${item.quantity}</td>
          <td style="padding: 14px 16px; text-align: left; color: #475569;">${formatPrice(item.price)}</td>
          <td style="padding: 14px 16px; text-align: left; font-weight: 900; color: #0f172a;">${formatPrice(item.price * item.quantity)}</td>
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
    padding: 40px 48px;
    background-color: #ffffff;
    -webkit-print-color-adjust: exact;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid #0f172a;
    padding-bottom: 20px;
    margin-bottom: 28px;
  }
  .brand { font-size: 30px; font-weight: 900; color: #0f172a; letter-spacing: -0.03em; }
  .brand-sub { font-size: 13px; font-weight: 700; color: #64748b; margin-top: 3px; letter-spacing: 0.05em; text-transform: uppercase; }
  .meta-card {
    background: #0f172a;
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 12px;
    text-align: left;
  }
  .meta-num { font-size: 15px; font-weight: 900; letter-spacing: 0.02em; }
  .meta-date { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  
  .info-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 28px;
  }
  .info-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 16px 20px;
  }
  .info-box.full { grid-column: 1 / -1; }
  .box-title { font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
  .box-val { font-size: 14px; font-weight: 700; color: #0f172a; }
  .box-sub { font-size: 12px; color: #475569; margin-top: 2px; }

  table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 28px; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
  thead th {
    text-align: right;
    font-size: 12px;
    color: #ffffff;
    font-weight: 800;
    background-color: #0f172a;
    padding: 12px 16px;
  }
  
  .summary-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
  }
  .payment-card {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 14px 18px;
    font-size: 13px;
    color: #334155;
    max-width: 320px;
  }
  .totals-table {
    width: 300px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 16px 20px;
    font-size: 14px;
  }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; color: #475569; font-weight: 600; }
  .totals-row.grand {
    font-weight: 900;
    font-size: 19px;
    color: #ffffff;
    background: #0f172a;
    margin: 10px -20px -16px -20px;
    padding: 14px 20px;
    border-bottom-left-radius: 14px;
    border-bottom-right-radius: 14px;
  }

  .footer {
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px dashed #e2e8f0;
  }
  @media print {
    body { padding: 8mm 10mm; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">المهندس</div>
      <div class="brand-sub">مؤسسة الأدوات المكتبية والقلمية</div>
    </div>
    <div class="meta-card">
      <div class="meta-num">فاتورة #${escapeHtml(order.orderNumber)}</div>
      <div class="meta-date">تاريخ الإصدار: ${formatDate(order.createdAt)}</div>
    </div>
  </div>

  <div class="info-container">
    <div class="info-box">
      <div class="box-title">بيانات العميل</div>
      <div class="box-val">${escapeHtml(order.customerName)}</div>
      <div class="box-sub" dir="ltr" style="text-align:right">${escapeHtml(order.customerPhone)}</div>
    </div>

    ${order.customerLibraryName ? `
    <div class="info-box">
      <div class="box-title">بيانات المكتبة</div>
      <div class="box-val">${escapeHtml(order.customerLibraryName)}</div>
      <div class="box-sub">${escapeHtml(order.customerLibraryLocation || "")}</div>
    </div>` : `
    <div class="info-box">
      <div class="box-title">حالة الدفع</div>
      <div class="box-val">${escapeHtml(paymentLabel)}</div>
    </div>`}

    ${order.shipping?.address ? `
    <div class="info-box full">
      <div class="box-title">عنوان الشحن والتسليم</div>
      <div class="box-val">${escapeHtml(order.shipping.address)}${order.shipping.city ? "، " + escapeHtml(order.shipping.city) : ""}${order.shipping.governorate ? "، " + escapeHtml(order.shipping.governorate) : ""}</div>
    </div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>الصنف / المنتج</th>
        <th style="text-align:center">الكمية</th>
        <th style="text-align:left">سعر القطعة</th>
        <th style="text-align:left">المجموع</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="summary-section">
    <div class="payment-card">
      <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:4px">طريقة السداد</div>
      <div style="font-weight:800; font-size:14px; color:#0f172a">${escapeHtml(paymentLabel)}</div>
    </div>

    <div class="totals-table">
      <div class="totals-row"><span>المجموع الفرعي:</span><span>${formatPrice(order.subtotal)}</span></div>
      <div class="totals-row"><span>مصاريف الشحن:</span><span>${formatPrice(order.shippingCost)}</span></div>
      <div class="totals-row grand"><span>الإجمالي النهائي:</span><span>${formatPrice(order.total)}</span></div>
    </div>
  </div>

  <div class="footer">شكراً لثقتكم واختياركم متجر المهندس لجميع المستلزمات المكتبية والقلمية</div>
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
            <span>معاينة الفاتورة #{order.orderNumber}</span>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-xl">
              {formatDate(order.createdAt)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-xs max-h-[65vh] overflow-y-auto pr-1">
          {/* Customer Info Card */}
          <div className="bg-muted/30 p-4 rounded-2xl border space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground font-semibold">العميل:</p>
                <p className="font-extrabold text-sm mt-0.5">{order.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold">الهاتف:</p>
                <p className="font-extrabold text-sm mt-0.5" dir="ltr">{order.customerPhone}</p>
              </div>
              {order.customerLibraryName && (
                <div className="col-span-2 border-t pt-2 mt-1">
                  <p className="text-muted-foreground font-semibold">المكتبة:</p>
                  <p className="font-bold text-sm">{order.customerLibraryName} ({order.customerLibraryLocation})</p>
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

          {/* Items Table */}
          <div className="border rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-black text-white px-4 py-3 font-black flex justify-between text-xs">
              <span>المنتج / الصنف</span>
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
                    <span className="font-bold text-muted-foreground">× {item.quantity}</span>
                    <span className="font-black text-sm w-20 text-left">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-muted/40 rounded-2xl border text-xs flex flex-col justify-center">
              <p className="text-muted-foreground font-bold mb-1">طريقة الدفع:</p>
              <p className="font-extrabold text-sm text-foreground">
                {getPaymentMethodLabel(order.paymentMethod)}
              </p>
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl border space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>المجموع الفرعي:</span>
                <span className="font-semibold">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>مصاريف الشحن:</span>
                <span className="font-semibold">{formatPrice(order.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-black text-base pt-1">
                <span>الإجمالي النهائي:</span>
                <span className="text-black dark:text-white">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <Button className="gap-2 rounded-xl font-bold bg-black text-white hover:bg-black/90 px-6 h-11 shadow-sm" onClick={() => printInvoice(order)}>
            <Printer className="h-4 w-4" /> طباعة الفاتورة الآن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
