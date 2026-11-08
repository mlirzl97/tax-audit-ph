# Ideal customer profile

## Product category

Tax Audit PH is a panic-aware case workspace for Philippine taxpayers who have
received a BIR notice. It helps them understand the next safe factual action,
preserve and organize the case, and hand the same work to a professional when
human judgment is needed.

The product has two connected ICPs. The taxpayer is the primary design user.
The accounting firm is the professional service partner and eventual economic
buyer. They use the same case record through different interfaces.

## Primary design ICP: the distressed procedural novice

### Who they are

A Philippine micro or small-business owner, self-employed professional, or
non-accountant company administrator who has just received an unfamiliar BIR
letter and has no in-house tax team.

Typical context:

- runs a retail, service, professional, online, or small domestic corporation;
- relies on a bookkeeper, external accountant, spreadsheet, POS, or mainstream
  accounting software;
- uses a phone for urgent tasks and a laptop only when gathering records;
- can identify people, dates, transactions, returns, and documents but does not
  know the procedural meaning of LOA, NOD, NIC, PAN, FLD/FAN, or FDDA;
- cannot justify Big Four pricing and does not know whether the situation needs
  a bookkeeper, CPA, or tax lawyer;
- may be comfortable in English or Taglish but not formal tax language.

The defining qualification is the event, not revenue or industry: **they have a
BIR notice in hand, feel uncertain or frightened, and need to know what to do
without making the situation worse.**

### Trigger moment

The user has opened a letter, email, or eLA and is thinking:

- “Ano ito?”
- “May deadline ba?”
- “Magkano ang penalty?”
- “Isasara ba ang business ko?”
- “Ano ang ibibigay ko sa BIR?”
- “Kailangan ko na ba ng lawyer?”

They may freeze, ignore the notice, search social media, call a general
bookkeeper, or send records before understanding what was requested.

### Jobs to be done

**Functional job:** When I receive a BIR letter, help me identify what arrived,
protect the original record, organize what is being requested, and know the next
safe step.

**Emotional job:** Replace panic and shame with a visible, manageable plan.

**Professional handoff job:** If I need help, let me give a CPA or lawyer an
organized case instead of repeating the story and paying for avoidable sorting.

### What success feels like after five minutes

The user can say:

1. “I know what kind of letter this may be—or that it still needs identifying.”
2. “I preserved the original and recorded when and how it arrived.”
3. “I know the one thing I should do next.”
4. “I know what not to do.”
5. “I can leave and return without losing the case.”
6. “The system has not submitted or admitted anything for me.”

### Current alternatives

- ignore the letter until the anxiety becomes unavoidable;
- ask an accountant through Messenger, Viber, or email;
- search Facebook, Google, or videos and receive inconsistent advice;
- keep photos, PDFs, and spreadsheets in unrelated folders;
- hire an expensive adviser before the case is organized;
- send unreviewed records or explanations prematurely.

### Adoption blockers

- fear that entering information will notify or transmit it to BIR;
- fear that the product is secretly selling an expensive professional service;
- distrust of automated tax or legal conclusions;
- uncertainty about privacy, especially TINs, assessments, and financial data;
- difficulty identifying the notice or distinguishing printed and received dates;
- document uploads that are slow, confusing, or unsafe on a phone.

## Secondary end-user ICP: the accidental case coordinator

A finance assistant, office administrator, bookkeeper, or family member asked
to “handle the BIR letter” for a small domestic corporation. They are more
comfortable with files and forms than the owner but cannot make legal or tax
judgments. They need a checklist, responsibility tracking, chronology, and a
clear review boundary.

The taxpayer experience must work for this user without turning into a firm
dashboard.

## Professional ICP: the scaling local accounting or tax firm

### Firm profile

- Philippine boutique or small/midsize accounting, bookkeeping, or tax firm;
- roughly 3–30 staff serving 50–300 client entities;
- clients are mostly SMEs without internal tax departments;
- cases are coordinated through email, chat, spreadsheets, and shared drives;
- review commonly flows from encoder to senior, manager, partner, and client;
- senior time is lost reconstructing chronology and chasing basic records.

### Buyer and users

- **Economic buyer:** managing partner, tax partner, or practice owner.
- **Daily users:** encoder, associate, senior accountant, manager, reviewer.
- **External participant:** the client owner or administrator.

### Firm job to be done

Standardize intake, see ownership and risk across cases, receive better-organized
client files, preserve review history, and reduce senior time spent on document
chasing without weakening professional judgment.

### Firm product surface

The firm interface can be dense and operational: queues, assignments,
deadlines, missing records, review gates, and multi-client status. It must not be
the interface shown to a frightened taxpayer.

## Initial anti-ICP

