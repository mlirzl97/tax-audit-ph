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
        <span className="prototype-badge">Open-source prototype</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Received a BIR letter?</p>
          <h1>Start calmly. Preserve the facts. Know the next safe action.</h1>
          <p className="lede">
            This prototype helps a Philippine taxpayer organize a notice before
            inviting a CPA or lawyer. It does not decide whether a notice is valid
            or whether tax is due.
          </p>
          <a className="primary-link" href="#intake">Start a sample intake</a>
        </div>

        <aside className="calm-card" aria-labelledby="first-hour-title">
          <p className="card-kicker">The first hour</p>
          <h2 id="first-hour-title">Do these before preparing a reply</h2>
          <ol>
            {safeguards.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </aside>
      </section>

      <section className="intake-section" id="intake" aria-labelledby="intake-title">
        <div className="section-heading">
          <p className="eyebrow">Guided intake</p>
          <h2 id="intake-title">What did you receive?</h2>
          <p>
            Use fabricated or de-identified information only. This hobby prototype
            does not upload or save your answers.
          </p>
        </div>
        <IntakeForm />
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
        <p>Prototype only · Not tax or legal advice · No taxpayer data is stored</p>
      </footer>
    </main>
  );
}
