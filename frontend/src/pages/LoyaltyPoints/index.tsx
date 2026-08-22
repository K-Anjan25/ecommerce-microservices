import { useQuery } from "react-query";
import { LoyaltyPointApi } from "../../api/loyaltyPointApi";
import PageHeader from "../../components/PageHeader";
import { Paper, Typography, Box, List, ListItem, ListItemText, Divider, Chip } from "@mui/material";
import { LoyaltyPointType } from "../../types/loyaltyPoint";
import { formatDate } from "../../utils/date";

function LoyaltyPoints() {
  const { data: balance } = useQuery("loyaltyBalance", LoyaltyPointApi.getBalance);
  const { data: history } = useQuery("loyaltyHistory", LoyaltyPointApi.getHistory);

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Loyalty Points"
        subtitle="Earn points on every purchase and redeem for discounts."
      />

      <Paper className="p-6 sm:p-10">
        <Typography variant="h4" className="font-bold">
          {balance ?? 0} points
        </Typography>
        <Typography className="text-ink-soft">
          Earn 1 point for every ₹10 spent
        </Typography>
      </Paper>

      <Paper className="p-6 sm:p-8">
        <Typography variant="h6" className="mb-4 font-bold">
          Points history
        </Typography>
        {!history || history.length === 0 ? (
          <Typography className="text-ink-soft">No points yet. Place an order to start earning!</Typography>
        ) : (
          <List>
            {history.map((entry, idx) => (
              <>
                <ListItem key={entry.id} className="gap-4">
                  <ListItemText
                    primary={entry.description}
                    secondary={formatDate(entry.createdDate)}
                  />
                  <Chip
                    label={`${entry.type === LoyaltyPointType.EARNED ? "+" : ""}${entry.points}`}
                    color={entry.type === LoyaltyPointType.EARNED ? "success" : "error"}
                    size="small"
                  />
                </ListItem>
                {idx < history.length - 1 && <Divider />}
              </>
            ))}
          </List>
        )}
      </Paper>
    </div>
  );
}

export default LoyaltyPoints;
