# Product pressure test

## Scenario 1: frightened store owner, clear eLA photo

The owner photographs the notice on a phone. The product must work on a slow
connection, preserve the original privately, extract fields, ask the owner to
confirm the receipt date, explain the first safe action, and show that any
deadline is preliminary.

**Failure:** the product asks accounting questions before reducing the owner's
immediate uncertainty.

## Scenario 2: wrong classification or receipt date

OCR mistakes PAN for NOD, or the issue date is mistaken for the receipt date.

**Required control:** editable extracted fields, visible provenance, rule
version, and a professional confirmation gate. No silent recalculation.

## Scenario 3: records do not exist

The taxpayer has receipts in boxes, incomplete books, and no reconciliations.

**Required control:** mark each request as available, missing, reconstructed,
or requires professional help. The system must not imply that uploading a few
files makes the response complete.

## Scenario 4: officer is on site or an SDT arrives

The taxpayer needs immediate human judgment and preservation guidance.

**Required control:** emergency banner, stop normal automation, preserve the
event chronology, and escalate. Never advise refusal, admission, payment, or
document destruction.

## Scenario 5: firm with 100 clients

Several staff members handle overlapping deadlines while partners review only
high-risk work.

**Required control:** per-client isolation, assignment, review queues, stage
views, overdue indicators, immutable history, and bulk status visibility.

## Scenario 6: compromised or careless firm user

A staff member guesses a URL, exports the wrong case, or shares a public file.

**Required control:** deny-by-default permissions, private attachments,
download logging, scoped exports, MFA, and a tested tenant boundary.

## Scenario 7: malicious upload

A notice upload contains malware, a decompression bomb, or an unsupported file.

**Required control before hosted launch:** content-type validation, size and
page limits, malware scanning, quarantined processing, and no active content in
previews.

## Scenario 8: BIR changes a rule

A new issuance changes an existing workflow while old cases remain open.

**Required control:** effective-dated rule packages. Existing calculations keep
their original source and version until an accountable reviewer migrates them.

## Scenario 9: self-hosted deployment

The administrator wants open source but does not want usage reporting.

**Required control:** telemetry off by default, local-only metrics still
available, clear export contents, and no setup events before consent.

## Scenario 10: product shutdown or adviser change

The taxpayer must not lose the case record.

**Required control:** complete, readable export of files, chronology,
deadlines, classifications, review history, and data provenance.

## Current hard blockers for a public hosted launch

- Shared B2C tenant isolation has not been proven.
- Notice malware scanning is not implemented.
- No BIR rule package has completed CPA and lawyer review.
- Professional roles and conflict checks are not implemented.
- The mobile taxpayer journey has not been tested with real users.

