import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { Invoice } from "@/utils/soroban";

/**
 * Client-side PDF export for an invoice (#21). The field extraction and filename
 * are pure (and unit-tested); {@link buildInvoicePdf}/{@link downloadInvoicePdf}
 * are the thin jsPDF glue that lays out the document and embeds a QR code linking
 * back to the invoice's detail page.
 */

export interface InvoicePdfData {
  tokenSymbol: string;
  /** Human-formatted amount, e.g. "5,000.00". */
  amountFormatted: string;
  /** Human-formatted due date, e.g. "Jan 1, 2030". */
  dueDateFormatted: string;
  /** Canonical invoice URL encoded into the QR code. */
  shareUrl: string;
}

export interface PdfField {
  label: string;
  value: string;
}

export function invoicePdfFilename(id: bigint): string {
  return `ILN-Invoice-${id.toString()}.pdf`;
}

export function invoicePdfFields(invoice: Invoice, data: InvoicePdfData): PdfField[] {
  return [
    { label: "Invoice ID", value: `#${invoice.id.toString()}` },
    { label: "Submitter", value: invoice.freelancer },
    { label: "Payer", value: invoice.payer },
    { label: "Amount", value: `${data.amountFormatted} ${data.tokenSymbol}` },
    { label: "Token", value: data.tokenSymbol },
    { label: "Discount Rate", value: `${(invoice.discount_rate / 100).toFixed(2)}%` },
    { label: "Due Date", value: data.dueDateFormatted },
    { label: "Status", value: invoice.status },
  ];
}

export async function buildInvoicePdf(invoice: Invoice, data: InvoicePdfData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;

  // ── ILN branding ──
  doc.setFontSize(22);
  doc.setTextColor(20, 83, 45);
  doc.text("ILN", margin, y);
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text("Invoice Liquidity Network", margin + 44, y);
  y += 28;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, 547, y);
  y += 28;

  // ── Fields ──
  doc.setFontSize(12);
  for (const field of invoicePdfFields(invoice, data)) {
    doc.setTextColor(120, 120, 120);
    doc.text(field.label, margin, y);
    doc.setTextColor(20, 20, 20);
    doc.text(field.value, margin + 120, y, { maxWidth: 360 });
    y += 24;
  }

  // ── QR code linking to the detail page ──
  try {
    const qr = await QRCode.toDataURL(data.shareUrl, { margin: 1, width: 160 });
    doc.addImage(qr, "PNG", 547 - 120, margin + 8, 120, 120);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Scan to view invoice", 547 - 120, margin + 142);
  } catch {
    // A failed QR render must not block the rest of the document.
  }

  return doc;
}

export async function downloadInvoicePdf(invoice: Invoice, data: InvoicePdfData): Promise<void> {
  const doc = await buildInvoicePdf(invoice, data);
  doc.save(invoicePdfFilename(invoice.id));
}
