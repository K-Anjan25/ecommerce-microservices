import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSelector } from "react-redux";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { ProductApi } from "../../api/productApi";
import { useI18n } from "../../features/i18n";
import { AppState } from "../../store";
import { showError } from "../../utils/showError";
import { showSuccess } from "../../utils/showSuccess";

type StockWatchProps = {
  productId: string;
};

/**
 * "Notify me when back in stock" — shown on the product page while the
 * product is sold out. Logged-in users toggle with their account email;
 * guests can subscribe by entering an email (status check is public,
 * subscribe/unsubscribe are authenticated through the gateway).
 */
function StockWatch({ productId }: StockWatchProps) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const userEmail = useSelector((state: AppState) => state.user.data.email);
  const isLoggedIn = useSelector((state: AppState) => state.user.data.isLogedIn);
  const [guestEmail, setGuestEmail] = useState("");

  const email = isLoggedIn ? userEmail : guestEmail.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? "");

  const { data: watching } = useQuery(
    ["stock-watch", productId, email],
    () => ProductApi.isWatchingStock(productId, email as string),
    { enabled: Boolean(emailValid), retry: false }
  );

  const watchMutation = useMutation(
    () => ProductApi.watchStock(productId, email as string),
    {
      onSuccess: () => {
        showSuccess(t("stock.success"));
        queryClient.invalidateQueries(["stock-watch", productId]);
      },
      onError: () => showError(t("stock.error")),
    }
  );

  const unwatchMutation = useMutation(
    () => ProductApi.unwatchStock(productId, email as string),
    {
      onSuccess: () => {
        showSuccess(t("stock.removed"));
        queryClient.invalidateQueries(["stock-watch", productId]);
      },
      onError: () => showError(t("stock.error")),
    }
  );

  const busy = watchMutation.isLoading || unwatchMutation.isLoading;

  return (
    <Box className="flex flex-wrap items-center gap-3">
      {!isLoggedIn && (
        <TextField
          size="small"
          type="email"
          label={t("stock.emailLabel")}
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
          {t("stock.watching")}
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
          {t("stock.notifyCta")}
        </Button>
      )}
    </Box>
  );
}

export default StockWatch;
