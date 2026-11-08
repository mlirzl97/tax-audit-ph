"use client";

import { useState } from "react";

import {
  deliveryMethods,
  noticeTypes,
  triageAnswers,
} from "../../lib/case-validation.mjs";

const stepLabels = [
  "Right now",
  "Letter wording",
  "Response period",
  "Letter title",
  "How it arrived",
  "Date received",
  "Save case",
];

const initialValues = {
  birOfficerPresent: "",
  enforcementTermsMentioned: "",
  responsePeriodMentioned: "",
  noticeType: "",
  deliveryMethod: "",
  receivedDate: "",
  clientReference: "",
};

function AnswerChoices({ id, value, onChange }) {
  return (
    <div className="answer-choices">
      {triageAnswers.map(([answer, label]) => (
        <label className={value === answer ? "answer-choice answer-selected" : "answer-choice"} key={answer}>
          <input
            type="radio"
            name={`display-${id}`}
            value={answer}
            checked={value === answer}
            onChange={() => onChange(answer)}
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

export default function FirstResponseForm({ action }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);

  const setValue = (name, value) => setValues((current) => ({ ...current, [name]: value }));
  const currentValue = [
    values.birOfficerPresent,
    values.enforcementTermsMentioned,
    values.responsePeriodMentioned,
    values.noticeType,
    values.deliveryMethod,
    values.receivedDate,
    values.clientReference.trim().length >= 2 ? values.clientReference : "",
  ][step];
  const canSubmit = Object.values(values).every((value) => String(value).trim().length > 0)
    && values.clientReference.trim().length >= 2;

  return (
    <form
      className="case-form first-response-form"
      action={action}
      onSubmit={(event) => {
        if (step < stepLabels.length - 1) {
          event.preventDefault();
          if (currentValue) setStep((current) => current + 1);
        }
      }}
    >
      <input type="hidden" name="stage" value="intake" />

      <header className="intake-progress">
        <div>
          <span>Step {step + 1} of {stepLabels.length}</span>
          <strong>{stepLabels[step]}</strong>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${((step + 1) / stepLabels.length) * 100}%` }} />
        </div>
      </header>

      <section className="question-panel" hidden={step !== 0}>
        <p className="eyebrow">Immediate safety check</p>
        <h2>Is a BIR officer with you right now?</h2>
        <p>Choose yes if someone is currently at your shop, office, or home acting in an official capacity.</p>
        <AnswerChoices
          id="bir-officer-present"
          value={values.birOfficerPresent}
          onChange={(value) => setValue("birOfficerPresent", value)}
        />
        <input type="hidden" name="birOfficerPresent" value={values.birOfficerPresent} />
        {values.birOfficerPresent === "yes" && (
          <div className="urgent-guidance" role="status">
            <strong>Professional guidance is recommended now.</strong>
            Preserve the officer’s name, identification details, arrival time, and documents presented. Do not alter records or sign an explanation you do not understand.
          </div>
        )}
      </section>

      <section className="question-panel" hidden={step !== 1}>
        <p className="eyebrow">Look only at the wording</p>
        <h2>Does the letter mention collection, seizure, subpoena, garnishment, or final assessment?</h2>
        <p>You do not need to interpret the words. Choose yes only if you can see one of them or something very similar.</p>
        <AnswerChoices
          id="enforcement-terms"
          value={values.enforcementTermsMentioned}
          onChange={(value) => setValue("enforcementTermsMentioned", value)}
        />
        <input type="hidden" name="enforcementTermsMentioned" value={values.enforcementTermsMentioned} />
        {values.enforcementTermsMentioned === "yes" && (
          <div className="urgent-guidance" role="status">
            <strong>This wording needs prompt professional review.</strong>
            Keep every page and attachment together. This workspace will help organize the case but will not decide the legal response.
          </div>
        )}
      </section>

      <section className="question-panel" hidden={step !== 2}>
        <p className="eyebrow">Do not calculate anything</p>
        <h2>Does the letter say you must respond within a number of days?</h2>
        <p>Answer from the printed words only. The system will not treat that number as a confirmed legal deadline.</p>
        <AnswerChoices
          id="response-period"
          value={values.responsePeriodMentioned}
          onChange={(value) => setValue("responsePeriodMentioned", value)}
        />
        <input type="hidden" name="responsePeriodMentioned" value={values.responsePeriodMentioned} />
        {values.responsePeriodMentioned === "yes" && (
          <div className="notice-guidance" role="status">
            Record the actual receipt date next. Have a Philippine tax professional confirm the applicable deadline before relying on it.
          </div>
        )}
      </section>

      <section className="question-panel" hidden={step !== 3}>
        <p className="eyebrow">Copy the title, if you can</p>
        <h2>What letter did you receive?</h2>
        <p>Use the heading printed near the top. “Other or unknown notice” is a safe answer.</p>
        <div className="field">
          <label htmlFor="noticeType">Letter title</label>
          <select
            id="noticeType"
            name="noticeType"
            value={values.noticeType}
            onChange={(event) => setValue("noticeType", event.target.value)}
          >
            <option value="" disabled>Select the closest match</option>
            {noticeTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </section>

      <section className="question-panel" hidden={step !== 4}>
        <p className="eyebrow">Receipt facts</p>
        <h2>How did the letter reach you?</h2>
        <p>Choose what actually happened, even if the letter shows a different printed date.</p>
        <div className="field">
          <label htmlFor="deliveryMethod">Delivery method</label>
          <select
            id="deliveryMethod"
            name="deliveryMethod"
            value={values.deliveryMethod}
            onChange={(event) => setValue("deliveryMethod", event.target.value)}
          >
            <option value="" disabled>Select one</option>
            {deliveryMethods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </section>

      <section className="question-panel" hidden={step !== 5}>
        <p className="eyebrow">Receipt facts</p>
        <h2>When did you actually receive it?</h2>
        <p>Use the day the letter was handed over, delivered, or first became available to you—not automatically the date printed on it.</p>
        <div className="field">
          <label htmlFor="receivedDate">Actual date received</label>
          <input
            id="receivedDate"
            name="receivedDate"
            type="date"
            value={values.receivedDate}
            onChange={(event) => setValue("receivedDate", event.target.value)}
          />
          <small>Keep the envelope, email, delivery proof, or electronic notification.</small>
        </div>
      </section>

      <section className="question-panel" hidden={step !== 6}>
        <p className="eyebrow">Save privately</p>
        <h2>What should we call this case?</h2>
        <p>Use a nickname you will recognize. Do not enter a TIN.</p>
        <div className="field">
          <label htmlFor="clientReference">Private case name</label>
          <input
            id="clientReference"
            name="clientReference"
            value={values.clientReference}
            maxLength="120"
            onChange={(event) => setValue("clientReference", event.target.value)}
            placeholder="Example: Store BIR letter – November"
          />
        </div>
        <div className="privacy-confirmation">
          <strong>Creating this case does not send anything to BIR.</strong>
          It saves these facts in your private workspace so you can organize the next steps.
        </div>
      </section>

      <div className="intake-controls">
        {step > 0 ? (
          <button className="secondary-button" type="button" onClick={() => setStep((current) => current - 1)}>
            Back
          </button>
        ) : <span />}
        {step < stepLabels.length - 1 ? (
          <button type="button" disabled={!currentValue} onClick={() => setStep((current) => current + 1)}>
            Continue
          </button>
        ) : (
          <button type="submit" disabled={!canSubmit}>Create my private case</button>
        )}
      </div>
    </form>
  );
}
