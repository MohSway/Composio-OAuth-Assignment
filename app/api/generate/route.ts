import { GoogleGenAI } from "@google/genai";
import { setCachedGuide, getCachedGuide, slugify } from "@/lib/guides";
import type { Guide } from "@/lib/types";

// Tavily search + extract, then Gemini generation can take longer than the
// platform's default serverless timeout (commonly ~10s).
export const maxDuration = 60;

const SCHEMA_INSTRUCTIONS = `You are writing a guide on how a developer registers and gets approved to use an OAuth app with a given provider/platform, for a product called AuthPilot.

You will be given real content extracted from that provider's current official developer documentation below. Base every concrete detail — scope names, URLs, review requirements, wait times — on that extracted content, not on general knowledge alone. If the extracted content doesn't cover something, say so plainly rather than inventing specifics.

Respond with ONLY a single JSON object (no markdown fences, no prose before or after) matching exactly this shape:

{
  "app": "string - the provider's proper name",
  "frictionSummary": "string - one sentence for a card",
  "frictionLevel": "instant" | "review" | "long-wait",
  "prerequisites": ["string", ...],
  "steps": [{ "title": "string", "body": "string", "codeSnippet": "string (optional)" }, ...],
  "scopes": [{ "scope": "string", "grants": "string" }, ...],
  "approval": { "required": boolean, "expectedWait": "string", "notes": "string" },
  "gotchas": ["string", ...],
  "agentPrompt": {
    "do": ["string", ...],
    "dont": ["string", ...],
    "envVars": ["string", ...],
    "redirectUri": "string"
  },
  "evidence": "doc-sourced"
}

The agentPrompt must be genuinely specific to this provider: real SDK/package names, the real authorize/token URLs, real scope names, real env var naming. Do not reuse a generic template. Always set "evidence" to "doc-sourced".`;

const TAVILY_API = "https://api.tavily.com";

function sseLine(obj: unknown) {
  return JSON.stringify(obj) + "\n";
}

function extractJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

interface TavilySearchResult {
  url: string;
  title: string;
  content: string;
}

async function tavilySearch(apiKey: string, query: string): Promise<TavilySearchResult[]> {
  const res = await fetch(`${TAVILY_API}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query, search_depth: "advanced", max_results: 4 }),
  });
  if (!res.ok) throw new Error(`Tavily search failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.results ?? [];
}

export async function POST(req: Request) {
  const { query } = (await req.json()) as { query: string };
  const appName = query.trim();
  const slug = slugify(appName);

  const cached = getCachedGuide(slug);
  if (cached) {
    return new Response(sseLine({ type: "done", data: cached }), {
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(sseLine({ type: "error", message: "GEMINI_API_KEY is not configured on the server." }), {
      status: 500,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }
  if (!process.env.TAVILY_API_KEY) {
    return new Response(sseLine({ type: "error", message: "TAVILY_API_KEY is not configured on the server." }), {
      status: 500,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const tavilyKey = process.env.TAVILY_API_KEY;

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (obj: unknown) => controller.enqueue(new TextEncoder().encode(sseLine(obj)));

      let results: TavilySearchResult[] = [];
      try {
        enqueue({ type: "status", message: `Searching for ${appName}'s developer docs...` });
        results = await tavilySearch(tavilyKey, `${appName} OAuth API developer documentation app registration`);

        if (results.length === 0) {
          enqueue({ type: "error", message: `Couldn't find developer docs for "${appName}". Try a more specific name.` });
          controller.close();
          return;
        }

        enqueue({ type: "status", message: `Reading ${new URL(results[0].url).hostname}...` });
      } catch (err) {
        enqueue({ type: "error", message: err instanceof Error ? err.message : "Search failed." });
        controller.close();
        return;
      }

      // Using search results' own content snippets (skips a separate /extract
      // round trip) to stay well under the platform's 60s function cap.
      const context = results
        .map((r) => `--- Source: ${r.url} ---\n${(r.content ?? "").slice(0, 3000)}`)
        .join("\n\n")
        .slice(0, 10000);

      enqueue({ type: "status", message: "Writing the guide from what was found..." });

      // Some proxies in front of the function will cut an idle connection
      // that goes quiet for a few seconds, even within the overall function
      // time budget. A periodic heartbeat keeps bytes flowing while we wait
      // on Gemini, including the gap before its first streamed chunk.
      const heartbeat = setInterval(() => {
        enqueue({ type: "status", message: "Still writing the guide..." });
      }, 4000);

      let fullText = "";
      try {
        const response = await ai.models.generateContentStream({
          model: "gemini-flash-lite-latest",
          contents: `${SCHEMA_INSTRUCTIONS}\n\nProvider / app to research: ${appName}\n\nExtracted developer documentation:\n${context}`,
        });

        for await (const chunk of response) {
          if (chunk.text) fullText += chunk.text;
        }
      } catch (err) {
        clearInterval(heartbeat);
        enqueue({ type: "error", message: err instanceof Error ? err.message : "Generation failed." });
        controller.close();
        return;
      }
      clearInterval(heartbeat);

      if (!fullText) {
        enqueue({ type: "error", message: "Gemini returned no content." });
        controller.close();
        return;
      }

      const parsed = extractJson(fullText);
      if (!parsed) {
        enqueue({ type: "error", message: "Couldn't parse a guide from the research. Try rephrasing the app name." });
        controller.close();
        return;
      }

      const guide: Guide = {
        app: String(parsed.app ?? appName),
        frictionSummary: String(parsed.frictionSummary ?? ""),
        frictionLevel: (parsed.frictionLevel as Guide["frictionLevel"]) ?? "review",
        prerequisites: Array.isArray(parsed.prerequisites) ? (parsed.prerequisites as string[]) : [],
        steps: Array.isArray(parsed.steps) ? (parsed.steps as Guide["steps"]) : [],
        scopes: Array.isArray(parsed.scopes) ? (parsed.scopes as Guide["scopes"]) : [],
        approval: (parsed.approval as Guide["approval"]) ?? { required: true, expectedWait: "Unknown", notes: "" },
        gotchas: Array.isArray(parsed.gotchas) ? (parsed.gotchas as string[]) : [],
        agentPrompt: (parsed.agentPrompt as Guide["agentPrompt"]) ?? { do: [], dont: [], envVars: [], redirectUri: "" },
        evidence: "doc-sourced",
      };

      setCachedGuide(guide);
      enqueue({ type: "done", data: guide });
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
}
