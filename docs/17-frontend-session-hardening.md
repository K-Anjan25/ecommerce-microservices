# Frontend session and API hardening

The shared Axios transport now enforces the following boundaries:

- Absolute request URLs are disabled; feature APIs cannot accidentally send the
  bearer token to an arbitrary origin.
- Browser cookies are not attached (`withCredentials: false`); Cartly uses an
  explicit bearer token.
- API timeout remains 30 seconds; refresh timeout is 15 seconds.
- Login and refresh failures never recursively trigger token refresh.
- Concurrent 401 responses share one refresh promise instead of creating a
  refresh-token stampede.
- Every waiting request retries with the same new access token.
- Failed refresh clears both tokens and redirects once to login.

Access and refresh tokens remain in local storage for compatibility with the
existing architecture. A future higher-assurance deployment should move the
refresh token to a Secure, HttpOnly, SameSite cookie and keep only a short-lived
access token in memory; that requires coordinated user-service and CSRF changes.
