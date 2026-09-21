import { useMutation, useQuery, useQueryClient } from "react-query";
import { Skeleton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { useState } from "react";

import { AddressApi } from "../../api/addressApi";
import AddressFormDialog from "../../components/AddressFormDialog";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import { SavedAddress } from "../../types/address";
import { countryName } from "../../formdata/countries";
import { Flag } from "../../components/Flag";

function Addresses() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: addresses, isLoading } = useQuery(
    "savedAddresses",
    AddressApi.getSavedAddresses
  );

  const deleteMutation = useMutation((id: string) => AddressApi.deleteSavedAddress(id), {
    onSuccess: () => {
      showSuccess("Address deleted");
      queryClient.invalidateQueries("savedAddresses");
      queryClient.invalidateQueries("defaultAddress");
    },
    onError: () => showError("Failed to delete address"),
  });

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
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
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

      <AddressFormDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export default Addresses;
