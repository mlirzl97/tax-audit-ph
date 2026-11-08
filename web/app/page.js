import IntakeForm from "./intake-form";

const safeguards = [
  "Keep the original notice, envelope, and proof of receipt.",
  "Do not alter, recreate, or backdate accounting records.",
  "Record who received the notice and the actual receipt date.",
  "Ask a Philippine tax professional to confirm any response deadline.",
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Tax Audit PH home">
          <span className="brand-mark" aria-hidden="true">TA</span>
          <span>Tax Audit PH</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#intake">Start intake</a>
          <a href="#safety">Safety</a>
          <a className="source-link" href="https://github.com/mlirzl97/tax-audit-ph">
            View source
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="announcement"><span>Prototype</span> A calmer first response to a BIR notice</p>
          <h1>Received a BIR letter? Start with the facts.</h1>
          <p className="lede">
            Organize what arrived, preserve the right records, and see one safe
            next action before inviting a CPA or lawyer.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#intake">Start a sample intake <span aria-hidden="true">→</span></a>
            <a className="secondary-link" href="#safety">What to do first</a>
          </div>
          <div className="trust-row" aria-label="Prototype safeguards">
            <span>No account needed</span>
            <span>No uploads</span>
            <span>No data saved</span>
          </div>
        </div>

        <section className="workspace-window" id="intake" aria-labelledby="intake-title">
          <div className="window-bar" aria-hidden="true">
            <div className="window-dots"><span /><span /><span /></div>
            <span>New audit case · Guided intake</span>
            <span className="window-status">Local only</span>
          </div>
          <div className="workspace-heading">
            <div>
              <p className="step-pill">Step 1 of 3</p>
              <h2 id="intake-title">Tell us what arrived</h2>
              <p>Use fabricated or de-identified information only.</p>
            </div>
            <div className="review-gate">
              <span aria-hidden="true">✓</span>
              <p><strong>Professional review gate</strong>Deadlines stay unconfirmed.</p>
            </div>
          </div>
          <IntakeForm />
        </section>
      </section>

      <section className="safety-section" id="safety" aria-labelledby="first-hour-title">
        <div className="section-heading">
          <p className="eyebrow">The first hour</p>
          <h2 id="first-hour-title">Protect the case before preparing a reply.</h2>
          <p>Four actions that reduce avoidable risk while you arrange professional help.</p>
        </div>
        <ol className="safeguard-grid">
          {safeguards.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="boundary" aria-labelledby="boundary-title">
        <div>
          <p className="eyebrow">Product boundary</p>
          <h2 id="boundary-title">A case workspace, not another accounting system.</h2>
        </div>
        <p>
          Tax Audit PH will organize notices, deadlines, evidence, reconciliations,
          review, and response packages while linking to accounting records held in
          Xero, JuanTax, QNE, QuickBooks, ERPNext, or spreadsheets.
        </p>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark" aria-hidden="true">TA</span>
          <span>Tax Audit PH</span>
        </a>
        <p>Prototype only · Not tax or legal advice · No taxpayer data is stored</p>
      </footer>
    </main>
  );
}
