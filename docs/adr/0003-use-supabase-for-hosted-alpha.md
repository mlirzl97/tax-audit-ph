# ADR 0003: Use Supabase for the hosted alpha

## Status

Accepted for the hosted private alpha.

## Context

The Vercel site must become a persistent, authenticated case workspace without
requiring a dedicated application server. The existing Frappe models remain a
useful reference for a firm-managed deployment, but Frappe cannot run inside a
Vercel application.

## Decision

Use a dedicated Supabase project for the hosted alpha's authentication and
PostgreSQL data. Next.js Server Components and Server Actions use the signed-in
user's session; PostgreSQL row-level security is the final tenant boundary.
The public client receives only the Supabase publishable key. No service-role
key is used by the application.

The first slice stores case metadata, checklist status, and an append-only
activity trail. Document storage remains disabled until quarantine, malware
scanning, private access logging, and file limits are implemented.

## Consequences

- Vercel can host the complete first slice.
- Hosted-alpha schema changes are kept as versioned SQL migrations.
- Frappe and Supabase are separate deployment options; data is not synchronized.
- A future decision is required before introducing a second firm or public
  document uploads.
