/* ==========================================================================
 * Minimal RFC-4180 CSV reader/writer + product row codecs.
 *
 * Used by the admin bulk import/export. Multi-value fields are encoded in a
 * single cell so the file stays one flat table:
 *   images   → URLs joined by `|`
 *   variants → rows joined by `;`, fields joined by `~`
 *              (name~sku~price~qty~attributes)
 * Names/SKUs containing `~`, `;`, `|` or `,` are still safe — the whole cell
 * is CSV-quoted — but such characters inside those specific fields will split
 * on re-import, so the codecs strip them defensively instead of corrupting.
 * ========================================================================== */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
    row = [];
  };
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
    } else if (ch === ",") {
      pushField();
      i++;
    } else if (ch === "\r") {
      i++;
    } else if (ch === "\n") {
      pushRow();
      i++;
    } else {
      field += ch;
      i++;
    }
  }
  if (field !== "" || row.length > 0) pushRow();
  return rows;
}

export function toCsv(rows: (string | number | boolean | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? "" : String(cell);
          return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(",")
    )
    .join("\n");
}

/** Field/value separators for encoded cells, stripped defensively on decode. */
const LIST_SEP = ";";
const ITEM_SEP = "~";
const IMAGE_SEP = "|";

const regexEscape = (chars: string) => chars.replace(/[.*+?^${}()|[\]\\\-]/g, "\\$&");
const sanitize = (value: string | undefined, forbidden: string) =>
  (value ?? "").replace(new RegExp(`[${regexEscape(forbidden)}]`, "g"), " ").trim();

export const encodeImages = (images: string[] | undefined) =>
  (images ?? []).map((url) => sanitize(url, IMAGE_SEP)).filter(Boolean).join(IMAGE_SEP);

export const decodeImages = (cell: string | undefined) =>
  (cell ?? "")
    .split(IMAGE_SEP)
    .map((url) => url.trim())
    .filter(Boolean);

export const encodeVariants = (
  variants:
    | {
        name: string;
        sku?: string;
        price?: number;
        quantityInStock?: number;
        attributes?: string;
      }[]
    | undefined
) =>
  (variants ?? [])
    .map((variant) =>
      [
        sanitize(variant.name, `${ITEM_SEP}${LIST_SEP}`),
        sanitize(variant.sku, `${ITEM_SEP}${LIST_SEP}`),
        variant.price ?? "",
        variant.quantityInStock ?? "",
        sanitize(variant.attributes, `${ITEM_SEP}${LIST_SEP}`),
      ].join(ITEM_SEP)
    )
    .filter((row) => row.replace(/~/g, "").trim() !== "")
    .join(LIST_SEP);

export interface CsvVariant {
  name: string;
  sku?: string;
  price?: number;
  quantityInStock?: number;
  attributes?: string;
}

export const decodeVariants = (cell: string | undefined): CsvVariant[] =>
  (cell ?? "")
    .split(LIST_SEP)
    .map((row) => row.split(ITEM_SEP))
    .filter((parts) => parts[0]?.trim() !== "")
    .map((parts) => ({
      name: parts[0]?.trim() ?? "",
      sku: parts[1]?.trim() || undefined,
      price: parts[2] !== undefined && parts[2] !== "" ? Number(parts[2]) : undefined,
      quantityInStock:
        parts[3] !== undefined && parts[3] !== "" ? Number(parts[3]) : undefined,
      attributes: parts[4]?.trim() || undefined,
    }));

/** Download text as a file (admin-side export helper). */
export function downloadTextFile(filename: string, text: string, mime = "text/csv") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
