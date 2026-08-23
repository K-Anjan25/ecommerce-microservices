import { LoadingButton } from "@mui/lab";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { UserApi } from "../../../api/userApi";
import DataTable, { DataColumn, StatusPill } from "../../../components/DataTable";
import EmptyState from "../../../components/EmptyState";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import { showSuccess } from "../../../utils/showSuccess";

type Row = {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  active: boolean;
};

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

  const columns: DataColumn<Row>[] = [
    {
      id: "name",
      label: "Name",
      minWidth: 180,
      render: (u) => (
        <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[0.625rem] font-bold text-brand">
            {(u.firstName?.[0] ?? "").toUpperCase()}
            {(u.lastName?.[0] ?? "").toUpperCase()}
          </span>
          <span className="font-semibold">
            {u.firstName} {u.lastName}
          </span>
        </span>
      ),
    },
    {
      id: "email",
      label: "Email",
      minWidth: 200,
      render: (u) => <span className="text-ink-soft">{u.email}</span>,
    },
    {
      id: "role",
      label: "Role",
      hideBelow: "lg",
      render: (u) => (
        <span className="chip !px-2.5 !py-0.5 !text-[0.625rem] !uppercase">
          {u.role.replace("ROLE_", "")}
        </span>
      ),
    },
    {
      id: "active",
      label: "Status",
      render: (u) => <StatusPill value={u.active ? "ACTIVE" : "DISABLED"} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Customers"
        subtitle="View and manage store accounts."
      />

      {isLoading ? (
        <SkeletonRows rows={6} columns={5} />
      ) : users?.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<PeopleOutlineIcon fontSize="large" />}
            title="No users yet"
            subtitle="Registered accounts will appear here."
          />
        </div>
      ) : (
        <DataTable<Row>
          rows={users as Row[] | undefined}
          columns={columns}
          getRowId={(u) => u.id}
          caption={`${users?.length ?? 0} account${users?.length === 1 ? "" : "s"}`}
          actions={(u) => (
            <LoadingButton
              size="small"
              variant="outlined"
              startIcon={
                u.active ? (
                  <BlockIcon sx={{ fontSize: 15 }} />
                ) : (
                  <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />
                )
              }
              loading={toggleMutation.isLoading}
              disabled={toggleMutation.isLoading}
              className={`!py-1 normal-case ${
                u.active
                  ? "!border-rose-200 !text-rose-700 hover:!bg-rose-50"
                  : "!border-emerald-200 !text-emerald-700 hover:!bg-emerald-50"
              }`}
              onClick={() => toggleMutation.mutate({ id: u.id, active: u.active })}
            >
              {u.active ? "Disable" : "Enable"}
            </LoadingButton>
          )}
        />
      )}
    </div>
  );
}

export default Users;
