# File upload security

Gateway image writes now require a bearer token validated against current user
state. Deletion additionally requires Admin/Super Admin. Public image reads are
limited to server-generated UUID names and cannot traverse the storage root.

Uploads are limited to 5 MB and four multipart parts. Declared MIME type is a
pre-filter; after transfer the service verifies JPEG, PNG, or GIF magic bytes,
preserves the correct extension, and deletes invalid temporary files. Original
filenames are never used.

Returned image URLs are relative (`/file/image/<uuid>.<ext>`), so hosted browsers
never receive broken localhost URLs. Docker mounts a named `product-images`
volume at the configured `FILE_STORAGE_PATH`, preserving assets across gateway
rebuilds. Image upload is also rate-limited at the edge.

For multi-host production, replace the local volume with object storage, signed
writes, malware scanning, and CDN delivery.
