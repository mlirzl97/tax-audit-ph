# Tax Audit PH

Tax Audit PH is an open-source case workspace for Philippine taxpayers and the
accounting firms that help them respond to BIR audits and assessments.

It is **not an accounting system**. It imports or links records from systems
such as Xero, JuanTax, QNE, QuickBooks, ERPNext, and spreadsheets. Its job is to
organize notices, deadlines, evidence, reconciliations, review, and response
packages.

## Product surfaces

- **Taxpayer workspace:** a free self-service case workspace for understanding
  a notice, preserving receipt facts, organizing records, and preparing a
  professional handoff when the case needs human judgment.
- **Firm workspace:** multi-client case management with assignments, review
  gates, evidence tracking, and client collaboration.
- **Professional assistance:** optional CPA or lawyer involvement. Software
  output is never a conclusion that an authority is invalid or that no tax is
  due.

## Current status

Private alpha. The hosted application provides authenticated, persistent audit
cases, a guided First Response intake, a requested-records checklist, an
activity trail, and case metadata export. Deadline computation, notice
extraction, and document uploads remain disabled until their rule sources,
professional review gates, and file-security controls are approved.

## Why Frappe

ERPNext demonstrated that Frappe's metadata-driven DocTypes can supply forms,
permissions, APIs, workflows, assignments, private files, activity timelines,
and change history without rebuilding those facilities. Tax Audit PH uses the
MIT-licensed Frappe Framework and does not depend on ERPNext's accounting
modules.

See [the ERPNext study](docs/erpnext-study.md),
[product brief](docs/product-brief.md), and
[primary customer profile](docs/ideal-customer-profile.md).

## Development

The app targets Frappe 16.

```bash
bench get-app /absolute/path/to/this/repository
bench --site your-site.localhost install-app tax_audit_ph
```

The pure-Python safety checks can be run without a Frappe site:

```bash
python -m pytest
```

### Hosted alpha

The Next.js application is deployed on Vercel and uses a dedicated Supabase
project for authentication and tenant-isolated case data. Copy the example
environment variables before running it locally.

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Apply the files in `supabase/migrations/` in filename order to a dedicated
Supabase project before signing up. Real tax-notice files must not be uploaded;
document handling is deliberately absent from this release.

## Telemetry

Self-hosted telemetry is off by default. If an administrator opts in, only
allow-listed categorical events may leave the installation. Names, TINs,
addresses, amounts, case identifiers, filenames, free text, and document
contents are prohibited. See [telemetry policy](docs/telemetry.md).

## License

MIT. See [LICENSE](LICENSE).

