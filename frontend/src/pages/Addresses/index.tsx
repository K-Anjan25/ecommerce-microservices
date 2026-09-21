import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

import { AddressApi } from "../../api/addressApi";
import { ShippingApi } from "../../api/shippingApi";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import { SavedAddress } from "../../types/address";
import statesAndDistrict from "../../formdata.json";
import { COUNTRIES, countryName, isIndia } from "../../formdata/countries";
import Flag from "../../components/Flag";
import { CITY_OPTIONS, CITY_OTHER } from "../../formdata/cities";
import { getTerritory, isValidPhone, isValidPostal } from "../../formdata/territories";

const EMPTY = { country: "IN", state: "", district: "", addressDetail: "", pincode: "", phoneNumber: "", defaultAddress: false };

function Addresses() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: addresses, isLoading } = useQuery(
    "savedAddresses",
    AddressApi.getSavedAddresses
  );

  // Active international zones — drives the "deliverable" badge on the form.
  const { data: zones } = useQuery("shippingZones", ShippingApi.getZones, { retry: false });

  const territory = getTerritory(form.country);
  const cityOptions = CITY_OPTIONS[form.country];
  const [cityOther, setCityOther] = useState(false);
  const zoneCountries = useMemo(
    () =>
      new Set(
        (zones ?? [])
          .filter((z) => z.active)
          .flatMap((z) => (Array.isArray(z.countries) ? z.countries : z.countries.split(",")))
          .map((c) => c.trim().toUpperCase())
      ),
    [zones]
  );
  const deliverableHere = isIndia(form.country) || zoneCountries.has(form.country);

  // City picker: major cities dropdown + "Other" free-text escape hatch.
  const cityField = cityOptions && !cityOther ? (
    <FormControl fullWidth size="small">
      <InputLabel id="addr-district-label">{territory.cityLabel}</InputLabel>
      <Select
        labelId="addr-district-label"
        id="addr-district"
        label={territory.cityLabel}
        value={form.district}
        onChange={(e) => {
          if (e.target.value === CITY_OTHER) {
            setCityOther(true);
            setForm({ ...form, district: "" });
          } else {
            setForm({ ...form, district: e.target.value as string });
          }
        }}
      >
        {cityOptions.map((c) => (
          <MenuItem key={c} value={c}>
            {c}
          </MenuItem>
        ))}
        <MenuItem value={CITY_OTHER}>Other (type manually)</MenuItem>
      </Select>
    </FormControl>
  ) : (
    <div>
      <label htmlFor="addr-district" className="eyebrow mb-1.5 block">
        {territory.cityLabel}
      </label>
      <input
        id="addr-district"
        type="text"
        className="input-control"
        placeholder={territory.cityExample}
        value={form.district}
        onChange={(e) => setForm({ ...form, district: e.target.value })}
      />
      {cityOptions && (
        <button
          type="button"
          onClick={() => {
            setCityOther(false);
            setForm({ ...form, district: "" });
          }}
          className="mt-1 text-xs font-semibold text-brand hover:underline"
        >
          Choose from the list
        </button>
      )}
    </div>
  );

  /* The full state/district dataset — the same one checkout uses. This page
     previously hardcoded five states, so an address in e.g. Telangana could
     not be saved at all. */
  const states = useMemo(
    () => (statesAndDistrict as any[]).map((s) => s.state_name as string),
    []
  );
  const districts = useMemo(
    () =>
      ((statesAndDistrict as any[]).find((s) => s.state_name === form.state)?.districts ??
        []).map((d: any) => d.district_name as string),
    [form.state]
  );

  const createMutation = useMutation(AddressApi.createSavedAddress, {
    onSuccess: () => {
      showSuccess("Address saved");
      setOpen(false);
      setForm(EMPTY);
      queryClient.invalidateQueries("savedAddresses");
      queryClient.invalidateQueries("defaultAddress");
    },
    onError: () => showError("Failed to save address"),
  });

  const deleteMutation = useMutation((id: string) => AddressApi.deleteSavedAddress(id), {
    onSuccess: () => {
      showSuccess("Address deleted");
      queryClient.invalidateQueries("savedAddresses");
      queryClient.invalidateQueries("defaultAddress");
    },
    onError: () => showError("Failed to delete address"),
  });

  const handleSubmit = () => {
    if (!territory.regionHidden && !form.state.trim()) {
      showError(`${territory.regionLabel} is required`);
      return;
    }
    if (!form.district.trim() || !form.addressDetail.trim()) {
      showError("City and address detail are both required");
      return;
    }
    if (form.pincode.trim() && !isValidPostal(form.country, form.pincode)) {
      showError(`Enter a valid ${territory.postalLabel.replace(" (optional)", "").toLowerCase()}`);
      return;
    }
    if (form.phoneNumber.trim() && !isValidPhone(form.country, form.phoneNumber)) {
      showError(`Enter a valid ${territory.phoneExample.toLowerCase()}`);
      return;
    }
    createMutation.mutate(form);
  };

  const list = addresses ?? [];

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Saved addresses"
        subtitle="Addresses you save here can be applied at checkout in one tap."
        actions={
          <button onClick={() => setOpen(true)} className="primary-button !py-2">
            <AddIcon sx={{ fontSize: 17 }} />
            Add address
          </button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={140} className="!rounded-sm" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<MapOutlinedIcon fontSize="large" />}
            title="No saved addresses"
            subtitle="Save an address once and checkout stops asking for it every time."
            action={
              <button className="primary-button" onClick={() => setOpen(true)}>
                Add your first address
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid border-t border-ink md:grid-cols-2">
          {list.map((addr: SavedAddress) => (
            <article
              key={addr.id}
              className={`relative border-b border-line py-6 md:odd:pr-8 md:even:border-l md:even:pl-8 ${addr.defaultAddress ? "border-l-2 !border-l-brand pl-4" : ""}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center ${addr.defaultAddress ? "text-brand" : "text-ink-muted"}`}
                >
                  <HomeOutlinedIcon sx={{ fontSize: 18 }} />
                </span>
                <div className="min-w-0 flex-1">
                  {addr.defaultAddress && (
                    <span className="mb-1.5 inline-flex text-[0.625rem] font-bold uppercase tracking-[0.12em] text-brand">
                      Default
                    </span>
                  )}
                  <p className="font-heading text-lg font-bold leading-snug text-ink">
                    {addr.addressDetail}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                    {addr.district}, {addr.state}
                    <span className="inline-flex items-center gap-1">
                      · <Flag code={addr.country} size={14} /> {countryName(addr.country)}
                    </span>
                  </p>
                  {addr.pincode && <p className="text-sm text-ink-muted">{addr.pincode}</p>}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(addr.id)}
                  disabled={deleteMutation.isLoading}
                  aria-label="Delete address"
                  title="Delete address"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs border border-line text-ink-soft transition hover:border-state-danger hover:bg-state-danger-soft hover:text-state-danger disabled:opacity-50"
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="!font-heading !text-xl !font-extrabold !tracking-tight">Add a new address</DialogTitle>
        <DialogContent dividers>
          <div className="space-y-4 py-1">
            <FormControl fullWidth size="small">
              <InputLabel id="addr-country-label">Country</InputLabel>
              <Select
                labelId="addr-country-label"
                id="addr-country"
                label="Country"
                value={form.country || "IN"}
                onChange={(e) => {
                  setCityOther(false);
                  setForm({
                    ...form,
                    country: e.target.value,
                    state: getTerritory(e.target.value).defaultRegion ?? "",
                    district: "",
                    pincode: "",
                  });
                }}
              >
                {COUNTRIES.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {isIndia(form.country) ? (
              <>
                <FormControl fullWidth size="small">
                  <InputLabel id="addr-state-label">State</InputLabel>
                  <Select
                    labelId="addr-state-label"
                    id="addr-state"
                    label="State"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value, district: "" })}
                  >
                    {states.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" disabled={!form.state}>
                  <InputLabel id="addr-district-label">District</InputLabel>
                  <Select
                    labelId="addr-district-label"
                    id="addr-district"
                    label="District"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                  >
                    {districts.map((d: string) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            ) : territory.regionHidden ? (
              cityField
            ) : (
              <>
                {territory.regions ? (
                  <FormControl fullWidth size="small">
                    <InputLabel id="addr-state-label">{territory.regionLabel}</InputLabel>
                    <Select
                      labelId="addr-state-label"
                      id="addr-state"
                      label={territory.regionLabel}
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    >
                      {territory.regions.map((r) => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <div>
                    <label htmlFor="addr-state" className="eyebrow mb-1.5 block">
                      {territory.regionLabel}
                    </label>
                    <input
                      id="addr-state"
                      type="text"
                      className="input-control"
                      placeholder={territory.cityExample}
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>
                )}
                {cityField}
              </>
            )}

            <p
              className={`rounded-xl border px-4 py-3 text-xs font-semibold leading-relaxed ${
                deliverableHere
                  ? "border-state-success/40 bg-state-success/10 text-state-success"
                  : "border-accent/40 bg-accent-soft text-state-warning-on"
              }`}
            >
              {deliverableHere && !isIndia(form.country)
                ? `✓ We deliver to ${countryName(form.country)} — quotes appear at checkout.`
                : deliverableHere
                ? "✓ Domestic delivery with pincode rates, GST invoicing and COD."
                : `Delivery to ${countryName(form.country)} is coming soon — you can save the address now.`}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="addr-pincode" className="eyebrow mb-1.5 block">
                  {territory.postalLabel}
                </label>
                <input
                  id="addr-pincode"
                  type="text"
                  className="input-control"
                  placeholder={territory.postalExample}
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="addr-phone" className="eyebrow mb-1.5 block">
                  Phone <span className="text-ink-muted">(optional)</span>
                </label>
                <input
                  id="addr-phone"
                  type="tel"
                  className="input-control"
                  placeholder={territory.phoneExample}
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="addr-detail" className="eyebrow mb-1.5 block">
                Address detail
              </label>
              <textarea
                id="addr-detail"
                rows={3}
                className="input-control !h-auto py-2.5"
                placeholder="Flat / house no, street, landmark"
                value={form.addressDetail}
                onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
              />
            </div>

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.defaultAddress}
                  onChange={(e) => setForm({ ...form, defaultAddress: e.target.checked })}
                />
              }
              label={<span className="text-sm">Use as my default delivery address</span>}
            />
          </div>
        </DialogContent>
        <DialogActions className="!px-6 !py-4">
          <button className="secondary-button !py-2" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <LoadingButton
            variant="contained"
            onClick={handleSubmit}
            loading={createMutation.isLoading}
          >
            Save address
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Addresses;
