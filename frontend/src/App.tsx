import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";
import RequireAuth from "./components/RequireAuth";
import React, { Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { userMe } from "./store/actions/userAction";
import { AppState } from "./store";
import Loader from "./components/Loader";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/Admin/Home";
import ForgetPassword from "./pages/Login/ForgetPassword";
import Profile from "./pages/Profile";
import Account from "./pages/Account";

function App() {
  const dispatch = useDispatch<any>();
  const { data, loading } = useSelector((state: AppState) => state.user);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("access-token")) {
      dispatch(userMe());
    }
    setInitialLoading(false);
  }, [dispatch]);

  if (loading || initialLoading) {
    return <Loader />;
  }

  const Cart = React.lazy(() => import("./pages/Cart"));
  const Checkout = React.lazy(() => import("./pages/Checkout"));
  const AdminProducts = React.lazy(() => import("./pages/Admin/Products"));
  const AdminOrders = React.lazy(() => import("./pages/Admin/Orders"));
  const AdminCategories = React.lazy(() => import("./pages/Admin/Categories"));
  const AdminUsers = React.lazy(() => import("./pages/Admin/Users"));
  const AdminCoupons = React.lazy(() => import("./pages/Admin/Coupons"));
  const AdminReturns = React.lazy(() => import("./pages/Admin/Returns"));
  const AdminStoreSettings = React.lazy(() => import("./pages/Admin/StoreSettings"));
  const AdminAuditLog = React.lazy(() => import("./pages/Admin/AuditLog"));
  const AddEditProducts = React.lazy(
    () => import("./pages/Admin/Products/AddEditProduct")
  );
  const OrderDetail = React.lazy(
    () => import("./pages/Admin/Orders/OrderDetail")
  );
  const Orders = React.lazy(() => import("./pages/Orders"));
  const Addresses = React.lazy(() => import("./pages/Addresses"));
  const Compare = React.lazy(() => import("./pages/Compare"));
  const GiftCards = React.lazy(() => import("./pages/GiftCards"));
  const FlashSales = React.lazy(() => import("./pages/FlashSales"));
  const Referral = React.lazy(() => import("./pages/Referral"));
  const Returns = React.lazy(() => import("./pages/Returns"));
  const LoyaltyPoints = React.lazy(() => import("./pages/LoyaltyPoints"));
  const Product = React.lazy(() => import("./pages/Products/Product"));
  const UserOrderDetail = React.lazy(() => import("./pages/Orders/OrderDetail"));

  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Products />} />
            <Route path="products/:productId" element={<Product />} />
            <Route path="login" element={<Login />} />
            <Route path="forgetPassword" element={<ForgetPassword />} />
            <Route path="register" element={<Register />} />
            <Route
              element={
                <RequireAuth allowedRoles={["ROLE_USER"]} roles={data.roles} />
              }
            >
              <Route path="orders" element={<Orders />} />
              <Route path="orderDetail/:orderId" element={<UserOrderDetail />} />
              <Route path="addresses" element={<Addresses />} />
              <Route path="compare" element={<Compare />} />
              <Route path="gift-cards" element={<GiftCards />} />
              <Route path="flash-sales" element={<FlashSales />} />
              <Route path="referral" element={<Referral />} />
              <Route path="returns" element={<Returns />} />
              <Route path="loyalty" element={<LoyaltyPoints />} />
              <Route path="profile/:id" element={<Profile />} />
              <Route path="account" element={<Account />} />
            </Route>
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
          </Route>
            <Route
              element={
                <RequireAuth
                  allowedRoles={["ROLE_MANAGER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}
                  roles={data.roles}
                />
              }
            >
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Home />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orderDetail/:orderId" element={<OrderDetail />} />
                <Route path="returns" element={<AdminReturns />} />
                <Route
                  element={
                    <RequireAuth
                      allowedRoles={["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]}
                      roles={data.roles}
                    />
                  }
                >
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="storefront" element={<AdminStoreSettings />} />
                  <Route path="audit-log" element={<AdminAuditLog />} />
                  <Route
                    path="addEditProduct/:productId?"
                    element={<AddEditProducts />}
                  />
                </Route>
              </Route>
            </Route>
          <Route path="*" element={<NotFound />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
