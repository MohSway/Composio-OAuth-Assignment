"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GuideDetail from "./GuideDetail";
import type { Guide } from "@/lib/types";

export const SESSION_KEY_PREFIX = "authpilot:generated:";

export default function GeneratedGuideView({ slug }: { slug: string }) {
  const [guide, setGuide] = useState<Guide | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY_PREFIX + slug);
      setGuide(raw ? (JSON.parse(raw) as Guide) : null);
    } catch {
      setGuide(null);
    }
  }, [slug]);

  if (guide === undefined) return null;

  if (guide === null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 10px" }}>This guide isn&apos;t cached here</h1>
          <p style={{ color: "var(--text-mute)", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
            Live-generated guides are kept for this browser tab&apos;s session only, not shared across server
            instances. Head back to the library and search for it again — it&apos;ll only take a few seconds to
            re-generate.
          </p>
          <Link
            href="/"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "var(--bg)",
              display: "inline-block",
            }}
          >
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return <GuideDetail guide={guide} />;
}
