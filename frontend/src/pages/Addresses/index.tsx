import { useMutation, useQuery, useQueryClient } from "react-query";
import { useState } from "react";
import { AddressApi } from "../../api/addressApi";
import PageHeader from "../../components/PageHeader";
import { Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Chip, Box } from "@mui/material";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import { SavedAddress } from "../../types/address";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";

function Addresses() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ state: "", district: "", addressDetail: "", defaultAddress: false });

  const { data: addresses, isLoading } = useQuery("savedAddresses", AddressApi.getSavedAddresses);

  const createMutation = useMutation(AddressApi.createSavedAddress, {
    onSuccess: () => {
      showSuccess("Address saved");
      setOpen(false);
      setForm({ state: "", district: "", addressDetail: "", defaultAddress: false });
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
  });

  const handleSubmit = () => {
    if (!form.state || !form.district || !form.addressDetail) {
      showError("All fields are required");
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Saved addresses"
        subtitle="Manage your delivery addresses."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            className="!bg-brand !text-paper hover:!bg-brand-main"
            onClick={() => setOpen(true)}
          >
            Add address
          </Button>
        }
      />

      {isLoading ? (
        <Paper className="p-6"><Typography>Loading...</Typography></Paper>
      ) : addresses?.length === 0 ? (
        <div className="panel">
          <Paper className="p-8 text-center">
            <MapOutlinedIcon fontSize="large" className="!text-ink-soft" />
            <Typography className="mt-2 text-ink-soft">No saved addresses yet.</Typography>
          </Paper>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses?.map((addr: SavedAddress) => (
            <Paper key={addr.id} className="p-5">
              <Box className="flex items-start justify-between">
                <div>
                  <Typography className="font-semibold">{addr.addressDetail}</Typography>
                  <Typography className="text-sm text-ink-soft">
                    {addr.district}, {addr.state}
                  </Typography>
                  {addr.defaultAddress && (
                    <Chip label="Default" size="small" className="mt-2 !bg-brand-soft !text-brand" />
                  )}
                </div>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => deleteMutation.mutate(addr.id)}
                >
                  Delete
                </Button>
              </Box>
            </Paper>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add new address</DialogTitle>
        <DialogContent>
          <div className="space-y-3 pt-2">
            <FormControl fullWidth size="small">
              <InputLabel>State</InputLabel>
              <Select
                value={form.state}
                label="State"
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              >
                <MenuItem value="">Select state</MenuItem>
                <MenuItem value="Karnataka">Karnataka</MenuItem>
                <MenuItem value="Maharashtra">Maharashtra</MenuItem>
                <MenuItem value="Delhi">Delhi</MenuItem>
                <MenuItem value="Tamil Nadu">Tamil Nadu</MenuItem>
                <MenuItem value="West Bengal">West Bengal</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="District"
              size="small"
              fullWidth
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
            <TextField
              label="Address detail"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={form.addressDetail}
              onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} className="!bg-brand !text-paper">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Addresses;
