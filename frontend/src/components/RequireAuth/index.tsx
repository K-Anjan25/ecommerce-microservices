import { Navigate, Outlet, useLocation } from "react-router-dom";

interface AuthProps {
  allowedRoles: string[];
  roles: string[];
}

function RequireAuth({ allowedRoles, roles }: AuthProps) {
  const location = useLocation();

  let isPermitted = roles?.find((role) => allowedRoles?.includes(role));

  // No session storage on the server: crawlers never see protected routes,
  // and the client gate re-runs this check after hydration anyway.
  const token = typeof window === "undefined" ? null : localStorage.getItem("access-token");

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isPermitted) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
