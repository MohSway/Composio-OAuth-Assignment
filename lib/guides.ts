import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Guide } from "./types";
import { slugify } from "./slug";

export { slugify };

const GUIDES_DIR = path.join(process.cwd(), "data", "guides");
// The deployed app bundle's own directory is read-only on serverless
// platforms (e.g. Vercel) — only the OS temp dir is writable at runtime.
// Locally, os.tmpdir() still works fine for a same-session cache.
const CACHE_DIR = path.join(os.tmpdir(), "authpilot-generated-cache");

export function getLibraryGuides(): Guide[] {
  const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(GUIDES_DIR, f), "utf-8")));
}

export function getLibraryGuide(slug: string): Guide | null {
  return getLibraryGuides().find((g) => slugify(g.app) === slug) ?? null;
}

export function getCachedGuide(slug: string): Guide | null {
  const file = path.join(CACHE_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function setCachedGuide(guide: Guide): void {
  // Best-effort: caching speeds up a repeat query but must never break the
  // response if the runtime's temp dir is unavailable or full.
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(CACHE_DIR, `${slugify(guide.app)}.json`), JSON.stringify(guide, null, 2));
  } catch (err) {
    console.error("setCachedGuide failed (non-fatal):", err);
  }
}

export function getGuide(slug: string): Guide | null {
  return getLibraryGuide(slug) ?? getCachedGuide(slug);
}
