import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import { createSupportTicket, SUPPORT_TOPICS, SupportTicket } from "../../api/supportApi";
import { useStoreSettings } from "../../features/storefront";
import usePageMetadata from "../../hooks/usePageMetadata";

const FIELD_CLASS =
  "input-control";

/** Contact support: raises a real ticket via POST /v1/support/tickets. */
function Contact() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useStoreSettings();

  const preselectedTopic = useMemo(() => {
    const state = location.state as { topic?: string } | null;
    const param = new URLSearchParams(location.search).get("topic");
    const candidate = param || state?.topic || "";
    return (SUPPORT_TOPICS as readonly string[]).includes(candidate) ? candidate : "";
  }, [location]);

  /** Deep-link from the Help center 👎 votes: prefill what they were looking for. */
  const prefilledMessage = useMemo(() => {
    const about = new URLSearchParams(location.search).get("about");
    return about
      ? `I was looking for “${about}” in the Help center but didn't find the answer I needed.\n\n`
      : "";
  }, [location]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(preselectedTopic);
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState(prefilledMessage);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [copied, setCopied] = useState(false);

  usePageMetadata({
    title: "Contact support — Cartly",
    description: "Raise a support ticket about an order, return, payment or your account — replies go to your email.",
    canonicalPath: "/contact",
  });

  const supportEmail = settings.supportEmail || "support@cartly.com";

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = "Enter a valid email address";
    if (!topic) next.topic = "Choose a topic";
    if (message.trim().length < 20) next.message = "Please describe the issue in at least 20 characters";
    if (message.length > 4000) next.message = "Message must be 4000 characters or fewer";
    return next;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    const clientErrors = validate();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      const created = await createSupportTicket({
        name: name.trim(),
        email: email.trim(),
        topic,
        orderNumber: orderNumber.trim() || undefined,
        message: message.trim(),
      });
      setTicket(created);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      const data = error?.response?.data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setErrors(data as Record<string, string>);
        setSubmitError("Please fix the highlighted fields and try again.");
      } else {
        setSubmitError(
          (typeof data === "string" && data) ||
            "We couldn't submit your ticket right now. Please try again, or email us directly."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyRef = async () => {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket.ticketRef);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  const fieldError = (field: string) =>
    errors[field] ? (
      <p className="mt-1 text-xs font-semibold text-state-danger" role="alert">
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-10">
      {/* Header */}
      <header>
        <p className="eyebrow !text-accent">Contact support</p>
        <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-ink sm:text-4xl">
          We're here to help.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
          Raise a ticket and our team replies to your email — usually within one
          business day. Include your order number and we can dig in faster.
        </p>
      </header>

      {ticket ? (
        /* ── Success state ─────────────────────────────────────────── */
        <section className="rounded-2xl border border-state-success/30 bg-state-success-soft p-7 shadow-sm sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-state-success text-white">
            <MarkEmailReadOutlinedIcon />
          </span>
          <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-ink">
            Ticket raised — we're on it.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            We've registered your request and sent a confirmation to{" "}
            <strong className="text-ink">{ticket.email}</strong>. Quote your
            reference any time:
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <code className="rounded-lg border border-line bg-paper px-4 py-2 font-mono text-sm font-bold text-ink">
              {ticket.ticketRef}
            </code>
            <button
              onClick={copyRef}
              className="secondary-button !px-4 !py-2 text-xs"
            >
              <ContentCopyOutlinedIcon sx={{ fontSize: 15 }} />
              {copied ? "Copied!" : "Copy reference"}
            </button>
          </div>
          <dl className="mt-6 grid max-w-xl gap-4 border-t border-state-success/20 pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Topic</dt>
              <dd className="mt-0.5 font-semibold text-ink">{ticket.topic}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Status</dt>
              <dd className="mt-0.5 font-semibold text-ink">{ticket.status}</dd>
            </div>
            {ticket.orderNumber && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Order</dt>
                <dd className="mt-0.5 font-mono text-xs font-semibold text-ink">{ticket.orderNumber}</dd>
              </div>
            )}
          </dl>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => navigate("/help")} className="primary-button">
              Browse the help center
            </button>
            <button
              onClick={() => {
                setTicket(null);
                setMessage("");
                setOrderNumber("");
              }}
              className="secondary-button"
            >
              Raise another ticket
            </button>
          </div>
        </section>
      ) : (
        /* ── Form + sidebar ────────────────────────────────────────── */
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-2xl border border-line bg-paper p-7 shadow-sm sm:p-9">
            {submitError && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-state-danger/30 bg-state-danger-soft p-4" role="alert">
                <ErrorOutlineOutlinedIcon className="mt-0.5 text-state-danger" />
                <p className="text-sm font-semibold text-state-danger-on">{submitError}</p>
              </div>
            )}

            <form onSubmit={submit} noValidate className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="muted-label mb-1.5 block">
                    Full name <span className="text-state-danger">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    maxLength={120}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className={FIELD_CLASS}
                  />
                  {fieldError("name")}
                </div>
                <div>
                  <label htmlFor="contact-email" className="muted-label mb-1.5 block">
                    Email <span className="text-state-danger">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    maxLength={180}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={FIELD_CLASS}
                  />
                  {fieldError("email")}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-topic" className="muted-label mb-1.5 block">
                    Topic <span className="text-state-danger">*</span>
                  </label>
                  <select
                    id="contact-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="">Choose a topic…</option>
                    {SUPPORT_TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {fieldError("topic")}
                </div>
                <div>
                  <label htmlFor="contact-order" className="muted-label mb-1.5 block">
                    Order number <span className="text-ink-muted">(optional)</span>
                  </label>
                  <input
                    id="contact-order"
                    type="text"
                    value={orderNumber}
                    maxLength={64}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="From your confirmation email"
                    className={FIELD_CLASS}
                  />
                  {fieldError("orderNumber")}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="contact-message" className="muted-label">
                    How can we help? <span className="text-state-danger">*</span>
                  </label>
                  <span className="text-xs text-ink-muted">{message.length}/4000</span>
                </div>
                <textarea
                  id="contact-message"
                  value={message}
                  maxLength={4000}
                  rows={6}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what happened, including any error you saw…"
                  className={`${FIELD_CLASS} h-auto py-3`}
                />
                {fieldError("message")}
              </div>

              <div className="flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-xs leading-relaxed text-ink-muted">
                  By submitting you agree to our{" "}
                  <Link to="/terms" className="font-semibold text-brand hover:underline">
                    Terms
                  </Link>{" "}
                  and to us contacting you about this ticket.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="primary-button min-w-[11rem] disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send ticket"}
                </button>
              </div>
            </form>
          </section>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
              <h2 className="font-heading text-base font-extrabold tracking-tight text-ink">
                What happens next
              </h2>
              <ol className="mt-4 space-y-4">
                {[
                  "You get a confirmation email with your ticket reference.",
                  "Our team reviews it and replies to this email address — usually within one business day.",
                  "Quote your reference in any follow-up so we can pull up the full history.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-ink-soft">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[0.6875rem] font-black text-white">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
              <h2 className="font-heading text-base font-extrabold tracking-tight text-ink">
                Self-serve, no ticket needed
              </h2>
              <div className="mt-4 space-y-2">
                {[
                  { icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 17 }} />, label: "Track an order", to: "/orders", auth: true },
                  { icon: <ReplayOutlinedIcon sx={{ fontSize: 17 }} />, label: "Start a return", to: "/returns", auth: true },
                  { icon: <MenuBookOutlinedIcon sx={{ fontSize: 17 }} />, label: "Help center & FAQs", to: "/help" },
                  { icon: <GavelOutlinedIcon sx={{ fontSize: 17 }} />, label: "Terms of Service", to: "/terms" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() =>
                      navigate(item.auth && !localStorage.getItem("access-token") ? "/login" : item.to)
                    }
                    className="flex w-full items-center gap-3 rounded-xl border border-line px-4 py-2.5 text-left text-sm font-semibold text-ink transition hover:border-brand hover:bg-brand-soft hover:text-brand"
                  >
                    <span className="text-brand">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
              <h2 className="font-heading text-base font-extrabold tracking-tight text-ink">
                Prefer email?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Write to{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="font-semibold text-brand underline underline-offset-2"
                >
                  {supportEmail}
                </a>{" "}
                from the address on your order and we'll take it from there.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Contact;
