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
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

import { AddressApi } from "../../api/addressApi";
import { ShippingApi } from "../../api/shippingApi";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import { SavedAddress } from "../../types/address";
import statesAndDistrict from "../../formdata.json";
import { COUNTRIES, countryName, isIndia } from "../../formdata/countries";
import { getTerritory, isValidPhone, isValidPostal } from "../../formdata/territories";
import { CITY_OPTIONS, CITY_OTHER } from "../../formdata/cities";

const EMPTY = {
  country: "IN",
  state: "",
  district: "",
  addressDetail: "",
  pincode: "",
  phoneNumber: "",
  defaultAddress: false,
};

interface AddressFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the freshly created address (already persisted). */
  onSaved?: (address: SavedAddress) => void;
}

/**
 * Country-aware "add address" dialog shared by the address book and checkout.
 * The form follows the destination country: Indian state→district cascades,
 * first-level division lists (states/emirates/cantons/prefectures), local
 * postal + phone formats, and a major-cities dropdown with an "Other" escape.
 */
function AddressFormDialog({ open, onClose, onSaved }: AddressFormDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [cityOther, setCityOther] = useState(false);

  // Active international zones — drives the "deliverable" badge on the form.
  const { data: zones } = useQuery("shippingZones", ShippingApi.getZones, { retry: false });

  const territory = getTerritory(form.country);
  const cityOptions = CITY_OPTIONS[form.country];

  const states = useMemo(
    () => (statesAndDistrict as any[]).map((s) => s.state_name as string),
    []
  );
  const districts = useMemo(
    () =>
      ((statesAndDistrict as any[]).find((s) => s.state_name === form.state)?.districts ?? []).map(
        (d: any) => d.district_name as string
      ),
    [form.state]
  );

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

  const createMutation = useMutation(AddressApi.createSavedAddress, {
    onSuccess: (created) => {
      showSuccess("Address saved");
      queryClient.invalidateQueries("savedAddresses");
      queryClient.invalidateQueries("defaultAddress");
      setForm(EMPTY);
      setCityOther(false);
      onSaved?.(created);
      onClose();
    },
    onError: () => showError("Failed to save address"),
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

  // City picker: major cities dropdown + "Other" free-text escape hatch.
  const cityField =
    !isIndia(form.country) && cityOptions && !cityOther ? (
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
          {isIndia(form.country) ? "District" : territory.cityLabel}
        </label>
        {isIndia(form.country) ? (
          <Select
            fullWidth
            size="small"
            disabled={!form.state}
            labelId="addr-district-label"
            id="addr-district"
            label="District"
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value as string })}
          >
            {districts.map((d: string) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </Select>
        ) : (
          <input
            id="addr-district"
            type="text"
            className="input-control"
            placeholder={territory.cityExample}
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
          />
        )}
        {!isIndia(form.country) && cityOptions && (
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle className="!font-heading !text-xl !font-extrabold !tracking-tight">
        Add a new address
      </DialogTitle>
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
          ) : territory.regionHidden ? null : territory.regions ? (
            <FormControl fullWidth size="small">
              <InputLabel id="addr-state-label">{territory.regionLabel}</InputLabel>
              <Select
                labelId="addr-state-label"
                id="addr-state"
                label={territory.regionLabel}
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value as string })}
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
        <button className="secondary-button !py-2" onClick={onClose}>
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
  );
}

export default AddressFormDialog;
