#!/usr/bin/env node

/**
 * Cartly — Payment Webhook Simulator
 *
 * Simulates provider-confirmed payment webhooks (Razorpay / Stripe)
 * with cryptographically valid HMAC-SHA256 signatures.
 *
 * Usage:
 *   node tools/simulate-payment-webhook.mjs --order-id <order-id> --amount 1499
 *   node tools/simulate-payment-webhook.mjs --provider razorpay --event payment.captured --order-id ord-1000 --amount 1499
 *   node tools/simulate-payment-webhook.mjs --provider razorpay --event payment.failed --order-id ord-1000 --amount 1499
 */

import { createHmac } from "node:crypto";
import http from "node:http";
import https from "node:https";

const args = process.argv.slice(2);
function getArg(flag, fallback = "") {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}

const provider = (getArg("--provider", "razorpay")).toLowerCase();
const eventType = getArg("--event", provider === "stripe" ? "payment_intent.succeeded" : "payment.captured");
const orderId = getArg("--order-id", getArg("--order", "ord-1000-a4f2c9d1"));
const amountRupees = Number(getArg("--amount", "1499"));
const currency = (getArg("--currency", "INR")).toUpperCase();
const secret = getArg("--secret", process.env.RAZORPAY_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "cartly_test_webhook_secret");
const targetUrl = getArg("--url", process.env.WEBHOOK_URL || (provider === "stripe" ? "http://localhost:8889/v1/payments/webhooks/stripe" : "http://localhost:8889/v1/payments/webhooks/razorpay"));

const amountPaise = Math.round(amountRupees * 100);

let payloadObj = {};
let signatureHeaderName = "";
let signatureHeaderValue = "";

if (provider === "razorpay") {
  const paymentId = `pay_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
  payloadObj = {
    entity: "event",
    account_id: "acc_cartly_test",
    event: eventType,
    contains: ["payment"],
    payload: {
      payment: {
        entity: {
          id: paymentId,
          entity: "payment",
          amount: amountPaise,
          currency: currency,
          status: eventType === "payment.captured" ? "captured" : "failed",
          order_id: orderId,
          method: "upi",
          captured: eventType === "payment.captured",
          description: `Order ${orderId}`,
          error_code: eventType === "payment.failed" ? "BAD_REQUEST_ERROR" : null,
          error_description: eventType === "payment.failed" ? "Payment authentication failed" : null,
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };

  const payloadString = JSON.stringify(payloadObj);
  const hmac = createHmac("sha256", secret).update(payloadString).digest("hex");
  signatureHeaderName = "X-Razorpay-Signature";
  signatureHeaderValue = hmac;
} else {
  // Stripe simulation
  const intentId = `pi_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = Math.floor(Date.now() / 1000);
  payloadObj = {
    id: `evt_${Date.now()}`,
    object: "event",
    type: eventType,
    created: timestamp,
    data: {
      object: {
        id: orderId.startsWith("pi_") ? orderId : intentId,
        object: "payment_intent",
        amount: amountPaise,
        amount_received: eventType === "payment_intent.succeeded" ? amountPaise : 0,
        currency: currency.toLowerCase(),
        status: eventType === "payment_intent.succeeded" ? "succeeded" : "requires_payment_method",
        last_payment_error: eventType.includes("failed") ? { message: "Card was declined" } : null,
      },
    },
  };

  const payloadString = JSON.stringify(payloadObj);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payloadString}`).digest("hex");
  signatureHeaderName = "Stripe-Signature";
  signatureHeaderValue = `t=${timestamp},v1=${signature}`;
}

const payloadBody = JSON.stringify(payloadObj, null, 2);

console.log("══════════════════════════════════════════════════════════════");
console.log(`Cartly Payment Webhook Simulator`);
console.log("══════════════════════════════════════════════════════════════");
console.log(`• Provider:       ${provider.toUpperCase()}`);
console.log(`• Event:          ${eventType}`);
console.log(`• Order ID:       ${orderId}`);
console.log(`• Amount:         ₹${amountRupees} (${amountPaise} in minor units)`);
console.log(`• Currency:       ${currency}`);
console.log(`• Target URL:     ${targetUrl}`);
console.log(`• Signature Hdr:  ${signatureHeaderName}: ${signatureHeaderValue.substring(0, 24)}...`);
console.log("──────────────────────────────────────────────────────────────");

const parsed = new URL(targetUrl);
const isHttps = parsed.protocol === "https:";
const transport = isHttps ? https : http;

const req = transport.request(
  {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payloadBody),
      [signatureHeaderName]: signatureHeaderValue,
    },
  },
  (res) => {
    let resBody = "";
    res.on("data", (c) => { resBody += c; });
    res.on("end", () => {
      console.log(`\nResponse Status: ${res.statusCode} ${res.statusMessage}`);
      try {
        console.log("Response Body:", JSON.stringify(JSON.parse(resBody), null, 2));
      } catch {
        console.log("Response Body:", resBody || "(empty response)");
      }
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log("\n✓ Webhook dispatched and processed successfully!");
      } else {
        console.log("\n✗ Server returned an error status code.");
      }
    });
  }
);

req.on("error", (err) => {
  console.error("\n✗ Connection failed:", err.message);
  console.log("Ensure the target server (commerce-service or preview mock server) is running.");
});

req.write(payloadBody);
req.end();
