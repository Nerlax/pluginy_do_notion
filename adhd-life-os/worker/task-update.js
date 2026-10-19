/**
 * ADHD Life OS — opt-in task status write adapter for the existing Cloudflare Worker.
 * Do not deploy as a replacement for an existing Worker. Import into its fetch handler.
 *
 * Configuration (Cloudflare secrets):
 * - NOTION_TOKEN: Notion integration token
 * - DASHBOARD_KEY: existing dashboard access key (use the SAME key as GET /api/dashboard)
 * - TASKS_DATA_SOURCE_ID: Notion tasks data_source ID from the official Notion API
 *
 * Caller must preserve existing CORS handling and respond to OPTIONS preflight.
 * Enable data.capabilities.taskStatusWrite = true in GET /api/dashboard only
 * after this PATCH route is successfully connected and tested.
 */

const ALLOWED = new Set(["Do zrobienia", "W trakcie", "Czeka", "Zrobione"]);
const NOTION_VERSION = "2025-09-03";
const UUID = /^[a-f0-9]{32}$/i;

export async function handleTaskPatch(request, env) {
  if (request.method !== "PATCH") return json({ ok: false, error: "Method not allowed" }, 405);
  const bearer = request.headers.get("Authorization") || "";
  // Swap for existing Worker authentication if it has a different secret name.
  if (!env.DASHBOARD_KEY || bearer !== "Bearer " + env.DASHBOARD_KEY)
    return json({ ok: false, error: "Unauthorized" }, 401);
  if (!env.NOTION_TOKEN || !env.TASKS_DATA_SOURCE_ID)
    return json({ ok: false, error: "Not configured" }, 503);

  const pathname = new URL(request.url).pathname;
  const raw = pathname.match(/^\/api\/tasks\/([0-9a-f-]{32,36})$/i)?.[1] || "";
  const id = raw.replace(/-/g, "");
  if (!UUID.test(id)) return json({ ok: false, error: "Invalid task id" }, 400);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  if (!body || typeof body.status !== "string" || !ALLOWED.has(body.status) ||
      Object.keys(body).some(k => k !== "status"))
    return json({ ok: false, error: "Invalid status" }, 400);

  const base = "https://api.notion.com/v1/pages/" + id;
  const headers = { Authorization: "Bearer " + env.NOTION_TOKEN, "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json" };
  const existing = await fetch(base, { headers });
  if (!existing.ok) return json({ ok: false, error: "Task lookup failed" }, 502);
  const page = await existing.json();

  // Strong ownership guard: a page belonging to any other database cannot be changed.
  const parentId = (page.parent?.data_source_id || "").replace(/-/g, "").toLowerCase();
  const expected = env.TASKS_DATA_SOURCE_ID.replace(/-/g, "").toLowerCase();
  if (!parentId || parentId !== expected) return json({ ok: false, error: "Not a task" }, 403);
  if (page.archived || page.in_trash) return json({ ok: false, error: "Task is archived" }, 409);

  const updated = await fetch(base, {
    method: "PATCH", headers,
    body: JSON.stringify({ properties: { Status: { select: { name: body.status } } } })
  });
  if (!updated.ok) return json({ ok: false, error: "Task update failed" }, 502);
  return json({ ok: true, id, status: body.status });
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
