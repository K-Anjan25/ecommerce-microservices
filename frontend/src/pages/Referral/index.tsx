import { useState } from "react";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import IosShareIcon from "@mui/icons-material/IosShare";

import { ReferralApi } from "../../api/referralApi";
import FeatureHero, { HowItWorks } from "../../components/FeatureHero";
import { showSuccess } from "../../utils/showSuccess";

function Referral() {
  const { data: referralCode } = useQuery("referralCode", ReferralApi.getMyReferralCode);
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const shareUrl = referralCode
    ? `${window.location.origin}/register?ref=${referralCode}`
    : "";

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showSuccess(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the code manually");
    }
  };

  const share = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join me on Cartly", url: shareUrl });
        return;
      } catch {
        /* user dismissed the share sheet */
      }
    }
    copy(shareUrl, "Invite link copied!");
  };

  const handleValidate = async () => {
    if (!inputCode.trim()) return;
    setChecking(true);
    try {
      const valid = await ReferralApi.validateReferralCode(inputCode.trim());
      valid ? showSuccess("Referral code is valid!") : toast.error("Invalid referral code");
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed to validate referral code");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="page-shell space-y-6">
      <FeatureHero
        eyebrow="Referrals"
        title="Invite a friend, you both win."
        description="Share your code. When someone signs up with it and places their first order, credit lands on both accounts."
        actions={
          <>
            <button onClick={share} className="accent-button" disabled={!referralCode}>
              <IosShareIcon sx={{ fontSize: 17 }} />
              Share invite link
            </button>
            <button
              onClick={() => referralCode && copy(referralCode, "Referral code copied!")}
              disabled={!referralCode}
              className="secondary-button disabled:opacity-50"
            >
              {copied ? <CheckIcon sx={{ fontSize: 17 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
              {copied ? "Copied" : "Copy code"}
            </button>
          </>
        }
      >
        <div className="inline-flex flex-wrap items-center gap-4 border border-dashed border-line bg-sunken px-6 py-4">
          <span className="text-eyebrow font-bold uppercase text-ink-muted">Your code</span>
          <span className="font-mono text-2xl font-bold tracking-[0.2em] text-brand">
            {referralCode ?? "······"}
          </span>
        </div>
      </FeatureHero>

      <HowItWorks
        steps={[
          { title: "Share your code", copy: "Send the code or the invite link to anyone who hasn't shopped with Cartly yet." },
          { title: "They sign up", copy: "Your friend enters the code when creating their account." },
          { title: "You both get credit", copy: "Credit is applied once their first order is paid for." },
        ]}
      />

      <section className="border-t border-ink py-7 sm:py-8">
        <h2 className="font-display text-2xl font-normal">Got a code from a friend?</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Check it here before you sign up, so you know it will be accepted.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
            placeholder="Enter referral code"
            aria-label="Referral code"
            className="input-control font-mono uppercase tracking-widest sm:max-w-xs"
          />
          <button
            onClick={handleValidate}
            disabled={!inputCode.trim() || checking}
            className="primary-button"
          >
            {checking ? "Checking…" : "Validate"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default Referral;
