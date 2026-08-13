# Batch 3 Client Private-Media Evidence

## Implemented client-only scope

- Added a process-local, bucket-qualified signed-URL resolver for the confirmed private mobile buckets: `chat-images`, `maintenance-images`, and `application-documents`.
- Cache entries retain only `{ signedUrl, expiresAt }`, use the existing one-hour server signing duration and an exact 55-minute local expiry, batch only unique cache misses, and are cleared through the existing query-cache sign-out path and on auth-user changes.
- Migrated chat attachments/thumbnails, tenant maintenance images, application documents, and landlord maintenance images without changing their stored paths or component-facing data shapes.
- Added chat-only visible-media refresh after 45 minutes and a one-time image/thumbnail load-error re-sign attempt. The current compatible surface is `expo-image`; no retry loop or video-player API change was introduced.

## Deferred C5: apartment-image contract

`apartment-images` bucket visibility, object policies, representative legacy values, and cross-client compatibility remain deployment-dependent and blocked by Batch 0 evidence. Therefore this batch makes **no** change to `usePublishApartment`, visit-request image handling, bucket policy, stored image values, schema, or data migration. The implementation must remain deferred until authenticated staging inspection confirms a single public/private contract and a backward-compatible legacy strategy.
