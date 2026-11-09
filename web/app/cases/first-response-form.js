"use client";

import { useActionState, useState } from "react";

import { noticeTypes, triageAnswers } from "../../lib/case-validation.mjs";

export default function FirstResponseForm({ action }) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [officerPresent, setOfficerPresent] = useState("");

  return (
    <form className="case-form first-response-form" action={formAction}>
      <input type="hidden" name="stage" value="received" />
      <input type="hidden" name="enforcementTermsMentioned" value="not_sure" />
      <input type="hidden" name="responsePeriodMentioned" value="not_sure" />
      <input type="hidden" name="deliveryMethod" value="not_sure" />

      {state?.error && <p className="form-alert" role="alert">{state.error}</p>}

      <fieldset className="safety-question">
        <legend>Is a BIR officer on site right now?</legend>
        <p>An officer on site triggers immediate escalation.</p>
        <div className="answer-choices">
          {triageAnswers.map(([answer, label]) => (
            <label className={officerPresent === answer ? "answer-choice answer-selected" : "answer-choice"} key={answer}>
              <input
                type="radio"
                name="birOfficerPresent"
                value={answer}
                checked={officerPresent === answer}
                onChange={() => setOfficerPresent(answer)}
                required
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {officerPresent === "yes" && (
        <div className="urgent-guidance" role="status">
          <strong>Pause before handing over or signing anything.</strong>
          Ask for the officer’s name, identification, authority document, and copies of anything presented. Preserve the records exactly as they are and contact a Philippine tax professional promptly.
        </div>
      )}

      <div className="intake-fields">
        <div className="field">
          <label htmlFor="noticeType">Notice title</label>
          <select id="noticeType" name="noticeType" defaultValue="" required>
            <option value="" disabled>Choose the closest title</option>
            {noticeTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <small>If none matches, choose “Other or unknown notice.”</small>
        </div>

        <div className="field">
          <label htmlFor="receivedDate">Actual receipt date</label>
          <input id="receivedDate" name="receivedDate" type="date" required />
          <small>Use the delivery date, not automatically the date printed on the letter.</small>
        </div>
      </div>

      <div className="submit-row">
        <p>Logging creates an internal case only. It does not notify the client or BIR.</p>
        <button type="submit" disabled={pending || !officerPresent}>
          {pending ? "Creating case…" : "Create case"}
        </button>
      </div>
    </form>
  );
}
