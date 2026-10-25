// The pharmacy's stock CSV, read only inside the reception browser (never uploaded). Stock systems export
// different layouts, so the pharmacist can pick which column is the medicine name and which the quantity.

export type CsvColumns = { nameCol: number; qtyCol: number; hasHeader: boolean };
export type StockRow = { name: string; qty: number };

// UTF-8 when the bytes are valid UTF-8 (BOM dropped), otherwise Shift_JIS -- the usual export from Japanese systems.
export function decodeCsvBytes(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('shift_jis').decode(bytes);
  }
}

// RFC 4180-style: quoted fields may hold commas, line breaks and doubled quotes. Blank lines are skipped.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

function toNumber(s: string | undefined): number | null {
  if (s === undefined) return null;
  const t = s.normalize('NFKC').replace(/[,\s]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

// Default: 1st column = name, 2nd = quantity; the first row is a header when its quantity cell isn't a number.
export function guessColumns(rows: string[][]): CsvColumns {
  const nameCol = 0;
  const qtyCol = 1;
  const hasHeader = rows.length > 0 && toNumber(rows[0][qtyCol]) === null;
  return { nameCol, qtyCol, hasHeader };
}

export function toStock(rows: string[][], cols: CsvColumns): StockRow[] {
  const out: StockRow[] = [];
  for (const r of cols.hasHeader ? rows.slice(1) : rows) {
    const name = (r[cols.nameCol] ?? '').trim();
    const qty = toNumber(r[cols.qtyCol]);
    if (name && qty !== null) out.push({ name, qty });
  }
  return out;
}
