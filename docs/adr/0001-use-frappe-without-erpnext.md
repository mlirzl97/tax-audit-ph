# ADR 0001: Use Frappe without ERPNext

## Status

Accepted for the first pilot.

## Context

The product needs typed records, permissions, workflows, private files,
assignments, timelines, version history, reports, portal access, APIs, and jobs.
ERPNext demonstrates these capabilities but also brings a large GPL-licensed
accounting application outside our product boundary.

## Decision

Build an MIT-licensed application on Frappe 16. Do not depend on or fork
ERPNext. Integrate with accounting systems through read-only adapters and
CSV/Excel imports.

## Consequences

We reuse mature framework behavior and keep the codebase small. We must still
prove Frappe's mobile experience and shared-consumer tenant isolation. If those
fail, the domain and telemetry contracts remain portable to another stack.

