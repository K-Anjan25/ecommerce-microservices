import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Typography,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { ProductApi } from "../../../api/productApi";
import { ProductAdmin } from "../../../types/product";
import {
  CsvVariant,
  decodeImages,
  decodeVariants,
  downloadTextFile,
  encodeImages,
  encodeVariants,
  parseCsv,
  toCsv,
} from "../../../utils/csv";
import { showError } from "../../../utils/showError";
import { showSuccess } from "../../../utils/showSuccess";

/* ==========================================================================
 * Bulk catalog import/export (admin).
 *
 * Export streams every product page through /v1/products/getAll into a flat
 * CSV. Import reuses the tested POST/PUT /v1/products endpoints row by row, so
 * each row gets the same backend validation as the form — failures are shown
 * per row, never half-silent.
 *
 * CSV columns (fixed order):
 *   id,name,categoryId,categoryName,brand,badge,unitPrice,originalPrice,
 *   featured,quantityInStock,imageUrl,images,variants,description
 *   id set → update, id empty → create.
 * ========================================================================== */

const HEADERS = [
  "id",
  "name",
  "categoryId",
  "categoryName",
  "brand",
  "badge",
  "unitPrice",
  "originalPrice",
  "featured",
  "quantityInStock",
  "imageUrl",
  "images",
  "variants",
  "description",
];

const PAGE_SIZE = 100;

async function fetchAllProducts(): Promise<ProductAdmin[]> {
  const first = await ProductApi.getProductsByPagination({ pageNo: 0, pageSize: PAGE_SIZE });
  const all: ProductAdmin[] = [...(first.data ?? [])];
  const total = Number(first.totalSize ?? all.length);
  const pages = Math.ceil(total / PAGE_SIZE);
  for (let page = 1; page < pages; page++) {
    const next = await ProductApi.getProductsByPagination({ pageNo: page, pageSize: PAGE_SIZE });
    all.push(...(next.data ?? []));
  }
  return all;
}

function productToRow(product: ProductAdmin): (string | number | boolean | undefined)[] {
  return [
    product.id,
    product.name,
    product.category?.id,
    product.category?.name,
    product.brand ?? "",
    product.badge ?? "",
    product.unitPrice,
    product.originalPrice ?? "",
    product.featured ? "true" : "false",
    product.quantityInStock ?? "",
    product.imageUrl ?? "",
    encodeImages(product.images),
    encodeVariants(product.variants),
    product.description ?? "",
  ];
}

interface ImportRow {
  rowNumber: number;
  payload: Record<string, unknown>;
  id?: string;
  name: string;
}

function rowsToImport(text: string): { rows: ImportRow[]; errors: string[] } {
  const parsed = parseCsv(text);
  if (parsed.length === 0) return { rows: [], errors: ["The file is empty."] };
  const headerIndex = new Map<string, number>();
  parsed[0].forEach((name, index) => headerIndex.set(name.trim().toLowerCase(), index));
  const missing = HEADERS.filter((h) => !headerIndex.has(h));
  if (missing.length > 0) {
    return { rows: [], errors: [`Missing columns: ${missing.join(", ")}`] };
  }
  const cell = (row: string[], column: string) => row[headerIndex.get(column)!] ?? "";
  const rows: ImportRow[] = [];
  const errors: string[] = [];
  parsed.slice(1).forEach((row, offset) => {
    const rowNumber = offset + 2; // 1-based, header is line 1
    const name = cell(row, "name").trim();
    const unitPrice = Number(cell(row, "unitPrice"));
    if (!name) {
      errors.push(`Row ${rowNumber}: name is required`);
      return;
    }
    if (cell(row, "unitPrice") === "" || Number.isNaN(unitPrice) || unitPrice < 0) {
      errors.push(`Row ${rowNumber}: unitPrice must be a number ≥ 0`);
      return;
    }
    const categoryId = Number(cell(row, "categoryId"));
    if (cell(row, "categoryId") === "" || Number.isNaN(categoryId)) {
      errors.push(`Row ${rowNumber}: categoryId must be numeric`);
      return;
    }
    const description = cell(row, "description").trim();
    if (!description) {
      errors.push(`Row ${rowNumber}: description is required`);
      return;
    }
    const variants: CsvVariant[] = decodeVariants(cell(row, "variants")).filter((v) => v.name);
    const id = cell(row, "id").trim();
    rows.push({
      rowNumber,
      id: id || undefined,
      name,
      payload: {
        name,
        unitPrice,
        categoryId,
        description,
        brand: cell(row, "brand").trim() || undefined,
        badge: cell(row, "badge").trim() || undefined,
        originalPrice: cell(row, "originalPrice") === "" ? undefined : Number(cell(row, "originalPrice")),
        featured: cell(row, "featured").trim().toLowerCase() === "true",
        quantityInStock:
          cell(row, "quantityInStock") === "" || variants.length > 0
            ? undefined
            : Number(cell(row, "quantityInStock")),
        imageUrl: cell(row, "imageUrl").trim() || undefined,
        images: decodeImages(cell(row, "images")),
        variants: variants.map((variant) => ({
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          quantityInStock: variant.quantityInStock,
          attributes: variant.attributes,
        })),
      },
    });
  });
  return { rows, errors };
}

