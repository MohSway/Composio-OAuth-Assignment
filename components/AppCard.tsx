import Link from "next/link";
import FrictionBadge from "./FrictionBadge";
import { slugify } from "@/lib/slug";
import type { Guide } from "@/lib/types";

function initials(app: string): string {
  const words = app.replace("/", " ").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function AppCard({ guide }: { guide: Guide }) {
  return (
    <div
      className="card"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#1a1e28",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 12,
              color: "var(--text-mute)",
            }}
          >
            {initials(guide.app)}
          </div>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{guide.app}</span>
        </div>
        <FrictionBadge level={guide.frictionLevel} />
      </div>
      <p style={{ margin: 0, color: "var(--text-mute)", fontSize: 13, lineHeight: 1.5, minHeight: 40 }}>
        {guide.frictionSummary}
      </p>
      <Link href={`/guide/${slugify(guide.app)}`} style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
        View guide →
      </Link>
    </div>
  );
}
