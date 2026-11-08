# Tax Audit PH

Tax Audit PH is an open-source case workspace for Philippine taxpayers and the
accounting firms that help them respond to BIR audits and assessments.

It is **not an accounting system**. It imports or links records from systems
such as Xero, JuanTax, QNE, QuickBooks, ERPNext, and spreadsheets. Its job is to
organize notices, deadlines, evidence, reconciliations, review, and response
packages.

## Product surfaces

- **Taxpayer workspace:** a free self-service case workspace for understanding
  a notice, preserving records, tracking preliminary deadlines, and inviting a
  professional.
- **Firm workspace:** multi-client case management with assignments, review
  gates, evidence tracking, and client collaboration.
- **Professional assistance:** optional CPA or lawyer involvement. Software
  output is never a conclusion that an authority is invalid or that no tax is
  due.

## Current status

Pre-alpha. The repository currently contains the product boundary, initial
Frappe domain records, safety rules, and a privacy-safe telemetry contract.
Deadline computation and notice extraction are intentionally not implemented
until their rule sources and professional review gates are approved.

## Why Frappe

ERPNext demonstrated that Frappe's metadata-driven DocTypes can supply forms,
permissions, APIs, workflows, assignments, private files, activity timelines,
and change history without rebuilding those facilities. Tax Audit PH uses the
MIT-licensed Frappe Framework and does not depend on ERPNext's accounting
modules.

See [the ERPNext study](docs/erpnext-study.md),
[product brief](docs/product-brief.md), and
[pressure test](docs/pressure-test.md).

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

## Telemetry

Self-hosted telemetry is off by default. If an administrator opts in, only
allow-listed categorical events may leave the installation. Names, TINs,
addresses, amounts, case identifiers, filenames, free text, and document
contents are prohibited. See [telemetry policy](docs/telemetry.md).

## License

MIT. See [LICENSE](LICENSE).

