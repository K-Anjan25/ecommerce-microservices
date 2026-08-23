import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Alert, FormControlLabel, Skeleton, Switch, TextField } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

import PageHeader from "../../../components/PageHeader";
import { StoreSettingsApi, DEFAULT_STORE_SETTINGS } from "../../../features/storefront";
import type { StoreSettings } from "../../../features/storefront";
import { showError } from "../../../utils/showError";
import { showSuccess } from "../../../utils/showSuccess";

const fields: { key: keyof StoreSettings; label: string; helper?: string; multiline?: boolean }[] = [
  { key: "announcementText", label: "Announcement", helper: "Keep this useful and under 160 characters." },
  { key: "announcementLinkText", label: "Announcement link label" },
  { key: "announcementLinkUrl", label: "Announcement link URL", helper: "Use a local path such as /flash-sales or a full URL." },
  { key: "heroEyebrow", label: "Hero eyebrow" },
  { key: "heroTitle", label: "Hero title" },
  { key: "heroEmphasis", label: "Hero emphasized line" },
  { key: "heroDescription", label: "Hero description", multiline: true },
  { key: "primaryCtaLabel", label: "Primary action label" },
  { key: "secondaryCtaLabel", label: "Secondary action label" },
];

export default function StoreSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery("store-settings", StoreSettingsApi.get, {
    retry: false,
  });
  const [form, setForm] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation(StoreSettingsApi.update, {
    onSuccess: (saved) => {
      queryClient.setQueryData("store-settings", saved);
      setForm(saved);
      showSuccess("Storefront settings published");
    },
    onError: (error: any) =>
      showError(error.response?.data?.message ?? "Could not publish storefront settings"),
  });

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const valid =
    form.heroEyebrow.trim() &&
    form.heroTitle.trim() &&
    form.heroEmphasis.trim() &&
    form.heroDescription.trim() &&
    form.primaryCtaLabel.trim() &&
    form.secondaryCtaLabel.trim() &&
    form.freeShippingThreshold >= 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storefront"
        subtitle="Publish homepage messaging and commercial settings without a frontend deployment."
        actions={
          <LoadingButton
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            loading={mutation.isLoading}
            disabled={!valid || isLoading}
            onClick={() => mutation.mutate(form)}
          >
            Publish changes
          </LoadingButton>
        }
      />

      {isError && (
        <Alert severity="warning">
          The saved configuration could not be loaded. Safe defaults are shown; publishing will create it.
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton variant="rounded" height={520} />
          <Skeleton variant="rounded" height={380} />
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]">
          <div className="panel space-y-5 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="font-heading text-lg font-bold text-ink">Homepage content</p>
                <p className="mt-1 text-sm text-ink-muted">Changes become public as soon as they are published.</p>
              </div>
              <FormControlLabel
                label="Announcement"
                labelPlacement="start"
                control={
                  <Switch
                    checked={form.announcementEnabled}
                    onChange={(event) => set("announcementEnabled", event.target.checked)}
                  />
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <TextField
                  key={field.key}
                  label={field.label}
                  value={String(form[field.key] ?? "")}
                  onChange={(event) => set(field.key, event.target.value as never)}
                  helperText={field.helper}
                  multiline={field.multiline}
                  minRows={field.multiline ? 3 : undefined}
                  fullWidth
                  className={field.multiline || field.key === "announcementText" || field.key === "announcementLinkUrl" ? "sm:col-span-2" : ""}
                />
              ))}
              <TextField
                label="Free-shipping threshold (₹)"
                type="number"
                value={form.freeShippingThreshold}
                onChange={(event) => set("freeShippingThreshold", Math.max(0, Number(event.target.value)))}
                inputProps={{ min: 0, step: 1 }}
                helperText="Used in storefront confidence messaging."
                fullWidth
              />
            </div>
          </div>

          <aside className="sticky top-[9rem]">
            <p className="eyebrow mb-3">Live content preview</p>
            <div className="overflow-hidden rounded-xl2 border border-line bg-paper shadow-lift">
              {form.announcementEnabled && (
                <div className="flex min-h-9 items-center justify-center gap-2 bg-contrast px-4 text-center text-[0.6875rem] font-semibold text-oncontrast">
                  {form.announcementText || "Announcement text"}
                  {form.announcementLinkText && (
                    <span className="text-accent">· {form.announcementLinkText}</span>
                  )}
                </div>
              )}
              <div className="grain bg-contrast p-7 text-oncontrast sm:p-9">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-ink">
                  <StorefrontOutlinedIcon sx={{ fontSize: 19 }} />
                </span>
                <p className="eyebrow mt-8 !text-accent">{form.heroEyebrow || "Eyebrow"}</p>
                <h2 className="mt-3 font-heading text-4xl font-extrabold leading-[1.03]">
                  {form.heroTitle || "Hero title"}
                  <span className="mt-1 block font-display font-normal italic text-accent">
                    {form.heroEmphasis || "Emphasized line"}
                  </span>
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                  {form.heroDescription || "Hero description"}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="accent-button">{form.primaryCtaLabel || "Primary action"}</span>
                  <span className="rounded-sm border border-white/20 px-4 py-2.5 text-sm font-semibold">
                    {form.secondaryCtaLabel || "Secondary action"}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              Preview checks copy hierarchy only. Product imagery and responsive layout remain controlled by the storefront.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
