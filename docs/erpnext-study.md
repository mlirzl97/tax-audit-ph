# ERPNext and Frappe source study

Studied on 2026-11-08:

- ERPNext `develop`, commit `b120a2e81ef017937df2e42912c18404ebadfb3d`
- Frappe `develop`, commit `37cc67e9d0fa2d09bbf38cc69045a311db812124`
- Stable target selected for this project: Frappe 16

## How ERPNext is assembled

ERPNext is an application on top of Frappe Framework. ERPNext contributes
business modules such as Accounts, CRM, Projects, Stock, Assets, and Support.
Frappe contributes the platform services those modules share:

- metadata-defined DocTypes and generated forms;
- Python document controllers with lifecycle hooks;
- role and record permissions;
- REST APIs generated from documents;
- workflows, transitions, assignments, and notifications;
- private files, communications, comments, and timelines;
- document version history and change diffs;
- reports, print formats, portal pages, queues, and scheduled jobs;
- migrations, fixtures, and test infrastructure.

A representative ERPNext `Issue` is defined by JSON metadata, a Python
controller, client-side behavior, list and kanban views, and tests. Its SLA is
not embedded in the form: separate SLA records and status rules determine
response and resolution clocks. This separation is directly useful for audit
cases, where BIR rules must be effective-dated and independently reviewed.

## Patterns to adopt

1. **Metadata first:** a case, notice, deadline, finding, or response package
   should have one typed record definition used by the UI, API, imports, and
   permissions.
2. **Thin controllers:** lifecycle validation belongs beside each record;
   cross-record services belong outside controllers.
3. **Workflows are data:** firms should configure review transitions without
   rewriting code.
4. **Version everything:** Frappe's `Version` record captures field and child
   row changes. Tax Audit PH enables change tracking on every case record.
5. **Files are records:** attachments carry privacy, ownership, content hash,
   and document links. Notice files are required to be private.
6. **Test clocks and state changes:** ERPNext's Issue tests cover working hours,
   holidays, pauses, and status transitions. Deadline rules require the same
   rigor before release.
7. **Keep modules separate:** ERPNext modules can evolve without putting every
   behavior into one controller.

## Patterns not to copy

- Do not fork or depend on ERPNext's accounting modules. They are unrelated to
  the audit product and ERPNext application code is GPLv3.
- Do not create hundreds of DocTypes before a validated case journey exists.
- Do not allow global roles to see all taxpayer files in a shared hosted site.
- Do not copy Frappe's telemetry behavior where setup funnel events can precede
  the user's post-setup preference. Tax Audit PH telemetry is explicit opt-in
  and allow-listed from the first event.
- Do not hard-code legal deadlines into forms or client JavaScript.

## Decision

Build a separate MIT-licensed Frappe application. Use Frappe 16 for platform
capabilities and create only tax-audit-specific domain records. Revisit the
framework choice after the first installable pilot, especially around shared
B2C tenant isolation and low-bandwidth mobile use.

