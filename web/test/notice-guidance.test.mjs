import assert from "node:assert/strict";
import test from "node:test";

import { getNoticeGuidance } from "../app/notice-guidance.mjs";

test("returns safe guidance for a supported notice", () => {
  const guidance = getNoticeGuidance("nod");

  assert.equal(guidance.label, "Notice of Discrepancy (NOD)");
  assert.match(guidance.action, /reconciliation/);
});

test("does not invent guidance for an unsupported notice", () => {
  assert.equal(getNoticeGuidance("made-up-notice"), null);
});
