import test from "node:test";
import assert from "node:assert/strict";

import {
  getProfessionalReviewReasons,
  isChecklistStatus,
  isUuid,
  validateCaseInput,
} from "../lib/case-validation.mjs";

test("accepts a complete audit case", () => {
  const result = validateCaseInput({
    clientReference: "ACME-2026-001",
    noticeType: "nod",
    receivedDate: "2026-11-08",
    stage: "received",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.values.client_reference, "ACME-2026-001");
  assert.equal(result.values.bir_officer_present, "not_sure");
});

test("rejects unsupported case values", () => {
  const result = validateCaseInput({
    clientReference: " ",
    noticeType: "assessment",
    receivedDate: "not-a-date",
    stage: "deleted",
  });

  assert.equal(result.errors.length, 4);
});

test("validates checklist status and identifiers", () => {
  assert.equal(isChecklistStatus("available"), true);
  assert.equal(isChecklistStatus("done"), false);
  assert.equal(isUuid("6ba7b810-9dad-41d1-80b4-00c04fd430c8"), true);
  assert.equal(isUuid("../../another-case"), false);
});

test("accepts only supported first-response answers", () => {
  const accepted = validateCaseInput({
    clientReference: "SHOP-001",
    noticeType: "other",
    receivedDate: "2026-11-08",
    stage: "received",
    birOfficerPresent: "no",
    enforcementTermsMentioned: "not_sure",
    responsePeriodMentioned: "yes",
    deliveryMethod: "hand_delivery",
  });
  const rejected = validateCaseInput({
    clientReference: "SHOP-001",
    noticeType: "other",
    receivedDate: "2026-11-08",
    stage: "received",
    birOfficerPresent: "sometimes",
    enforcementTermsMentioned: "unknown_value",
    responsePeriodMentioned: "later",
    deliveryMethod: "carrier_pigeon",
  });

  assert.deepEqual(accepted.errors, []);
  assert.deepEqual(
    {
      bir_officer_present: accepted.values.bir_officer_present,
      enforcement_terms_mentioned: accepted.values.enforcement_terms_mentioned,
      response_period_mentioned: accepted.values.response_period_mentioned,
      delivery_method: accepted.values.delivery_method,
    },
    {
      bir_officer_present: "no",
      enforcement_terms_mentioned: "not_sure",
      response_period_mentioned: "yes",
      delivery_method: "hand_delivery",
    },
  );
  assert.equal(rejected.errors.length, 4);
});

test("recommends professional review only for evidence-based reasons", () => {
  assert.deepEqual(getProfessionalReviewReasons({ notice_type: "nod" }), []);
  assert.deepEqual(
    getProfessionalReviewReasons(
      { notice_type: "pan" },
      [{ status: "missing" }, { status: "professional_help" }],
    ),
    [
      "A PAN can affect protest rights and needs a professionally confirmed response plan.",
      "At least one requested record is missing.",
      "You marked a records task as needing professional help.",
    ],
  );
});

test("explains first-response escalation triggers", () => {
  assert.deepEqual(
    getProfessionalReviewReasons({
      notice_type: "nod",
      bir_officer_present: "yes",
      enforcement_terms_mentioned: "yes",
      response_period_mentioned: "yes",
    }),
    [
      "A BIR officer is present now; prompt CPA or tax-lawyer guidance is recommended.",
      "The letter may contain enforcement or collection language that needs prompt professional review.",
      "The letter states a response period; have the applicable deadline confirmed before relying on it.",
    ],
  );
});
