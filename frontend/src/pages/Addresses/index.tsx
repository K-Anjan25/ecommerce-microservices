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
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import { SavedAddress } from "../../types/address";
import statesAndDistrict from "../../formdata.json";
import { COUNTRIES, countryName, isIndia } from "../../formdata/countries";

const EMPTY = { country: "IN", state: "", district: "", addressDetail: "", pincode: "", phoneNumber: "", defaultAddress: false };

function Addresses() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: addresses, isLoading } = useQuery(
    "savedAddresses",
    AddressApi.getSavedAddresses
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
    if (!form.state || !form.district || !form.addressDetail.trim()) {
      showError("State, city and address detail are all required");
      return;
    }
    if (isIndia(form.country) && form.pincode && !/^\d{6}$/.test(form.pincode)) {
      showError("Enter a valid 6-digit pincode");
      return;
    }
    if (!isIndia(form.country) && form.pincode && !/^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/.test(form.pincode)) {
      showError("Enter a valid postal code");
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
                  <p className="mt-1 text-sm text-ink-soft">
                    {addr.district}, {addr.state}
                    {!isIndia(addr.country) && <> · {countryName(addr.country)}</>}
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
                onChange={(e) => setForm({ ...form, country: e.target.value, state: "", district: "", pincode: "" })}
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
            ) : (
              <>
                <div>
                  <label htmlFor="addr-state" className="eyebrow mb-1.5 block">
                    State / Province
                  </label>
                  <input
                    id="addr-state"
                    type="text"
                    className="input-control"
                    placeholder="e.g. California"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="addr-district" className="eyebrow mb-1.5 block">
                    City
                  </label>
                  <input
                    id="addr-district"
                    type="text"
                    className="input-control"
                    placeholder="e.g. San Jose"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                  />
                </div>
                <p className="text-xs leading-relaxed text-ink-muted">
                  We don&apos;t deliver to {countryName(form.country)} yet — save the
                  address now and it&apos;ll be ready the moment international shipping
                  opens.
                </p>
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="addr-pincode" className="eyebrow mb-1.5 block">
                  {isIndia(form.country) ? "Pincode" : "Postal code"}
                </label>
                <input
                  id="addr-pincode"
                  type="text"
                  className="input-control"
                  placeholder={isIndia(form.country) ? "6-digit pincode" : "e.g. 95014"}
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
                  placeholder={isIndia(form.country) ? "10-digit mobile" : "+1 555 000 1234"}
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
