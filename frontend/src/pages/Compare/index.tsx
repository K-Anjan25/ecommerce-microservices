import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import { ProductApi } from "../../api/productApi";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import { Button, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from "@mui/material";
import { getCompareIds, removeFromCompare, clearCompare } from "../../utils/compare";
import { ProductAdmin } from "../../types/product";
import { formatPrice } from "../../utils/cart";
import { useEffect, useState } from "react";

function Compare() {
  const navigate = useNavigate();
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    setCompareIds(getCompareIds());
  }, []);

  const { data: products, isLoading } = useQuery(
    ["compare:products", compareIds],
    () => ProductApi.getProductsByIds(compareIds),
    { enabled: compareIds.length > 0 }
  );

  const handleRemove = (productId: string) => {
    removeFromCompare(productId);
    setCompareIds(getCompareIds());
  };

  if (compareIds.length === 0) {
    return (
      <div className="page-shell">
        <PageHeader
          title="Compare products"
          subtitle="Select products to compare their features."
        />
        <div className="panel">
          <EmptyState
            icon={<CompareArrowsOutlinedIcon fontSize="large" />}
            title="No products to compare"
            subtitle="Add products to compare from the product page."
            action={
              <Button
                variant="contained"
                className="!bg-brand !text-paper hover:!bg-brand-main"
                onClick={() => navigate("/")}
              >
                Browse products
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const attributes = [
    { label: "Price", key: "unitPrice", format: (v: number) => formatPrice(v) },
    { label: "Category", key: "categoryName", format: (v: any) => v ?? "—" },
    { label: "Brand", key: "brand", format: (v: any) => v ?? "—" },
    { label: "Stock", key: "quantityInStock", format: (v: any) => (v <= 0 ? "Out of stock" : `${v} in stock`) },
    { label: "Description", key: "description", format: (v: any) => v || "—" },
  ];

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Compare products"
        subtitle={`Comparing ${products?.length ?? 0} product${(products?.length ?? 0) === 1 ? "" : "s"}`}
        actions={
          <Button
            variant="outlined"
            onClick={() => { clearCompare(); setCompareIds([]); }}
            className="border-ink/20 text-ink hover:border-brand hover:bg-brand-tint hover:text-brand"
          >
            Clear all
          </Button>
        }
      />

      {isLoading ? (
        <Paper className="p-6"><Typography>Loading...</Typography></Paper>
      ) : (
        <TableContainer component={Paper} className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="font-semibold">Attribute</TableCell>
                {products?.map((product: ProductAdmin) => (
                  <TableCell key={product.id} className="text-center">
                    <Box className="flex flex-col items-center gap-2">
                      <Typography variant="subtitle1" className="font-semibold">
                        {product.name}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemove(product.id)}
                      >
                        Remove
                      </Button>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {attributes.map((attr) => (
                <TableRow key={attr.key}>
                  <TableCell className="font-semibold text-ink-soft">{attr.label}</TableCell>
                  {products?.map((product: ProductAdmin) => (
                    <TableCell key={product.id} className="text-center">
                      {attr.format((product as any)[attr.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-semibold text-ink-soft">Actions</TableCell>
                {products?.map((product: ProductAdmin) => (
                  <TableCell key={product.id} className="text-center">
                    <Button
                      variant="contained"
                      size="small"
                      className="!bg-brand !text-paper"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      View details
                    </Button>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default Compare;