Do not design the first release around:

- large taxpayers with internal tax and legal departments;
- criminal, fraud, raid, seizure, collection, or litigation-led matters that
  require immediate specialist representation;
- transfer-pricing, customs, or cross-border cases;
- taxpayers seeking a guaranteed assessment outcome;
- users seeking ordinary bookkeeping, invoicing, payroll, or tax return filing;
- accounting firms demanding full ERP replacement.

The system may triage these cases, but it should not pretend to handle them
independently.

## UX doctrine for the primary ICP

### Design for stress, not lack of intelligence

The taxpayer is capable but temporarily overloaded. The interface must reduce
working-memory demands and avoid making them feel ignorant or accused.

1. Ask one decision at a time.
2. Begin with “Is anyone from BIR with you now?” before ordinary intake.
3. Let “I’m not sure” be a valid, useful answer.
4. Show one primary action and one safe exit per screen.
5. Preserve exact BIR wording, then explain it in plain language underneath.
6. Never lead with statutes, citations, alleged amounts, or a dashboard.
7. Never show a calculated date as a confirmed legal deadline.
8. Explain why information is requested and whether it leaves the workspace.
9. Confirm that saving a case does not send a response or admission to BIR.
10. Reveal professional tools only when facts or the user request justify them.
11. Keep completed DIY work available even if the user declines professional help.
12. Prefer calm neutral states; reserve red for a verified urgent condition.

### Vocabulary translation

| Professional term | Taxpayer-facing language |
| --- | --- |
| Case intake | Let’s understand the letter |
| Dossier | Your BIR case |
| Evidence vault | Your records |
| Finding reconciliation | Check each amount |
| Review gate | Needs a professional decision |
| Source provenance | Where this information came from |
| Deadline computation | Date to have confirmed |
| Response package | Documents prepared for review |
| Assign counsel | Ask a tax lawyer for help |

## Critical taxpayer journey

1. **Calm:** “You do not have to solve everything right now.”
2. **Emergency check:** officer on site, subpoena/collection action, or immediate
   deadline concern. Stop the ordinary flow when urgent.
3. **Identify:** title of the letter, actual receipt date, and how it arrived.
4. **Protect:** preserve the original, envelope/email, attachments, and existing
   records. Do not alter or backdate anything.
5. **Orient:** explain what the letter generally means, what the system does not
   know, and the next factual action.
6. **Organize:** requested records and alleged discrepancies, one item at a time.
7. **Decide:** continue DIY or request professional review, with specific reasons.
8. **Handoff:** share an organized case only with explicit consent.

## Feature priorities

### Must prove the thesis

1. Panic-aware emergency triage.
2. Plain-language notice identification with “I’m not sure.”
3. Receipt facts and preservation checklist.
4. One visible next action and case-readiness progress.
5. Requested-record tracking: available, missing, or needs help.
6. Clear professional-review reasons and a portable handoff file.
7. Private account, tenant isolation, audit trail, and understandable consent.

### Next after usability is proven

- secure notice capture and reviewed extraction;
- discrepancy-by-discrepancy reconciliation;
- invitation and scoped access for an existing CPA or lawyer;
- firm queues, assignments, review stages, and white labeling;
- English/Taglish content tested with taxpayers;
- versioned BIR rule packages reviewed by accountable professionals.

### Not yet

- automated legal response drafting or filing;
- professional marketplace matching;
- automatic conclusions about validity or liability;
- full accounting, ERP, payroll, or ordinary tax-compliance modules.

## Pilot recruitment screener

A primary taxpayer tester should answer yes to most of these:

1. I own or administer a Philippine micro or small business.
2. My business does not have an internal tax or legal department.
3. I rely on an external accountant, bookkeeper, or myself for compliance.
4. I have received, or can realistically role-play receiving, a BIR notice.
5. I would initially use my phone to understand what to do.
6. I do not confidently know the difference between LOA, NOD, PAN, and FAN.

Recruit across lower and higher digital confidence. Do not recruit only CPAs,
accountants, or founders already familiar with tax procedure.

## Pilot success measures

Treat these as validation targets, not established performance:

- at least 80% identify the correct next safe action without assistance;
- median time to the first useful action is under three minutes;
- at least 90% understand that saving a case does not submit anything to BIR;
- no tester mistakes an unconfirmed date for a confirmed legal deadline;
- at least 80% can return to the case and identify the next incomplete task;
- taxpayers report lower anxiety after the first session than before it;
- professionals say the handoff reduces, rather than increases, intake work.

## Product decision

Design the taxpayer experience for the distressed procedural novice. Design the
firm experience for the scaling accounting practice. Do not compromise between
them in one interface; connect them through the same permissioned case record.
