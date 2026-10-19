import fs from "node:fs";
import path from "node:path";
import type { Guide } from "./types";
import { slugify } from "./slug";

export { slugify };

const GUIDES_DIR = path.join(process.cwd(), "data", "guides");
const CACHE_DIR = path.join(process.cwd(), "data", "generated-cache");

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
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CACHE_DIR, `${slugify(guide.app)}.json`), JSON.stringify(guide, null, 2));
}

export function getGuide(slug: string): Guide | null {
  return getLibraryGuide(slug) ?? getCachedGuide(slug);
}
