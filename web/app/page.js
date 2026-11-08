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
          <a href="#workspace">Workspace</a>
          <a href="#safety">Safety</a>
          <a className="source-link" href="/login">
            Sign in
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="announcement"><span>Free DIY</span> A working case workspace for BIR notices</p>
          <h1>Received a BIR letter? Start here.</h1>
          <p className="lede">
            Calm the panic, preserve what arrived, and organize the case yourself.
            If the facts become risky or complicated, hand the same file to a professional.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="/login">Start a free case <span aria-hidden="true">→</span></a>
            <a className="secondary-link" href="#safety">What to do first</a>
          </div>
          <div className="trust-row" aria-label="Workspace safeguards">
            <span>Private sign-in</span>
            <span>Tenant-isolated cases</span>
            <span>Audited changes</span>
          </div>
        </div>

        <section className="workspace-window" id="workspace" aria-labelledby="workspace-title">
          <div className="window-bar" aria-hidden="true">
            <div className="window-dots"><span /><span /><span /></div>
              <span>DIY workspace · My cases</span>
            <span className="window-status">Private alpha</span>
          </div>
          <div className="workspace-heading">
            <div>
              <p className="step-pill">Working release</p>
              <h2 id="workspace-title">Do the safe work first</h2>
              <p>Record the facts, track requested records, and export the same file when you need help.</p>
            </div>
            <div className="review-gate">
              <span aria-hidden="true">✓</span>
              <p><strong>No forced handoff</strong>Get help when the facts justify it.</p>
            </div>
          </div>
          <div className="product-preview">
            <div className="preview-stat">
              <span>Example open cases</span>
              <strong>3</strong>
              <small>Across intake, records, and review</small>
            </div>
            <div className="preview-list" aria-label="Example case list">
              <div><strong>CLIENT-001</strong><span>Notice of Discrepancy</span><em>Records gathering</em></div>
              <div><strong>CLIENT-002</strong><span>Letter of Authority</span><em>Professional review</em></div>
              <div><strong>CLIENT-003</strong><span>Preliminary Assessment Notice</span><em>Intake</em></div>
            </div>
          </div>
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
        <p>Private alpha · Not tax or legal advice · Document uploads are disabled</p>
      </footer>
    </main>
  );
}
