# Identity security hardening

## Profile ownership and privilege boundaries

`PUT /user/update` now derives the account email from the verified JWT. The
request's email is display data only and cannot select another account. Customer
profile DTOs contain only first name, last name, email, and profile-image URL.
They cannot set role, authorities, active, or lock flags.

Role changes remain isolated behind the Admin/Super Admin staff-role endpoint,
which itself only permits `ROLE_USER` ↔ `ROLE_MANAGER`.

## Protected identity operations

- User credential lookup: Manager/Admin/Super Admin only (needed by order ops).
- User lookup by email: Admin/Super Admin only.
- User deletion: Admin/Super Admin only.
- Legacy multipart profile-image mutation: Admin/Super Admin only; customer
  image updates use the owned file/profile flow.

## JWT filter termination

Invalid or missing tokens previously wrote a 403 response and then continued the
filter chain. The filter now returns immediately, so protected controllers can
never run after failed JWT verification.

## Reset privacy

Password reset now returns the same generic response whether or not an account
exists, preventing email enumeration. Generated passwords are no longer written
to logs, and reset email branding is Cartly-specific.

The temporary-password mechanism has now been removed. Reset requests create a
cryptographically random 256-bit token, store only its SHA-256 hash, expire it
after 30 minutes, invalidate older tokens for the account, and mark it used
atomically after password selection. The raw token exists only in the emailed
one-time link and is never logged or stored.
