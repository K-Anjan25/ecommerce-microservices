import { useQuery } from "react-query";
import { ReferralApi } from "../../api/referralApi";
import PageHeader from "../../components/PageHeader";
import { Paper, Typography, Box, Button, TextField, Chip } from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import { showSuccess } from "../../utils/showSuccess";

function Referral() {
  const { data: referralCode } = useQuery("referralCode", ReferralApi.getMyReferralCode);
  const [inputCode, setInputCode] = useState("");

  const handleValidate = async () => {
    try {
      const valid = await ReferralApi.validateReferralCode(inputCode);
      if (valid) {
        showSuccess("Referral code is valid!");
      } else {
        toast.error("Invalid referral code");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed to validate referral code");
    }
  };

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Referral Program"
        subtitle="Share your code and earn rewards when friends sign up."
      />

      <Paper className="p-6 sm:p-10">
        <Typography variant="h6" className="mb-2 font-bold">
          Your referral code
        </Typography>
        <Typography className="mb-4 text-ink-soft">
          Share this code with friends. When they sign up, you both get rewarded!
        </Typography>
        <Box className="flex items-center gap-4">
          <Chip
            label={referralCode ?? "Loading..."}
            className="!bg-brand-soft !font-mono !text-base !font-bold"
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              if (referralCode) {
                navigator.clipboard.writeText(referralCode);
                showSuccess("Referral code copied!");
              }
            }}
          >
            Copy
          </Button>
        </Box>
      </Paper>

      <Paper className="p-6 sm:p-8">
        <Typography variant="h6" className="mb-4 font-bold">
          Validate a referral code
        </Typography>
        <Box className="flex gap-4">
          <TextField
            label="Referral code"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="flex-1"
          />
          <Button
            variant="contained"
                        onClick={handleValidate}
          >
            Validate
          </Button>
        </Box>
      </Paper>
    </div>
  );
}

export default Referral;
