import { useNavigate } from "react-router-dom";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import { BRAND } from "../../brand";
import usePageMetadata from "../../hooks/usePageMetadata";

const PROMISES = [
  {
    icon: <LocalShippingOutlinedIcon sx={{ fontSize: 22 }} />,
    title: "Fast, tracked delivery",
    copy: "Free shipping over ₹999 and live tracking on every order, panel to door.",
  },
  {
    icon: <VerifiedUserOutlinedIcon sx={{ fontSize: 22 }} />,
    title: "Quality you can verify",
    copy: "Every listing is checked against our catalog standards before it goes live.",
  },
  {
    icon: <ReplayOutlinedIcon sx={{ fontSize: 22 }} />,
    title: "Hassle-free returns",
    copy: "Changed your mind? Start a return in a couple of clicks from your account.",
  },
  {
    icon: <SupportAgentOutlinedIcon sx={{ fontSize: 22 }} />,
    title: "Real human support",
    copy: "Questions before or after checkout — our team answers, not a bot maze.",
  },
];

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home",
  "Beauty",
  "Kitchen",
  "Sports",
  "Grocery",
  "Toys & Games",
];

/** Concept B "About Us" — bold, direct, and grounded in the marketplace promise. */
function About() {
  const navigate = useNavigate();

  usePageMetadata({
    title: "About Cartly — One modern multi-category marketplace",
    description: BRAND.promise,
    canonicalPath: "/about",
  });

  return (
    <div className="space-y-8 pb-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-line bg-contrast p-6 text-oncontrast shadow-sm sm:p-10">
        <p className="eyebrow !text-accent">About us</p>
        <h1 className="mt-3 max-w-3xl font-heading text-3xl font-black tracking-tight sm:text-5xl sm:leading-[1.05]">
          One modern marketplace for everything on your list.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-oncontrast/75 sm:text-base">
          {BRAND.promise} Cartly brings independent brands and everyday essentials
          together in one fast, secure checkout — so you spend less time searching
          and more time living with what you love.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Start shopping
          </button>
          <button
            onClick={() => navigate("/flash-sales")}
            className="rounded-full border border-oncontrast/30 px-6 py-2.5 text-sm font-bold text-oncontrast transition hover:border-oncontrast/60"
          >
            See today&apos;s deals
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { value: "8+", label: "Categories" },
          { value: "40%", label: "Flash sale savings" },
          { value: "24h", label: "Dispatch target" },
          { value: "4.6★", label: "Average rating" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-paper p-5 shadow-sm"
          >
            <p className="font-heading text-2xl font-black tracking-tight text-brand sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-ink-soft">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Promises */}
      <section>
        <h2 className="font-heading text-xl font-black tracking-tight text-ink sm:text-2xl">
          What you can count on
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-line bg-paper p-5 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                {item.icon}
              </span>
              <p className="mt-3 text-sm font-bold text-ink">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category shortcuts */}
      <section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
        <h2 className="font-heading text-lg font-bold text-ink">Shop by category</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((name) => (
            <button
              key={name}
              onClick={() => navigate({ pathname: "/", search: `?category=${encodeURIComponent(name)}` })}
              className="chip"
            >
              {name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default About;
