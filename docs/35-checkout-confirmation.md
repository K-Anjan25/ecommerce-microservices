# Checkout confirmation experience

Successful checkout no longer drops customers back on the storefront without an order reference.

## Behavior

- Fully gift-card-funded orders go directly to confirmation without invoking a provider.
- Cash-on-delivery confirmation clearly labels the amount as due on delivery.
- Settled provider payments show a confirmed state.
- Initiated but unsettled online payments show a pending state and explicitly state that Cartly is waiting for a signed provider callback.
- Signed-in customers can open the persisted order detail.
- Guests receive a copyable order reference and a reminder to retain it.

## Capability handling

The confirmation route receives a minimal display snapshot through React Router navigation state. Guest checkout capabilities and checkout tokens are not placed in the URL, local storage, session storage, or page markup. Refreshing or directly opening the route therefore shows a safe expired-confirmation state rather than attempting an unauthenticated order lookup.

The confirmation route uses the enclosed checkout shell: no promotional navigation, footer, or mobile shop tabs appear after the order decision.
