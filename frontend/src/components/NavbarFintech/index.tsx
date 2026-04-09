import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppState } from "../../store";
import { logout } from "../../store/actions/userAction";
import { showError } from "../../utils/showError";
import { calculateCountOfCartItems } from "../../utils/cart";
import { setToLocalStorage } from "../../utils/localStorage";
import { cn } from "../../lib/utils";

// Shadcn/UI Components
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";

// Icons
import { ShoppingCart, Menu, X, User, Settings, LogOut, Shield, ChevronDown, Wallet } from "lucide-react";

const INITIAL_SETTINGS = ["Profile", "Account", "Logout"];

interface NavbarFintechProps {
  className?: string;
}

const NavbarFintech = ({ className }: NavbarFintechProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();

  // Redux State - Maintaining your existing state connections
  const { data: user, error } = useSelector((state: AppState) => state.user);
  const carts = useSelector((state: AppState) => state.cart);

  // Local State
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check for admin role
  useEffect(() => {
    if (user?.roles?.includes("ROLE_ADMIN")) {
      setSettings((prev) => (prev.includes("Admin") ? prev : [...prev, "Admin"]));
    }
  }, [user?.roles]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle errors
  useEffect(() => {
    error && showError(error);
  }, [error]);

  const handleMenuAction = (setting: string) => {
    switch (setting) {
      case "Logout":
        dispatch(logout());
        break;
      case "Profile":
        if (user?.userId) {
          navigate(`/profile/${user.userId}`);
        }
        break;
      case "Account":
        navigate("/account");
        break;
      case "Admin":
        setToLocalStorage("admin-nav", 0);
        navigate("/admin");
        break;
    }
  };

  const cartItemCount = calculateCountOfCartItems(carts);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "bg-background/95 backdrop-blur-md shadow-fintech border-b border-border" : "bg-primary",
        className
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  scrolled ? "bg-primary" : "bg-white/10"
                )}
              >
                <Wallet className={cn("h-5 w-5", scrolled ? "text-primary-foreground" : "text-white")} />
              </div>
              <span
                className={cn(
                  "text-xl font-bold tracking-tight",
                  scrolled ? "text-foreground" : "text-white"
                )}
              >
                FinStore
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/cart")}
              className={cn(
                "relative",
                scrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"
              )}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center p-0 text-[10px] bg-electric-500"
                >
                  {cartItemCount}
                </Badge>
              )}
              <span className="sr-only">Shopping cart</span>
            </Button>

            {/* User Section */}
            {user?.isLogedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-2 px-3",
                      scrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageURL ?? ""} alt={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`} />
                      <AvatarFallback className="bg-electric-500 text-white text-xs">
                        {user?.firstName?.at(0)?.toUpperCase()}
                        {user?.lastName?.at(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block font-medium">{user?.firstName}</span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleMenuAction("Profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMenuAction("Account")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Account</span>
                  </DropdownMenuItem>
                  {user?.roles?.includes("ROLE_ADMIN") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleMenuAction("Admin")} className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleMenuAction("Logout")}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant={scrolled ? "ghost" : "ghost"}
                  onClick={() => navigate("/login")}
                  className={cn(
                    scrolled ? "text-foreground" : "text-white hover:bg-white/10"
                  )}
                >
                  Sign In
                </Button>
                <Button
                  variant={scrolled ? "default" : "secondary"}
                  onClick={() => navigate("/register")}
                  className={cn(
                    !scrolled && "bg-white text-primary hover:bg-white/90"
                  )}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/cart")}
              className={cn(
                "relative",
                scrolled ? "text-foreground" : "text-white"
              )}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center p-0 text-[10px] bg-electric-500"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(scrolled ? "text-foreground" : "text-white")}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-background pb-4 pt-2 md:hidden animate-fade-in">
            {user?.isLogedIn ? (
              <div className="space-y-1 px-2">
                <div className="flex items-center gap-3 px-3 py-3 border-b border-border mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profileImageURL ?? ""} alt={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`} />
                    <AvatarFallback className="bg-electric-500 text-white">
                      {user?.firstName?.at(0)?.toUpperCase()}
                      {user?.lastName?.at(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                {settings.map((setting) => (
                  <button
                    key={setting}
                    onClick={() => {
                      handleMenuAction(setting);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors",
                      setting === "Logout"
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {setting === "Profile" && <User className="h-4 w-4" />}
                    {setting === "Account" && <Settings className="h-4 w-4" />}
                    {setting === "Admin" && <Shield className="h-4 w-4" />}
                    {setting === "Logout" && <LogOut className="h-4 w-4" />}
                    {setting}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2 px-4 pt-2">
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => {
                    navigate("/login");
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full justify-center"
                  onClick={() => {
                    navigate("/register");
                    setMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default NavbarFintech;
