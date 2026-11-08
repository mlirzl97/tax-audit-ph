import { isUuid } from "../../../../lib/case-validation.mjs";
import { createClient } from "../../../../lib/supabase/server";

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [caseResult, checklistResult, eventResult] = await Promise.all([
    supabase.from("audit_cases").select("*").eq("id", id).single(),
    supabase.from("case_checklist").select("label, status, position").eq("case_id", id).order("position"),
    supabase.from("case_events").select("event_type, details, created_at").eq("case_id", id).order("created_at"),
  ]);

  if (caseResult.error || !caseResult.data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = JSON.stringify({
    exported_at: new Date().toISOString(),
    case: caseResult.data,
    checklist: checklistResult.data ?? [],
    events: eventResult.data ?? [],
  }, null, 2);
  const filename = caseResult.data.client_reference.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();

  return new Response(body, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename || "audit-case"}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
