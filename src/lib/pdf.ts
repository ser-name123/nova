/**
 * Zero-dependency PDF generator for NOVA ONE.
 * Builds a valid single-page A4 PDF (branded header, meta block, table,
 * totals, footer) entirely client-side and triggers a real .pdf download.
 *
 * Standard Helvetica / Helvetica-Bold (WinAnsi) — no font embedding needed.
 */

export type PdfSpec = {
  /** Small eyebrow on the brand band, e.g. "TAX INVOICE". */
  docType: string;
  /** Large heading under the band, e.g. invoice no. or proposal title. */
  title: string;
  /** Muted line under the title. */
  subtitle?: string;
  /** Left-stacked "Label: value" rows. */
  meta?: [string, string][];
  /** Optional table. */
  columns?: string[];
  rows?: string[][];
  /** Column indexes to right-align (e.g. amounts). */
  alignRight?: number[];
  /** Right-aligned "Label  value" pairs under the table. */
  totals?: [string, string][];
  /** Footer note. */
  note?: string;
};

const BRAND: [number, number, number] = [0.059, 0.404, 0.651]; // #0f67a6
const GREEN: [number, number, number] = [0.055, 0.71, 0.49];
const DARK: [number, number, number] = [0.043, 0.098, 0.173];
const MUTED: [number, number, number] = [0.32, 0.39, 0.48];
const LINE: [number, number, number] = [0.86, 0.89, 0.93];
const ZEBRA: [number, number, number] = [0.96, 0.97, 0.98];

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;

/** Map common unicode to WinAnsi-safe ASCII, then drop anything > 0xFF. */
function sanitize(input: string): string {
  const map: Record<string, string> = {
    "₹": "Rs.", "—": "-", "–": "-", "’": "'", "‘": "'", "“": '"', "”": '"',
    "•": "-", "→": "->", "←": "<-", "·": "-", "…": "...", "™": "(TM)", "°": " deg",
  };
  let out = "";
  for (const ch of input) {
    const rep = map[ch] ?? ch;
    for (const c of rep) out += c.charCodeAt(0) <= 0xff ? c : "?";
  }
  return out;
}

function esc(s: string): string {
  return sanitize(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

// Approximate Helvetica advance width (em units * 1000 avg ~ 0.52).
function textWidth(s: string, size: number): number {
  return sanitize(s).length * size * 0.52;
}

export function buildPdf(spec: PdfSpec): Uint8Array {
  const ops: string[] = [];
  const rgb = (c: [number, number, number]) => `${c[0]} ${c[1]} ${c[2]}`;

  const fill = (x: number, y: number, w: number, h: number, c: [number, number, number]) =>
    ops.push(`${rgb(c)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);

  const stroke = (x1: number, y1: number, x2: number, y2: number, w: number, c: [number, number, number]) =>
    ops.push(`${rgb(c)} RG ${w} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);

  // y is measured from the top for convenience.
  const text = (
    x: number,
    yTop: number,
    size: number,
    bold: boolean,
    str: string,
    c: [number, number, number],
    align: "left" | "right" = "left"
  ) => {
    const y = PAGE_H - yTop;
    let tx = x;
    if (align === "right") tx = x - textWidth(str, size);
    ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${rgb(c)} rg ${tx.toFixed(2)} ${y.toFixed(2)} Td (${esc(str)}) Tj ET`);
  };

  // ---- Brand header band ----
  fill(0, PAGE_H - 70, PAGE_W, 70, BRAND);
  fill(0, PAGE_H - 74, PAGE_W, 4, GREEN);
  text(MARGIN, 34, 22, true, "NOVA ONE", [1, 1, 1]);
  text(MARGIN, 52, 9, false, "Business Management Platform  |  Nova Tech Digital", [0.85, 0.92, 0.98]);
  text(PAGE_W - MARGIN, 32, 15, true, spec.docType.toUpperCase(), [1, 1, 1], "right");
  text(PAGE_W - MARGIN, 50, 9, false, new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), [0.85, 0.92, 0.98], "right");

  // ---- Title + subtitle ----
  let y = 108;
  text(MARGIN, y, 17, true, spec.title, DARK);
  if (spec.subtitle) {
    y += 20;
    text(MARGIN, y, 10.5, false, spec.subtitle, MUTED);
  }

  // ---- Meta block ----
  y += 30;
  if (spec.meta?.length) {
    for (const [k, v] of spec.meta) {
      text(MARGIN, y, 10, true, `${k}:`, MUTED);
      text(MARGIN + 110, y, 10, false, v, DARK);
      y += 16;
    }
    y += 6;
  }

  // ---- Table ----
  if (spec.columns?.length && spec.rows) {
    const cols = spec.columns;
    const n = cols.length;
    const usable = PAGE_W - MARGIN * 2;
    // first column wider for descriptions
    const firstW = usable * 0.4;
    const restW = (usable - firstW) / Math.max(1, n - 1);
    const colX = (i: number) => (i === 0 ? MARGIN : MARGIN + firstW + (i - 1) * restW);
    const alignR = new Set(spec.alignRight ?? []);

    const headY = y;
    fill(MARGIN, PAGE_H - headY - 16, usable, 22, BRAND);
    cols.forEach((c, i) => {
      const right = alignR.has(i);
      const x = right ? colX(i) + (i === 0 ? firstW : restW) - 8 : colX(i) + 8;
      text(x, headY, 9.5, true, c, [1, 1, 1], right ? "right" : "left");
    });
    y = headY + 20;

    spec.rows.forEach((r, ri) => {
      const rowH = 20;
      if (ri % 2 === 1) fill(MARGIN, PAGE_H - y - rowH + 4, usable, rowH, ZEBRA);
      r.forEach((cell, i) => {
        const right = alignR.has(i);
        const x = right ? colX(i) + (i === 0 ? firstW : restW) - 8 : colX(i) + 8;
        text(x, y + 10, 9.5, false, cell, DARK, right ? "right" : "left");
      });
      y += rowH;
    });
    stroke(MARGIN, PAGE_H - y - 1, PAGE_W - MARGIN, PAGE_H - y - 1, 0.7, LINE);
    y += 14;
  }

  // ---- Totals ----
  if (spec.totals?.length) {
    const boxX = PAGE_W - MARGIN - 230;
    for (const [k, v] of spec.totals) {
      const bold = /total|net|due|payable/i.test(k);
      text(boxX, y, bold ? 11 : 10, bold, k, bold ? DARK : MUTED);
      text(PAGE_W - MARGIN, y, bold ? 11 : 10, bold, v, bold ? BRAND : DARK, "right");
      y += 18;
    }
  }

  // ---- Footer ----
  stroke(MARGIN, 70, PAGE_W - MARGIN, 70, 0.7, LINE);
  if (spec.note) text(MARGIN, PAGE_H - 58, 8.5, false, spec.note, MUTED);
  text(MARGIN, PAGE_H - 44, 8.5, false, "Generated by NOVA ONE  |  www.novatech.digital  |  This is a system-generated document.", MUTED);
  text(PAGE_W - MARGIN, PAGE_H - 44, 8.5, true, "Powered by NOVA ONE", BRAND, "right");

  // ---- Assemble PDF ----
  const streamContent = ops.join("\n");
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(2)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Uint8Array.from(pdf, (c) => c.charCodeAt(0) & 0xff);
}

/** Build the PDF and trigger a browser download. */
export function downloadPdf(filename: string, spec: PdfSpec): void {
  const bytes = buildPdf(spec);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
