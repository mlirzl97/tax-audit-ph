# Product brief

## User

Primary validation users, in design order:

1. A capable Philippine micro or small-business owner who becomes a distressed
   procedural novice after receiving a BIR notice and does not know what it
   means, what to preserve, or whether professional help is necessary.
2. A non-accountant administrator or bookkeeper coordinating the case for a
   small domestic corporation.
3. An accounting-firm encoder, senior, manager, or partner managing multiple
   client audit cases through email, spreadsheets, and shared drives.

The taxpayer is the primary UX user. The accounting firm is the professional
service partner and eventual economic buyer. Their interfaces share a case
record but must not share the same information density.

## Pain

The taxpayer faces unfamiliar terminology, short response periods, incomplete
records, unclear professional costs, and fear of making the case worse. The
firm faces fragmented evidence, duplicate requests, invisible ownership,
deadline risk, and inconsistent review packages.

## Why now

BIR audit procedures and controls changed repeatedly in 2026. Accounting data
already lives across cloud systems and spreadsheets, while no clear Philippine
equivalent of Canopy's tax-resolution workspace is broadly available.

## Ten-star version

The system recognizes a notice, explains the next safe action, organizes the
case, imports the relevant books and returns, produces a finding-by-finding
reconciliation, coordinates professional review, and preserves the final
response package and proof of submission.

## MVP

1. Run an emergency triage before ordinary intake.
2. Create a case from three verified facts.
3. Classify a supported notice type, including “I’m not sure.”
4. Record the actual receipt date and preserve proof of receipt.
5. Mark every legal deadline as unconfirmed until a professional verifies it.
6. Show one safe next action and a preservation checklist.
7. Track requested records as available, missing, or needs help.
8. Explain why professional review is recommended when a visible trigger exists.
9. Export a portable handoff file without submitting anything to BIR.
10. Invite an existing professional after access and consent controls are tested.

## Anti-goals

- General ledger, invoicing, inventory, payroll, or ordinary tax filing
- Automatic legal conclusions or promises about liability
- Automated filing or taxpayer representation
- CTA litigation management
- A marketplace before the case workspace works
- Pricing experiments during the open-source validation phase

## Evidence required to continue

- One pilot firm completes ten fabricated cases and at least three authorized,
  de-identified real cases.
- Twenty taxpayer testers can reach a useful first action without assistance.
- No unreviewed deadline is presented as confirmed.
- No cross-client data exposure occurs in permission testing.
- At least 70% of testers correctly identify what they must do next after the
  first session.

## Recommendation

Proceed with a narrow open-source pilot. Do not expand into accounting or
automated response drafting until the case intake, permissions, deadline gate,
and evidence workflow are reliable.

