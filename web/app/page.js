import Link from "next/link";

const firstActions = [
  "Record who physically received the notice, when, and for whom they were acting.",
  "Secure the notice, envelope, and proof of service in the approved SharePoint location.",
  "Alert the Tax Team and create a preliminary deadline for independent confirmation.",
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Tax Audit PH home">
          <span className="brand-mark" aria-hidden="true">TA</span>
          <span>Tax Audit PH</span>
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <Link className="source-link" href="/login">Sign in</Link>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Tax audit control for professional teams</p>
          <h1>Move every BIR notice through one controlled review.</h1>
          <p className="lede">
            Control receipt facts, CRF gates, deadlines, approvals, and response evidence
            without moving client files out of SharePoint.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" href="/login">Open the Tax Team workspace</Link>
            <a className="secondary-link" href="#how-it-works">See the control flow</a>
          </div>
        </div>

        <aside className="first-aid-sheet" id="first-actions" aria-labelledby="first-actions-title">
          <p className="sheet-label">At intake</p>
          <h2 id="first-actions-title">Capture these facts first.</h2>
          <ol>
            {firstActions.map((item, index) => (
              <li key={item}><span>{index + 1}</span><p>{item}</p></li>
            ))}
          </ol>
          <p className="sheet-note">An officer on site triggers immediate escalation. The system records facts and never concludes that service is valid or invalid.</p>
        </aside>
      </section>

      <section className="how-it-works" id="how-it-works" aria-labelledby="how-title">
        <div className="section-heading">
          <p className="eyebrow">One case, one defensible history</p>
          <h2 id="how-title">From receipt to proof of submission.</h2>
        </div>
        <ol className="process-list">
          <li><span>01</span><div><h3>Control the engagement</h3><p>Track the CRF, authority to represent, client conforme, assignment, and segregation of duties.</p></div></li>
          <li><span>02</span><div><h3>Control every deadline</h3><p>Keep preliminary and confirmed dates separate, version every change, and preserve its source.</p></div></li>
          <li><span>03</span><div><h3>Build an evidence-linked response</h3><p>Prepare only what the BIR requested, route approvals, and record proof before marking anything submitted.</p></div></li>
        </ol>
      </section>

      <section className="boundary" aria-labelledby="boundary-title">
        <p className="eyebrow">Deliberate boundaries</p>
        <h2 id="boundary-title">Files stay in SharePoint. The workspace stores control facts, links, deadlines, approvals, and immutable history. Sending stays manual.</h2>
      </section>

      <footer>
        <Link className="brand footer-brand" href="/">
          <span className="brand-mark" aria-hidden="true">TA</span>
          <span>Tax Audit PH</span>
        </Link>
        <p>Private pilot · No automatic client or BIR communication · Client files remain in SharePoint</p>
      </footer>
    </main>
  );
}
