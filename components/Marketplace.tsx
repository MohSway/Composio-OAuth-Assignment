"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppCard from "./AppCard";
import { SESSION_KEY_PREFIX } from "./GeneratedGuideView";
import { slugify } from "@/lib/slug";
import type { FrictionLevel, Guide } from "@/lib/types";

const FILTERS: { label: string; value: FrictionLevel | "all" }[] = [
  { label: "All", value: "all" },
  { label: "No review needed", value: "instant" },
  { label: "Review required", value: "review" },
  { label: "Approval can take weeks", value: "long-wait" },
];

export default function Marketplace({ guides }: { guides: Guide[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FrictionLevel | "all">("all");
  const [investigating, setInvestigating] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const appNames = useMemo(() => guides.map((g) => g.app), [guides]);
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return appNames.filter((a) => a.toLowerCase().includes(q)).slice(0, 5);
  }, [query, appNames]);

  const filtered = useMemo(
    () => (filter === "all" ? guides : guides.filter((g) => g.frictionLevel === filter)),
    [guides, filter]
  );

  async function startGeneration(appQuery: string) {
    setError("");
    setInvestigating(appQuery);
    setStatus(`Investigating ${appQuery}...`);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: appQuery }),
      });
      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line);
          if (evt.type === "status") setStatus(evt.message);
          if (evt.type === "error") {
            setError(evt.message);
            setInvestigating(null);
          }
          if (evt.type === "done") {
            const guideSlug = slugify(evt.data.app);
            try {
              sessionStorage.setItem(SESSION_KEY_PREFIX + guideSlug, JSON.stringify(evt.data));
            } catch {
              // sessionStorage unavailable (private mode, etc) — guide page
              // will offer to regenerate instead.
            }
            router.push(`/guide/${guideSlug}`);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setInvestigating(null);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const match = guides.find((g) => g.app.toLowerCase() === q.toLowerCase());
    if (match) {
      router.push(`/guide/${slugify(match.app)}`);
      return;
    }
    startGeneration(q);
  }

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 48px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "IBM Plex Mono, monospace",
              fontWeight: 600,
              fontSize: 13,
              color: "var(--bg)",
            }}
          >
            A
          </div>
          <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.2px" }}>AuthPilot</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 14, color: "var(--text-mute)" }}>
          <span
            style={{
              color: "var(--text-faint)",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 12,
              border: "1px solid var(--border-strong)",
              padding: "4px 10px",
              borderRadius: 6,
            }}
          >
            {guides.length} providers
          </span>
        </div>
      </div>

      <div style={{ padding: "72px 48px 36px", maxWidth: 880, margin: "0 auto", width: "100%", textAlign: "center" }}>
        <h1 style={{ fontSize: 38, lineHeight: 1.15, margin: "0 0 14px", fontWeight: 600, letterSpacing: "-0.5px" }}>
          Set up OAuth, without the guesswork
        </h1>
        <p style={{ color: "var(--text-mute)", fontSize: 16, margin: "0 0 32px", lineHeight: 1.5 }}>
          Look up a provider&apos;s guide, or point the agent at one we don&apos;t have yet.
        </p>

        <form onSubmit={onSubmit} style={{ position: "relative", maxWidth: 620, margin: "0 auto" }}>
          <svg
            style={{ position: "absolute", left: 16, top: 16, width: 18, height: 18, pointerEvents: "none" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-faint)"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search an app, or paste a website…"
            aria-label="Search for an app or paste a website"
            style={{
              width: "100%",
              background: "var(--card)",
              border: "1px solid var(--border-strong)",
              borderRadius: 10,
              padding: "15px 16px 15px 46px",
              fontSize: 15,
              color: "var(--text)",
              fontFamily: "IBM Plex Sans, sans-serif",
            }}
          />
          {suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: "var(--card)",
                border: "1px solid var(--border-strong)",
                borderRadius: 10,
                overflow: "hidden",
                textAlign: "left",
                zIndex: 5,
              }}
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => router.push(`/guide/${slugify(s)}`)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-dim)",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", padding: "0 48px 40px", flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            style={{
              fontSize: 13,
              fontFamily: "IBM Plex Mono, monospace",
              padding: "7px 14px",
              borderRadius: 999,
              border: `1px solid ${filter === f.value ? "var(--accent)" : "var(--border-strong)"}`,
              background: filter === f.value ? "rgba(91,141,239,0.14)" : "transparent",
              color: filter === f.value ? "var(--accent)" : "var(--text-mute)",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          width: "100%",
          padding: "0 48px 56px",
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((g) => (
          <AppCard key={g.app} guide={g} />
        ))}
      </div>

      {investigating && (
        <div style={{ maxWidth: 1180, margin: "0 auto 72px", width: "100%", padding: "0 48px" }}>
          <div
            style={{
              border: "1px dashed #2b3142",
              borderRadius: 12,
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "var(--bg-raised)",
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "var(--accent)",
                flexShrink: 0,
                animation: "pulse 1.2s ease-in-out infinite",
              }}
            />
            <div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "var(--text)" }}>
                Investigating {investigating}…
              </div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 3 }}>{status}</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ maxWidth: 1180, margin: "0 auto 72px", width: "100%", padding: "0 48px" }}>
          <div
            style={{
              border: "1px solid var(--red)",
              borderRadius: 12,
              padding: "18px 22px",
              color: "var(--red)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
