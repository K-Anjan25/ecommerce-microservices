import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSelector } from "react-redux";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { ProductApi } from "../../api/productApi";
import { AppState } from "../../store";
import { showError } from "../../utils/showError";
import { showSuccess } from "../../utils/showSuccess";

type PriceWatchProps = {
  productId: string;
};

/**
 * Price-drop alert subscription. Logged-in users toggle with their account
 * email; guests can subscribe by entering an email (read-only status check is
 * public, subscribe/unsubscribe require authentication through the gateway).
 */
function PriceWatch({ productId }: PriceWatchProps) {
  const queryClient = useQueryClient();
  const userEmail = useSelector((state: AppState) => state.user.data.email);
  const isLoggedIn = useSelector(
    (state: AppState) => state.user.data.isLogedIn
  );
  const [guestEmail, setGuestEmail] = useState("");

  const email = isLoggedIn ? userEmail : guestEmail.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? "");

  const { data: watching } = useQuery(
    ["price-watch", productId, email],
    () => ProductApi.isWatchingPrice(productId, email as string),
    { enabled: Boolean(emailValid), retry: false }
  );

  const watchMutation = useMutation(
    () => ProductApi.watchPrice(productId, email as string),
    {
      onSuccess: () => {
        showSuccess("We'll email you when the price drops");
        queryClient.invalidateQueries(["price-watch", productId]);
      },
      onError: () => showError("Could not set up the price alert"),
    }
  );

  const unwatchMutation = useMutation(
    () => ProductApi.unwatchPrice(productId, email as string),
    {
      onSuccess: () => {
        showSuccess("Price alert removed");
        queryClient.invalidateQueries(["price-watch", productId]);
      },
      onError: () => showError("Could not remove the price alert"),
    }
  );

  const busy = watchMutation.isLoading || unwatchMutation.isLoading;

  return (
    <Box className="flex flex-wrap items-center gap-3">
      {!isLoggedIn && (
        <TextField
          size="small"
          type="email"
          label="Email for price alert"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className="!w-64"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <NotificationsNoneIcon fontSize="small" className="text-ink-soft" />
              </InputAdornment>
            ),
          }}
        />
      )}
      {watching ? (
        <Button
          size="small"
          variant="outlined"
          startIcon={<NotificationsActiveOutlinedIcon />}
          disabled={busy || (!isLoggedIn && !emailValid)}
          onClick={() => unwatchMutation.mutate()}
          className="!border-brand !text-brand hover:!bg-brand-tint"
        >
          Watching price
        </Button>
      ) : (
        <Button
          size="small"
          variant="outlined"
          startIcon={<NotificationsNoneIcon />}
          disabled={busy || !emailValid}
          onClick={() => watchMutation.mutate()}
          className="!border-ink/20 !text-ink hover:!border-brand hover:!bg-brand-tint hover:!text-brand"
        >
          Alert me on price drop
        </Button>
      )}
    </Box>
  );
}

export default PriceWatch;
