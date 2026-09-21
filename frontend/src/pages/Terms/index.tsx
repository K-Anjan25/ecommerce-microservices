import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStoreSettings } from "../../features/storefront";
import usePageMetadata from "../../hooks/usePageMetadata";

const LAST_UPDATED = "21 September 2026";

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line pt-7 first:border-t-0 first:pt-0">
      <h2 className="flex items-baseline gap-3 font-heading text-lg font-extrabold tracking-tight text-ink sm:text-xl">
        <span className="text-brand">{String(number).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft [&_strong]:text-ink [&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}

/** Terms of Service — the operative agreement for shopping on the platform. */
function Terms() {
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const supportEmail = settings.supportEmail || "support@cartly.com";

  usePageMetadata({
    title: "Terms of Service — Cartly",
    description: "The terms that govern orders, payments, delivery, returns, gift cards and rewards on Cartly.",
    canonicalPath: "/terms",
  });

  const TOC: { id: string; label: string }[] = [
    { id: "about", label: "About these terms" },
    { id: "accounts", label: "Accounts & eligibility" },
    { id: "orders", label: "Orders & acceptance" },
    { id: "pricing", label: "Pricing, taxes & payment" },
    { id: "delivery", label: "Delivery" },
    { id: "returns", label: "Returns & refunds" },
    { id: "giftcards", label: "Gift cards" },
    { id: "rewards", label: "Loyalty & referrals" },
    { id: "sales", label: "Flash sales & pricing errors" },
    { id: "use", label: "Acceptable use" },
    { id: "ip", label: "Intellectual property" },
    { id: "liability", label: "Disclaimers & liability" },
    { id: "changes", label: "Changes to these terms" },
    { id: "law", label: "Governing law & disputes" },
    { id: "contact", label: "Contacting us" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Header */}
      <header className="rounded-2xl border border-line bg-paper p-7 shadow-sm sm:p-10">
        <p className="eyebrow !text-accent">Legal</p>
        <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-ink sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft sm:text-base">
          These terms are the agreement between you and Cartly when you browse,
          order, pay, return or otherwise use the platform. They exist so both
          sides know exactly where they stand — written to be read, not buried.
        </p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Last updated: {LAST_UPDATED}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        {/* TOC */}
        <aside className="hidden lg:block">
          <nav className="sticky top-28 rounded-2xl border border-line bg-paper p-5 shadow-sm" aria-label="Terms contents">
            <p className="eyebrow mb-3">Contents</p>
            <ol className="space-y-1.5">
              {TOC.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-baseline gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-ink-soft transition hover:bg-brand-soft hover:text-brand"
                  >
                    <span className="text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* Document */}
        <article className="space-y-7 rounded-2xl border border-line bg-paper p-7 shadow-sm sm:p-10">
          <Section id="about" number={1} title="About these terms">
            <p>
              Cartly ("Cartly", "we", "us") operates a multi-category e-commerce
              marketplace at this website (the "platform"). Merchants list
              products on the platform; we provide the storefront, checkout,
              payment orchestration, order management, delivery coordination and
              support.
            </p>
            <p>
              By using the platform — including by placing an order — you agree
              to these Terms. If you do not agree, please don't use the
              platform. References to "we", "us" and "our" include the platform
              services that calculate prices, taxes, shipping and refunds on our
              behalf.
            </p>
          </Section>

          <Section id="accounts" number={2} title="Accounts & eligibility">
            <p>
              You can browse and even check out as a guest, but some features —
              order history, returns, wishlists, loyalty points and referrals —
              require an account. To create one you must be at least 18 years
              old and legally able to enter into contracts in India.
            </p>
            <p>
              You're responsible for the accuracy of the details you provide,
              for keeping your password confidential, and for activity under
              your account. Tell us immediately (via{" "}
              <Link to="/contact">Contact support</Link>) if you suspect
              unauthorized use. We may suspend accounts used for fraud, abuse or
              a material breach of these terms.
            </p>
          </Section>

          <Section id="orders" number={3} title="Orders & acceptance">
            <p>
              Placing an order is an offer to buy. The contract forms when we
              accept it — which happens when your order confirmation is issued.
              Until then we may decline an order (for example, for stock,
              delivery-area or fraud-screening reasons) and reverse any
              authorization.
            </p>
            <p>
              You may cancel an unpaid or not-yet-dispatched order from your
              order page (or, for guest orders, from the link in your
              confirmation email). Once dispatch has begun, use the returns
              process instead.
            </p>
          </Section>

          <Section id="pricing" number={4} title="Pricing, taxes & payment">
            <p>
              All prices are in Indian Rupees. The amounts you see at checkout —
              including GST, shipping, discounts and any gift-card application —
              are calculated by our servers, and those are the amounts that
              apply. Product pages are not an offer at a stale price; the
              checkout price governs.
            </p>
            <p>
              We accept cards (Visa, Mastercard, Discover) and UPI/netbanking
              through our payment providers (Razorpay, Stripe). Initiating a
              payment authorizes the amount but is <strong>not</strong> a
              receipt: an order is treated as paid only after the provider
              returns a cryptographically verified settlement result to us. If
              settlement fails or times out, the order remains unpaid, doesn't
              ship, and any authorization is released by your bank according to
              its policies.
            </p>
          </Section>

          <Section id="delivery" number={5} title="Delivery">
            <p>
              In-stock items are targeted for dispatch within 24 hours of
              payment confirmation. Delivery typically takes 2–7 business days
              depending on your pin code; the estimate shown at checkout is our
              good-faith projection, not a guarantee.
            </p>
            <p>
              Standard shipping is free above the threshold shown at checkout;
              below it, shipping is priced by our rate engine for your address.
              Risk of loss passes on delivery to the address you provide — so
              please make sure saved addresses are accurate and current.
            </p>
          </Section>

          <Section id="returns" number={6} title="Returns & refunds">
            <p>
              You can request a return within <strong>7 days of delivery</strong>{" "}
              from your Orders page, choosing a reason. Items must be in their
              original condition with tags and packaging. Some hygiene- or
              safety-sensitive categories may be excluded and are marked on the
              product page.
            </p>
            <p>
              Once a return is approved and received, we refund it. Where an
              order was paid with a gift card and another method, the gift-card
              value is refunded to the gift card <strong>first</strong>, and
              only the remainder goes to the original payment method. Card
              refunds are initiated to the same instrument; your bank typically
              posts them within 5–7 business days of our initiation.
            </p>
          </Section>

          <Section id="giftcards" number={7} title="Gift cards">
            <p>
              Gift cards are redeemable at checkout for eligible products. At
              payment, gift-card value is applied <strong>after</strong> tax,
              and only any remaining balance is charged to your payment
              provider.
            </p>
            <p>
              Gift cards can't be exchanged for cash, reloaded, or transferred
              for value, and we can't replace codes lost because they were
              shared. Purchase of new gift cards is enabled only once
              provider-backed issuance is live; previously issued cards remain
              fully redeemable.
            </p>
          </Section>

          <Section id="rewards" number={8} title="Loyalty points & referrals">
            <p>
              Loyalty points are earned on qualifying orders and can be redeemed
              at checkout per the rules shown at the time. Referral rewards are
              granted when a new customer places their first qualifying order
              with your code. Points and rewards have no cash value, can't be
              sold or transferred, and may be adjusted or reversed for returns,
              cancellations, or abuse (including self-referral rings).
            </p>
            <p>
              We may change reward rates or end a program with reasonable
              notice; earned, unredeemed points will be honored for a
              reasonable redemption window afterwards.
            </p>
          </Section>

          <Section id="sales" number={9} title="Flash sales & pricing errors">
            <p>
              Flash-sale prices are time-boxed and stock-limited, enforced
              server-side. If a price is obviously erroneous (for example, a
              ₹12,999 phone listed at ₹129), we may decline or cancel the
              affected order and refund any captured amount — we won't demand
              you pay the difference.
            </p>
          </Section>

          <Section id="use" number={10} title="Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>misrepresent your identity or payment details, or attempt fraud of any kind;</li>
              <li>scrape, reverse-engineer, overload or interfere with the platform or its APIs;</li>
              <li>resell products obtained through abused promotions, staff sales or error pricing;</li>
              <li>upload unlawful, infringing or malicious content in reviews or ticket messages;</li>
              <li>circumvent security controls, rate limits or the payment flow.</li>
            </ul>
            <p>We may remove content and suspend access for violations.</p>
          </Section>

          <Section id="ip" number={11} title="Intellectual property">
            <p>
              The platform — its software, design, wordmark and content — is
              owned by Cartly or its licensors. Product listings, descriptions
              and imagery remain the property of the merchants who supplied
              them. You get a limited, revocable right to use the platform for
              personal, non-commercial shopping; nothing else is transferred.
            </p>
          </Section>

          <Section id="liability" number={12} title="Disclaimers & liability">
            <p>
              The platform is provided on an "as is" and "as available" basis.
              To the fullest extent permitted by law, we disclaim implied
              warranties of merchantability and fitness for a particular
              purpose. We don't warrant uninterrupted or error-free service.
            </p>
            <p>
              To the fullest extent permitted by law, Cartly's total liability
              arising from or in connection with an order is limited to the
              amount you paid for that order (including its taxes and
              shipping). We're not liable for indirect or consequential losses.
              Nothing in these terms limits liability that can't be limited by
              law, including for fraud.
            </p>
          </Section>

          <Section id="changes" number={13} title="Changes to these terms">
            <p>
              We may update these terms as the platform evolves. The "last
              updated" date above always reflects the current version, and
              material changes will be highlighted on the platform before they
              take effect. Continuing to use the platform after changes take
              effect means you accept the updated terms; orders already
              accepted stay governed by the version in force when they were
              accepted.
            </p>
          </Section>

          <Section id="law" number={14} title="Governing law & disputes">
            <p>
              These terms are governed by the laws of India. The courts of
              Hyderabad, Telangana have exclusive jurisdiction over disputes,
              except where consumer-protection law gives you a different forum
              — nothing here takes away rights granted to you by mandatory
              Indian consumer law.
            </p>
            <p>
              Most problems are solvable in one email: raise a ticket first and
              we'll work it with you before it becomes a dispute.
            </p>
          </Section>

          <Section id="contact" number={15} title="Contacting us">
            <p>
              Questions about these terms, an order, a return or a ticket: use{" "}
              <Link to="/contact">Contact support</Link> or email{" "}
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. Operational
              answers live in the <Link to="/help">Help center</Link>, and a
              summary of what each platform service covers is on{" "}
              <Link to="/services">Services</Link>.
            </p>
          </Section>
        </article>
      </div>
    </div>
  );
}

export default Terms;
