const CONFIG = {
  notionVersion: "2022-06-28",
  allowedOrigin: "https://nerlax.github.io",


  databases: {
    tasks: "7940322d373e4b9a8b457c6808ae02e7",
    habits: "b6cb68173b414bb88013848289d505ab",
    notes: "69737c904ff845f58c9fd8f5099a0b3c"
  }
};


function getProperty(property) {
  if (!property) return "";


  switch (property.type) {
    case "title":
      return (property.title || [])
        .map(item => item.plain_text || "")
        .join("");


    case "rich_text":
      return (property.rich_text || [])
        .map(item => item.plain_text || "")
        .join("");


    case "select":
      return property.select?.name || "";


    case "status":
      return property.status?.name || "";


    case "date":
      return property.date?.start || "";


    case "checkbox":
      return property.checkbox === true;


    default:
      return "";
  }
}






function simplifyPage(page, type) {
  const p = page.properties || {};


  if (type === "tasks") {
    return {
      id: page.id,
      title: getProperty(p["Zadanie"]),
      status: getProperty(p["Status"]),
      priority: getProperty(p["Priorytet"]),
      due: getProperty(p["Termin"]),
      nextStep: getProperty(p["Następny krok"]),
      url: page.url
    };
  }


  if (type === "habits") {
    return {
      id: page.id,
      title: getProperty(p["Wykonanie"]),
      date: getProperty(p["Data"]),
      done: getProperty(p["Wykonane"]),
      minimal: getProperty(p["Wersja minimalna"]),
      url: page.url
    };
  }


  if (type === "notes") {
    return {
      id: page.id,
      title: getProperty(p["Notatka"]),
      status: getProperty(p["Status"]),
      url: page.url
    };
  }


  return {
    id: page.id,
    url: page.url
  };
}





async function updateTaskStatus(request, env, taskId) {
  const id = taskId.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(id)) return { code: 400, data: { ok: false, error: "Invalid ID" } };
  const size = Number(request.headers.get("Content-Length") || "0");
  if (size > 1024) return { code: 413, data: { ok: false, error: "Payload too large" } };
  let value;
  try {
    const raw = await request.text();
    if (raw.length > 1024) throw Error("Too long");
    value = JSON.parse(raw);
  } catch {
    return { code: 400, data: { ok: false, error: "Invalid JSON" } };
  }
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).length !== 1 || value.status !== "Zrobione") {
    return { code: 400, data: { ok: false, error: "Invalid status" } };
  }
  const url = "https://api.notion.com/v1/pages/" + id;
  const headers = {
    Authorization: "Bearer " + env.N0T_ATL,
    "Notion-Version": CONFIG.notionVersion,
    "Content-Type": "application/json"
  };
  const lookup = await fetch(url, { headers });
  if (!lookup.ok) return { code: 502, data: { ok: false, error: "Lookup failed" } };
  const page = await lookup.json();
  const parent = (page.parent?.database_id || "").replace(/-/g, "").toLowerCase();
  const expected = CONFIG.databases.tasks.replace(/-/g, "").toLowerCase();
  if (!parent || parent !== expected || page.archived || page.properties?.Status?.type !== "select") {
    return { code: 403, data: { ok: false, error: "Not a writable task" } };
  }
  const response = await fetch(url, {
    method: "PATCH", headers,
    body: JSON.stringify({ properties: { Status: { select: { name: "Zrobione" } } } })
  });
  if (!response.ok) return { code: 502, data: { ok: false, error: "Update failed" } };
  return { code: 200, data: { ok: true, id: page.id, status: "Zrobione" } };
}

async function queryNotion(env, type, databaseId) {
  const endpoint =
    `https://api.notion.com/v1/databases/${databaseId}/query`;


  const response = await fetch(endpoint, {
    method: "POST",


    headers: {
      "Authorization": `Bearer ${env.N0T_ATL}`,
      "Notion-Version": CONFIG.notionVersion,
      "Content-Type": "application/json"
    },


    body: JSON.stringify({
      page_size: 100
    })
  });


  if (!response.ok) {
    throw {
      source: type,
      status: response.status
    };
  }


  const data = await response.json();


  return {
    items: (data.results || []).map(page =>
      simplifyPage(page, type)
    ),
    hasMore: Boolean(data.has_more)
  };
}




export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");


    // --------------------------------------
    // CORS
    // --------------------------------------


    const cors = {
      "Cache-Control": "no-store",
      "Vary": "Origin",
      "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
      "Access-Control-Allow-Headers":
        "Authorization, Content-Type",
      "Access-Control-Max-Age": "600"
    };


    if (origin === CONFIG.allowedOrigin) {
      cors["Access-Control-Allow-Origin"] =
        CONFIG.allowedOrigin;
    }




    const json = (data, status = 200) => {
      return Response.json(data, {
        status,
        headers: cors
      });
    };






    if (request.method === "OPTIONS") {
      if (origin !== CONFIG.allowedOrigin) {
        return json({ error: "Origin not allowed" }, 403);
      }


      return new Response(null, {
        status: 204,
        headers: cors
      });
    }






    if (url.pathname === "/health") {
      return json({
        ok: true,
        worker: "ADHD Life OS",
        version: "1.3",
        notionConfigured: Boolean(env.N0T_ATL),
        dashboardKeyConfigured: Boolean(env.DSK_H2)
      });
    }




    const taskMatch = url.pathname.match(/^\/api\/tasks\/([0-9a-f-]{32,36})$/i);
    if (url.pathname !== "/api/dashboard" && !taskMatch) {
      return json({ error: "Not found" }, 404);
    }
    if ((taskMatch && request.method !== "PATCH") || (!taskMatch && request.method !== "GET")) {
      return json({ error: "Method not allowed" }, 405);
    }






    if (!env.N0T_ATL || !env.DSK_H2) {
      return json({
        error: "Missing server configuration"
      }, 503);
    }




    const authorization =
      request.headers.get("Authorization");


    const expectedAuthorization =
      `Bearer ${env.DSK_H2}`;


    if (authorization !== expectedAuthorization) {
      return json({
        error: "Unauthorized"
      }, 401);
    }
    if (taskMatch) {
      try {
        const result = await updateTaskStatus(request, env, taskMatch[1]);
        return json(result.data, result.code);
      } catch (error) {
        console.error("Notion task update failed", error?.message || "unknown");
        return json({ ok: false, error: "Task update failed" }, 502);
      }
    }



    try {
      const [tasks, habits, notes] =
        await Promise.all([
          queryNotion(
            env,
            "tasks",
            CONFIG.databases.tasks
          ),


          queryNotion(
            env,
            "habits",
            CONFIG.databases.habits
          ),


          queryNotion(
            env,
            "notes",
            CONFIG.databases.notes
          )
        ]);


      return json({
        ok: true,
        updatedAt: new Date().toISOString(),
        tasks,
        habits,
        notes,
        capabilities: { taskStatusWrite: true }
      });


    } catch (error) {
      console.error(
        "Notion API request failed",
        error
      );


      return json({
        ok: false,
        error: "Notion data retrieval failed",
        source: error?.source || "unknown",
        notionStatus: error?.status || null
      }, 502);
    }
  }
};