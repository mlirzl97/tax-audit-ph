"use client";

import { useState } from "react";
import { getNoticeGuidance, noticeGuidance } from "./notice-guidance.mjs";

export default function IntakeForm() {
  const [result, setResult] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const notice = getNoticeGuidance(form.get("noticeType"));
    const receivedDate = form.get("receivedDate");

    if (!notice || !receivedDate) return;

    setResult({ notice, receivedDate });
  }

  return (
    <div className="intake-grid">
      <form className="intake-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="noticeType">Notice type</label>
          <select id="noticeType" name="noticeType" defaultValue="" required>
            <option value="" disabled>Select the closest match</option>
            {Object.entries(noticeGuidance).map(([value, notice]) => (
              <option key={value} value={value}>{notice.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="receivedDate">Actual date received</label>
          <input id="receivedDate" name="receivedDate" type="date" required />
          <small>Use the physical or electronic receipt date—not the date printed on the notice.</small>
        </div>

        <fieldset>
          <legend>What do you have right now?</legend>
          <label className="check-row">
            <input type="checkbox" name="materials" value="notice" />
            Complete notice and attachments
          </label>
          <label className="check-row">
            <input type="checkbox" name="materials" value="receipt" />
            Envelope, email, or proof of receipt
          </label>
          <label className="check-row">
            <input type="checkbox" name="materials" value="records" />
            Books, returns, and source records
          </label>
        </fieldset>

        <button type="submit">Show my safe first action</button>
        <p className="form-note">Answers stay in this browser tab and disappear on refresh.</p>
      </form>

      <div className="result-panel" aria-live="polite">
        {result ? (
          <>
            <p className="card-kicker">Preliminary guidance</p>
            <h3>{result.notice.label}</h3>
            <p>{result.notice.action}</p>
            <dl>
              <div>
                <dt>Receipt date recorded</dt>
                <dd>{result.receivedDate}</dd>
              </div>
              <div>
                <dt>Deadline status</dt>
                <dd>Unconfirmed—professional review required</dd>
              </div>
            </dl>
            <div className="warning">
              Never rely on an automatically calculated deadline for an actual case.
            </div>
          </>
        ) : (
          <div className="empty-result">
            <span aria-hidden="true">01</span>
            <h3>Your next action will appear here</h3>
            <p>We will not calculate or confirm a legal deadline in this prototype.</p>
          </div>
        )}
      </div>
    </div>
  );
}
