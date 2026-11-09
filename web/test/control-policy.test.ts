import test from "node:test";
import assert from "node:assert/strict";

import {
  canChangeRiskTier,
  canConfirmDeadline,
  canPerformCaseAction,
  calculateInternalDates,
  deriveExposureRisk,
} from "../lib/control-policy.ts";

test("unrated clients never default to low risk", () => {
  assert.deepEqual(
    deriveExposureRisk({ basicTax: 100, surcharge: 20, interest: 10 }),
    { exposure: 130, exposureRating: "unrated", tier: "medium" },
  );
});

test("derives exposure from basic tax, surcharge, and interest", () => {
  assert.deepEqual(
    deriveExposureRisk(
      { basicTax: 1_000_000, surcharge: 250_000, interest: 100_000 },
      {
        basis: "annual_revenue",
        basisAmount: 100_000_000,
        mediumBoundary: 1,
        highBoundary: 2,
      },
    ),
    { exposure: 1_350_000, exposureRating: "rated", tier: "medium" },
  );
});

test("non-monetary triggers force high risk", () => {
  assert.equal(
    deriveExposureRisk(
      { basicTax: 1, surcharge: 0, interest: 0 },
      {
        basis: "fixed_peso",
        mediumBoundary: 1_000_000,
        highBoundary: 5_000_000,
      },
      ["mission_order"],
      { mission_order: "high" },
    ).tier,
    "high",
  );
});

test("anyone may raise risk but only the client cluster leader or HOD may lower it", () => {
  assert.equal(canChangeRiskTier("medium", "high", "junior", false, ""), true);
  assert.equal(canChangeRiskTier("high", "medium", "cluster_leader", true, "Documented resolution"), true);
  assert.equal(canChangeRiskTier("high", "medium", "cluster_leader", false, "Documented resolution"), false);
  assert.equal(canChangeRiskTier("high", "medium", "hod", false, "Documented resolution"), true);
  assert.equal(canChangeRiskTier("high", "medium", "tax_supervisor", false, "Documented resolution"), false);
  assert.equal(canChangeRiskTier("high", "medium", "hod", false, ""), false);
});

test("calculates internal targets and immediately escalates past dates", () => {
  const settings = { extensionDecisionOffsetDays: 7, submissionTargetBusinessDays: 3 };
  assert.deepEqual(calculateInternalDates("2026-11-16", "2026-11-09", settings), {
    extensionDecisionDate: "2026-11-09",
    submissionTargetDate: "2026-11-11",
    escalateImmediately: false,
  });
  assert.equal(calculateInternalDates("2026-11-10", "2026-11-09", settings).escalateImmediately, true);
});

test("deadline confirmer must be the supervisor and independent of receipt and calculation", () => {
  assert.equal(
    canConfirmDeadline({ actorId: "supervisor", actorRole: "tax_supervisor", receiptRecordedBy: "junior", calculatedBy: "senior" }),
    true,
  );
  assert.equal(
    canConfirmDeadline({ actorId: "supervisor", actorRole: "tax_supervisor", receiptRecordedBy: "junior", calculatedBy: "supervisor" }),
    false,
  );
  assert.equal(
    canConfirmDeadline({ actorId: "junior", actorRole: "junior", receiptRecordedBy: "junior", calculatedBy: "senior" }),
    false,
  );
});

test("unsigned CRF permits protective work but blocks substantive work without override", () => {
  const unsigned = { crfStatus: "sent" as const, hasWrittenOverride: false, hasAuthority: false, hasClientConforme: false };

  assert.equal(canPerformCaseAction("draft_extension", unsigned), true);
  assert.equal(canPerformCaseAction("manage_deadline", unsigned), true);
  assert.equal(canPerformCaseAction("reconciliation", unsigned), false);
  assert.equal(canPerformCaseAction("reconciliation", { ...unsigned, hasWrittenOverride: true }), true);
});

test("extension release needs authority, client conforme, and supervisor approval but not signed CRF", () => {
  const controls = {
    crfStatus: "sent" as const,
    hasWrittenOverride: false,
    hasAuthority: true,
    hasClientConforme: true,
    hasReviewerApproval: true,
  };

  assert.equal(canPerformCaseAction("release_extension", controls), true);
  assert.equal(canPerformCaseAction("release_extension", { ...controls, hasAuthority: false }), false);
  assert.equal(canPerformCaseAction("release_bir_response", controls), false);
  assert.equal(canPerformCaseAction("release_bir_response", { ...controls, crfStatus: "signed" }), true);
  assert.equal(
    canPerformCaseAction("release_bir_response", {
      ...controls,
      crfStatus: "signed",
      hasReviewerApproval: false,
    }),
    false,
  );
});
