import { useEffect, useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import DashboardIcon from "@mui/icons-material/Dashboard";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { AppState } from "../../store";
import { logout } from "../../store/actions/userAction";
import { calculateCountOfCartItems } from "../../utils/cart";
import { setToLocalStorage } from "../../utils/localStorage";
import { showError } from "../../utils/showError";

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: -2,
    top: 6,
    color: "#FFFFFF",
    backgroundColor: theme.palette.secondary.main,
    fontWeight: 700,
  },
}));

const navLink = (active: boolean) =>
  `cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
    active ? "bg-paper/15 text-amber-50" : "text-paper/80 hover:bg-paper/10 hover:text-paper"
  }`;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<any>();
  const { data: user, error } = useSelector((state: AppState) => state.user);
  const carts = useSelector((state: AppState) => state.cart);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  useEffect(() => {
    error && showError(error);
  }, [error]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const go = (path: string) => {
    setDrawerOpen(false);
    setAnchorElUser(null);
    navigate(path);
  };

  const submitNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = navSearch.trim();
    if (!term) return;
    // Products page seeds its search from this navigation state.
    navigate("/", { state: { search: term } });
    setNavSearch("");
  };

  const handleCloseUserMenu = (setting: string) => {
    switch (setting) {
      case "Logout":
        dispatch(logout());
        break;
      case "Profile":
        navigate(`/profile/${user.userId}`);
        break;
      case "Account":
        navigate("/account");
        break;
      case "Admin":
        setToLocalStorage("admin-nav", 0);
        navigate("/admin");
        break;
    }
    setAnchorElUser(null);
  };

  const isActive = (path: string) =>
    location.pathname.startsWith(path) &&
    (path !== "/" || location.pathname === "/");

  return (
    <AppBar
      position="sticky"
      className="bg-brand text-paper shadow-sm"
      elevation={0}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters className="gap-2">
          <IconButton
            size="large"
            edge="start"
            aria-label="menu"
            className="text-paper md:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>

          <Box
            className="flex cursor-pointer items-center gap-2"
            onClick={() => navigate("/")}
          >
            <ShoppingBagIcon className="text-accent" />
            <Typography
              variant="h6"
              noWrap
              className="font-mono font-bold tracking-[0.25em]"
            >
              CARTLY
            </Typography>
          </Box>

          <Box className="ml-6 hidden items-center gap-1 md:flex">
            <span className={navLink(isActive("/"))} onClick={() => navigate("/")}>
              Shop
            </span>
            <span
              className={navLink(isActive("/gift-cards"))}
              onClick={() => navigate("/gift-cards")}
            >
              Gift Cards
            </span>
            <span
              className={navLink(isActive("/flash-sales"))}
              onClick={() => navigate("/flash-sales")}
            >
              Flash Sales
            </span>
            <span
              className={navLink(isActive("/referral"))}
              onClick={() => navigate("/referral")}
            >
              Referral
            </span>
            <span
              className={navLink(isActive("/returns"))}
              onClick={() => navigate("/returns")}
            >
              Returns
            </span>
            <span
              className={navLink(isActive("/loyalty"))}
              onClick={() => navigate("/loyalty")}
            >
              Loyalty
            </span>
            {user.isLogedIn && (
              <span
                className={navLink(isActive("/cart"))}
                onClick={() => navigate("/cart")}
              >
                Cart
              </span>
            )}
            {user.isLogedIn && isAdmin && (
              <span
                className={navLink(isActive("/admin"))}
                onClick={() => {
                  setToLocalStorage("admin-nav", 0);
                  navigate("/admin");
                }}
              >
                Dashboard
              </span>
            )}
          </Box>

          <Box className="flex-1" />

          <Box
            component="form"
            onSubmit={submitNavSearch}
            className="relative mr-1 hidden w-56 items-center lg:flex xl:w-72"
          >
            <SearchIcon className="pointer-events-none absolute left-3 text-paper/60" fontSize="small" />
            <input
              type="search"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="h-9 w-full rounded-full border border-paper/25 bg-paper/10 pl-9 pr-3 text-sm text-paper placeholder:text-paper/60 outline-none transition focus:border-paper/60 focus:bg-paper/20"
            />
          </Box>

          <IconButton
            aria-label="cart"
            onClick={() => navigate("/cart")}
            className="text-paper"
          >
            <StyledBadge badgeContent={calculateCountOfCartItems(carts)}>
              <ShoppingCartIcon />
            </StyledBadge>
          </IconButton>

          {user.isLogedIn ? (
            <Box className="ml-1">
              <IconButton
                onClick={(event) => setAnchorElUser(event.currentTarget)}
              >
                <Avatar
                  alt={(user.firstName ?? "") + (user.lastName ?? "")}
                  src={user.profileImageURL ?? ""}
                  className="bg-brand-light text-paper"
                >
                  {(user.firstName?.at(0)?.toUpperCase() ?? "") +
                    (user.lastName?.at(0)?.toUpperCase() ?? "")}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorElUser}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                open={Boolean(anchorElUser)}
                onClose={() => setAnchorElUser(null)}
              >
                <MenuItem onClick={() => handleCloseUserMenu("Profile")}>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => handleCloseUserMenu("Account")}>
                  Account
                </MenuItem>
                {isAdmin && (
                  <MenuItem onClick={() => handleCloseUserMenu("Admin")}>
                    Admin
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={() => handleCloseUserMenu("Logout")}>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box className="ml-1 hidden gap-2 sm:flex">
              <Button
                variant="outlined"
                className="border-paper/40 text-paper hover:border-paper hover:bg-paper/10"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button
                variant="contained"
                className="bg-accent text-ink hover:bg-accent-dark"
                onClick={() => navigate("/register")}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box className="flex h-full w-64 flex-col bg-paper">
          <Box className="flex items-center gap-2 px-6 py-5">
            <ShoppingBagIcon className="text-brand" />
            <Typography variant="h6" className="font-mono font-bold tracking-[0.2em]">
              CARTLY
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go("/")}>
                <ListItemText primary="Shop" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go("/gift-cards")}>
                <ListItemText primary="Gift Cards" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go("/flash-sales")}>
                <ListItemText primary="Flash Sales" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go("/referral")}>
                <ListItemText primary="Referral" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go("/returns")}>
                <ListItemText primary="Returns" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go("/loyalty")}>
                <ListItemText primary="Loyalty" />
              </ListItemButton>
            </ListItem>
            {user.isLogedIn && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => go("/cart")}>
                  <ListItemText primary="Cart" />
                </ListItemButton>
              </ListItem>
            )}
            {user.isLogedIn && isAdmin && (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    setToLocalStorage("admin-nav", 0);
                    go("/admin");
                  }}
                >
                  <DashboardIcon sx={{ mr: 1.5 }} />
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
          <Divider />
          <Box className="mt-auto space-y-2 px-6 py-5">
            {user.isLogedIn ? (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  className="border-ink/20 text-ink hover:border-brand hover:bg-brand-tint hover:text-brand"
                  onClick={() => go(`/profile/${user.userId}`)}
                >
                  Profile
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  className="bg-brand text-paper"
                  onClick={() => dispatch(logout())}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  className="border-ink/20 text-ink hover:border-brand hover:bg-brand-tint hover:text-brand"
                  onClick={() => go("/login")}
                >
                  Login
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  className="bg-brand text-paper"
                  onClick={() => go("/register")}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
