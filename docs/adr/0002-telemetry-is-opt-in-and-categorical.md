# ADR 0002: Telemetry is opt-in and categorical

## Status

Accepted.

## Context

Tax notices and case records contain identity, financial, and potentially
privileged information. Raw analytics would create a second sensitive dataset.

## Decision

Self-hosted telemetry is off by default. Export only predefined categorical
events without case, user, document, money, or free-text fields. Reject unknown
properties and values in code.

## Consequences

We can measure installation-level activation and workflow use but cannot build
cross-session user funnels from open-source telemetry. Any richer hosted
analytics requires separate consent and privacy review.

