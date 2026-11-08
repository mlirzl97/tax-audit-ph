# Privacy-safe usage statistics

## Purpose

Usage statistics answer whether users reach a safe first action and whether
firms can manage cases reliably. They are not a secondary source of taxpayer
data.

## Consent

- Self-hosted telemetry is off by default.
- No setup event is sent before consent.
- An administrator can inspect the exact event schema and disable export.
- Operational security logs remain local unless separately configured.

## Allowed exported events

The code allow-lists case creation, notice classification, deadline review,
stage change, professional invitation, case export, and categorical workflow
errors. Arbitrary event names, keys, and values fail validation.

## Prohibited data

- Name, TIN, email, phone, address, RDO, or user ID
- Case, client, document, or stable user identifier
- Tax amount, assessment amount, sales, or revenue
- Filename, file path, document hash, or document contents
- Free text, OCR text, response text, or error message
- Exact dates from a taxpayer's case

## Initial product metrics

- Installations opting into telemetry
- Cases created per active installation
- Supported versus corrected versus unsupported classifications
- Deadline confirmations, corrections, and escalations
- Time-to-reviewed-deadline buckets
- Stage completion counts
- Case export rate
- Categorical workflow failure rate

The hosted product may analyze individual journeys only after a separate data
protection review. The open-source telemetry contract intentionally exports no
case- or user-level correlation identifier.

