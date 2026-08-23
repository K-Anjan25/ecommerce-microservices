import { useMutation } from "react-query";
import { useState } from "react";
import { GiftCardApi } from "../../api/giftCardApi";
import PageHeader from "../../components/PageHeader";
import { Paper, Typography, Button, TextField, Box, Chip } from "@mui/material";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import { GiftCard, GiftCardStatus } from "../../types/giftCard";

function GiftCards() {
  const [amount, setAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [days, setDays] = useState("365");
  const [purchased, setPurchased] = useState<GiftCard | null>(null);

  const purchaseMutation = useMutation(GiftCardApi.purchaseGiftCard, {
    onSuccess: (data) => {
      showSuccess("Gift card purchased successfully!");
      setPurchased(data);
    },
    onError: (e: any) => {
      showError(e.response?.data?.message ?? "Failed to purchase gift card");
    },
  });

  const handlePurchase = () => {
    if (!amount || Number(amount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(days));

    purchaseMutation.mutate({
      amount: Number(amount),
      recipientEmail: recipientEmail || undefined,
      expiryDate: expiryDate.toISOString().split("T")[0],
    });
  };

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Gift Cards"
        subtitle="Purchase a gift card for friends and family."
      />

      <Paper className="mx-auto max-w-xl p-6 sm:p-10">
        <Typography variant="h6" className="mb-4 font-bold">
          Purchase a gift card
        </Typography>
        <div className="space-y-4">
          <TextField
            label="Amount (INR)"
            type="number"
            size="small"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Recipient email (optional)"
            type="email"
            size="small"
            fullWidth
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
          <TextField
            label="Validity (days)"
            type="number"
            size="small"
            fullWidth
            value={days}
            onChange={(e) => setDays(e.target.value)}
            inputProps={{ min: 1 }}
          />
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handlePurchase}
            disabled={purchaseMutation.isLoading}
          >
            Purchase gift card
          </Button>
        </div>

        {purchased && (
          <Box className="mt-6 rounded-xl bg-brand-tint p-5">
            <Typography className="font-semibold">Gift card created!</Typography>
            <Typography className="mt-1 text-sm text-ink-soft">
              Code: <span className="font-mono font-bold">{purchased.code}</span>
            </Typography>
            <Typography className="text-sm text-ink-soft">
              Balance: {purchased.initialBalance} · Expires: {purchased.expiryDate}
            </Typography>
            <Chip
              label={purchased.status}
              size="small"
              className="mt-2"
              color={purchased.status === GiftCardStatus.ACTIVE ? "success" : "error"}
            />
          </Box>
        )}
      </Paper>
    </div>
  );
}

export default GiftCards;
