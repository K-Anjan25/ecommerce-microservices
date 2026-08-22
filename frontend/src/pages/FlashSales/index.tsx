import { useQuery } from "react-query";
import { ProductApi } from "../../api/productApi";
import PageHeader from "../../components/PageHeader";
import { Paper, Typography, Box, Grid } from "@mui/material";
import Card from "../../components/Card";

function FlashSales() {
  const { data: flashSales = [] } = useQuery("flashSales", ProductApi.getFlashSales);

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Flash Sales"
        subtitle="Limited time offers — grab them before they're gone!"
      />

      {flashSales.length === 0 ? (
        <Paper className="p-6 sm:p-8">
          <Typography className="text-ink-soft">No active flash sales right now. Check back later!</Typography>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {flashSales.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card product={product} />
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
}

export default FlashSales;
