import { Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { UserApi } from "../../../api/userApi";
import EmptyState from "../../../components/EmptyState";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import { showSuccess } from "../../../utils/showSuccess";

function Users() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery(["admin-user:list"], () =>
    UserApi.getAllUsers()
  );

  const toggleMutation = useMutation(
    (user: { id: string; active: boolean }) =>
      user.active ? UserApi.disableUser(user.id) : UserApi.enableUser(user.id),
    {
      onSuccess: () => {
        showSuccess("User status updated");
        queryClient.invalidateQueries("admin-user:list");
      },
    }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="View and manage store accounts."
      />

      {isLoading ? (
        <Paper className="panel p-0">
          <SkeletonRows rows={5} columns={5} />
        </Paper>
      ) : users?.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<PeopleOutlineIcon fontSize="large" />}
            title="No users yet"
            subtitle="Registered accounts will appear here."
          />
        </div>
      ) : (
        <TableContainer component={Paper} className="panel">
          <Table>
            <TableHead>
              <TableRow className="!bg-brand-tint">
                <TableCell className="!font-semibold !text-ink">Name</TableCell>
                <TableCell className="!font-semibold !text-ink">Email</TableCell>
                <TableCell className="!font-semibold !text-ink">Role</TableCell>
                <TableCell className="!font-semibold !text-ink">Status</TableCell>
                <TableCell align="right" className="!font-semibold !text-ink">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell className="!text-ink">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="!text-ink-soft">{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={user.role.replace("ROLE_", "")}
                      className="!font-medium !text-brand"
                      sx={{ color: "inherit" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={user.active ? "Active" : "Disabled"}
                      className={
                        user.active
                          ? "!bg-emerald-50 !text-emerald-700"
                          : "!bg-rose-50 !text-rose-700"
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <LoadingButton
                      size="small"
                      variant="outlined"
                      startIcon={
                        user.active ? <BlockIcon /> : <CheckCircleOutlineIcon />
                      }
                      loading={toggleMutation.isLoading}
                      disabled={toggleMutation.isLoading}
                      className={`normal-case ${
                        user.active
                          ? "!border-rose-300 !text-rose-700 hover:!bg-rose-50"
                          : "!border-emerald-300 !text-emerald-700 hover:!bg-emerald-50"
                      }`}
                      onClick={() =>
                        toggleMutation.mutate({ id: user.id, active: user.active })
                      }
                    >
                      {user.active ? "Disable" : "Enable"}
                    </LoadingButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default Users;