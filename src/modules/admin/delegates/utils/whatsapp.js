export function normalizeWhatsappPhone(phone = "") { return String(phone).replace(/\D/g, ""); }
export function buildWhatsappInvoiceUrl(phone, printData = {}) {
  const number = normalizeWhatsappPhone(phone);
  if (!number) return null;
  const invoice = printData.invoice || printData.order || printData;
  const lines = [
    `فاتورة ${invoice.invoiceNumber || invoice.orderNumber || ""}`.trim(),
    `الإجمالي: ${invoice.total || invoice.totals?.total || "0"} ج.م`,
  ];
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}
