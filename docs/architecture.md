# Architecture

## Boundary

Tax Audit PH is a Frappe application and a system of record for audit cases. It
is not the source ledger. Accounting information enters through CSV/Excel
imports or read-only connectors and retains source provenance.

## Initial records

- **Audit Case:** case identity, stage, owner, source system, and rule version.
- **Tax Notice:** supported notice type, issued/received dates, private source
  file, extraction state, and review state.
- **Case Deadline:** preliminary or confirmed deadline, source authority, and
  accountable reviewer.

Frappe supplies File, Version, Comment, Communication, ToDo, Assignment Rule,
Workflow, User, Role, and API facilities. We do not duplicate them.

## Next records after journey validation

- Evidence Request and Evidence Item
- Audit Finding and Reconciliation Item
- Response Package and Submission Receipt
- Professional Assignment and Conflict Check
- Effective-dated Rule Package

## Deployment boundary

For the first firm pilot, use one dedicated Frappe site. Do not place unrelated
firms in one site. A shared consumer site requires separate permission and
security work before public use.

The public hobby prototype is a separate, stateless Next.js app on Vercel. It
must use fabricated or de-identified cases and must not accept document uploads
or persist taxpayer data. The Frappe deployment boundary remains unchanged for
any real case data.

## Integration boundary

CSV/Excel is the required fallback. Vendor APIs are optional adapters. Imported
rows retain source system, source file hash, import time, and mapping version.
The product does not write back to accounting systems during the MVP.

## AI boundary

Extraction may propose fields. It cannot confirm a deadline, select a remedy,
finalize a response, declare an authority invalid, or conclude that no
liability exists. Every extracted field must expose provenance and correction.