export default function ProductCsvTools() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<{ created: number; updated: number; failures: string[] } | null>(
    null
  );

  const exportCsv = async () => {
    setExporting(true);
    try {
      const products = await fetchAllProducts();
      if (products.length === 0) {
        showError("There are no products to export yet");
        return;
      }
      const csv = toCsv([HEADERS, ...products.map(productToRow)]);
      const date = new Date().toISOString().slice(0, 10);
      downloadTextFile(`cartly-products-${date}.csv`, csv);
      showSuccess(`Exported ${products.length} product${products.length === 1 ? "" : "s"}`);
    } catch (error: any) {
      showError(error.response?.data?.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const importMutation = useMutation(
    async (rows: ImportRow[]) => {
      let created = 0;
      let updated = 0;
      const failures: string[] = [];
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        setProgress({ done: index, total: rows.length });
        try {
          if (row.id) {
            await ProductApi.updateProduct({ data: row.payload as any, id: row.id });
            updated += 1;
          } else {
            await ProductApi.saveProduct(row.payload as any);
            created += 1;
          }
        } catch (error: any) {
          const reason =
            error.response?.data?.message ?? `Request failed (status ${error.response?.status ?? "—"})`;
          failures.push(`Row ${row.rowNumber} (${row.name}): ${reason}`);
        }
        setProgress({ done: index + 1, total: rows.length });
      }
      return { created, updated, failures };
    },
    {
      onSuccess: ({ created, updated, failures }) => {
        setResults({ created, updated, failures });
        setProgress(null);
        queryClient.invalidateQueries("admin:products");
        queryClient.invalidateQueries("admin:categories");
      },
      onError: () => {
        setProgress(null);
        showError("Import failed unexpectedly");
      },
    }
  );

  const resetImport = () => {
    setImportOpen(false);
    setImportRows([]);
    setImportErrors([]);
    setResults(null);
    setProgress(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setResults(null);
    try {
      const text = await file.text();
      const { rows, errors } = rowsToImport(text);
      setImportRows(rows);
      setImportErrors(errors);
    } catch {
      showError("Could not read the file");
    }
  };

  const running = importMutation.isLoading;

  return (
    <>
      <Button
        variant="outlined"
        startIcon={
          exporting ? <CircularProgress size={16} /> : <FileDownloadOutlinedIcon />
        }
        disabled={exporting}
        onClick={exportCsv}
      >
        Export CSV
      </Button>
      <Button
        variant="outlined"
        startIcon={<FileUploadOutlinedIcon />}
        onClick={() => setImportOpen(true)}
      >
        Import CSV
      </Button>

      <Dialog open={importOpen} onClose={running ? undefined : resetImport} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk import products</DialogTitle>
        <DialogContent dividers>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {!fileName && (
            <Box className="space-y-2">
              <Typography variant="body2" className="text-ink-soft">
                Upload a CSV exported from this page (or edited in a spreadsheet). Rows with an
                <span className="font-mono"> id </span> update the existing product; rows without
                one are created. Imports run one row at a time so every product gets full backend
                validation.
              </Typography>
              <Button variant="contained" component="label" startIcon={<FileUploadOutlinedIcon />}>
                Choose CSV file
                <input
                  type="file"
                  hidden
                  accept=".csv,text/csv"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </Button>
            </Box>
          )}

          {fileName && !results && (
            <Box className="space-y-3 pt-1">
              <Typography variant="body2">
                <span className="font-semibold">{fileName}</span> — {importRows.length} valid row
                {importRows.length === 1 ? "" : "s"}
                {importErrors.length > 0 ? `, ${importErrors.length} problem${importErrors.length === 1 ? "" : "s"}` : ""}
              </Typography>
              {importErrors.length > 0 && (
                <Box className="max-h-40 space-y-1 overflow-y-auto rounded-sm border border-line bg-sunken p-3">
                  {importErrors.map((message) => (
                    <Typography key={message} variant="caption" className="block text-state-danger-on">
                      {message}
                    </Typography>
                  ))}
                </Box>
              )}
              {running && progress && (
                <Box className="space-y-1">
                  <LinearProgress
                    variant="determinate"
                    value={progress.total === 0 ? 0 : (progress.done / progress.total) * 100}
                  />
                  <Typography variant="caption" className="text-ink-soft">
                    Importing {progress.done}/{progress.total}…
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {results && (
            <Box className="space-y-3 pt-1">
              <Typography variant="body2">
                Import finished — <span className="font-semibold">{results.created} created</span>,{" "}
                <span className="font-semibold">{results.updated} updated</span>
                {results.failures.length > 0 ? (
                  <>
                    , <span className="font-semibold text-state-danger-on">{results.failures.length} failed</span>
                  </>
                ) : (
                  ", none failed"
                )}
                .
              </Typography>
              {results.failures.length > 0 && (
                <Box className="max-h-48 space-y-1 overflow-y-auto rounded-sm border border-line bg-sunken p-3">
                  {results.failures.map((message) => (
                    <Typography key={message} variant="caption" className="block text-state-danger-on">
                      {message}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={resetImport} disabled={running}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button
              variant="contained"
              disabled={running || importRows.length === 0 || fileName === ""}
              onClick={() => importMutation.mutate(importRows)}
            >
              {running ? "Importing…" : `Import ${importRows.length} product${importRows.length === 1 ? "" : "s"}`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
