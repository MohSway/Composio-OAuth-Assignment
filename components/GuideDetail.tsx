"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FrictionBadge from "./FrictionBadge";
import CopyButton from "./CopyButton";
import { guideToMarkdown } from "@/lib/markdown";
import type { Guide } from "@/lib/types";

const SECTIONS = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "steps", label: "Step-by-step" },
  { id: "scopes", label: "Scopes" },
  { id: "approval", label: "Approval process" },
  { id: "gotchas", label: "Common blockers" },
];

const EVIDENCE_CONFIG: Record<Guide["evidence"], { label: string; icon: string }> = {
  tested: { label: "Hands-on tested", icon: "var(--green)" },
  "doc-sourced": { label: "Doc-sourced", icon: "var(--text-mute)" },
  uncertain: { label: "Uncertain", icon: "var(--amber)" },
};

function initials(app: string): string {
  const words = app.replace("/", " ").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function downloadMarkdown(guide: Guide) {
  const md = guideToMarkdown(guide);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${guide.app.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-oauth-setup.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function agentPromptText(guide: Guide): string {
  return [
    `Context: Setting up OAuth for ${guide.app} in this codebase.`,
    "",
    "DO (safe for an agent to execute):",
    ...guide.agentPrompt.do.map((d, i) => `${i + 1}. ${d}`),
    "",
    "DO NOT (requires the developer, not the agent):",
    ...guide.agentPrompt.dont.map((d) => `- ${d}`),
    "",
    `Env vars: ${guide.agentPrompt.envVars.join(", ")}`,
    `Redirect URI to register once you have a URL:`,
    guide.agentPrompt.redirectUri,
  ].join("\n");
}

export default function GuideDetail({ guide }: { guide: Guide }) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const evidence = EVIDENCE_CONFIG[guide.evidence];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 48px",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "var(--bg)",
          zIndex: 10,
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <Link
            href="/"
            className="icon-btn"
            style={{
              fontSize: 13,
              color: "var(--text-mute)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px 6px 8px",
              marginLeft: -8,
              borderRadius: 7,
              border: "1px solid transparent",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Library
          </Link>
          <span style={{ color: "var(--border-strong)" }}>/</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "#1a1e28",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 11,
                color: "var(--text-mute)",
              }}
            >
              {initials(guide.app)}
            </div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{guide.app}</span>
          </div>
          <FrictionBadge level={guide.frictionLevel} />
          <span
            style={{
              fontSize: 11,
              fontFamily: "IBM Plex Mono, monospace",
              padding: "4px 9px",
              borderRadius: 5,
              border: "1px solid var(--border-strong)",
              color: "var(--text-mute)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {guide.evidence === "tested" && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={3}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {evidence.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => downloadMarkdown(guide)}
            className="btn"
            style={{
              fontSize: 13,
              fontWeight: 500,
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid var(--border-strong)",
              background: "transparent",
              color: "var(--text-dim)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download guide (.md)
          </button>
          <button
            type="button"
            onClick={() => setPromptOpen((v) => !v)}
            className="btn-primary"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "var(--bg)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth={2}>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy agent prompt
          </button>
        </div>
      </div>

      {promptOpen && (
        <div style={{ borderBottom: "1px solid var(--border-strong)", background: "var(--bg-raised)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "22px 48px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Agent setup prompt</div>
                <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                  Paste into Claude Code, Cursor, or Copilot Chat
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <CopyButton text={agentPromptText(guide)} label="Copy all" />
                <button
                  type="button"
                  onClick={() => setPromptOpen(false)}
                  aria-label="Close agent prompt panel"
                  className="icon-btn"
                  style={{
                    width: 29,
                    height: 29,
                    borderRadius: 7,
                    border: "1px solid var(--border-strong)",
                    background: "transparent",
                    color: "var(--text-mute)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <pre
              style={{
                margin: 0,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "18px 20px",
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 12.5,
                lineHeight: 1.7,
                color: "#c7cbd4",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {agentPromptText(guide)}
            </pre>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 40,
          maxWidth: 1320,
          margin: "0 auto",
          width: "100%",
          padding: "40px 48px 96px",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: "999 1 640px", minWidth: 0, order: 1 }}>
          <h1 style={{ fontSize: 30, fontWeight: 600, margin: "0 0 10px", letterSpacing: "-0.4px" }}>
            {guide.app} OAuth App Setup
          </h1>
          <p style={{ color: "var(--text-mute)", fontSize: 15, lineHeight: 1.6, margin: "0 0 40px" }}>
            {guide.frictionSummary}
          </p>

          <h2 id="prerequisites" style={{ fontSize: 18, fontWeight: 600, margin: "0 0 14px" }}>
            Prerequisites
          </h2>
          <ul style={{ margin: "0 0 40px", paddingLeft: 20, color: "var(--text-dim)", fontSize: 14, lineHeight: 1.9 }}>
            {guide.prerequisites.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>

          <h2 id="steps" style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>
            Step-by-step
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, marginBottom: 40 }}>
            {guide.steps.map((step, i) => (
              <div key={step.title} style={{ display: "flex", gap: 14 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#1a1e28",
                    color: "var(--text-mute)",
                    fontSize: 12,
                    fontFamily: "IBM Plex Mono, monospace",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ width: "100%" }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ color: "var(--text-mute)", fontSize: 13.5, lineHeight: 1.6, marginBottom: step.codeSnippet ? 10 : 0 }}>
                    {step.body}
                  </div>
                  {step.codeSnippet && (
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <CopyButton text={step.codeSnippet} small />
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          background: "var(--bg-raised)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: "16px 18px",
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: 12.5,
                          lineHeight: 1.7,
                          color: "#c7cbd4",
                          overflowX: "auto",
                        }}
                      >
                        {step.codeSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h2 id="scopes" style={{ fontSize: 18, fontWeight: 600, margin: "0 0 14px" }}>
            Scopes
          </h2>
          <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 40 }}>
            <table>
              <thead>
                <tr>
                  <th className="mono">Scope</th>
                  <th>Grants</th>
                </tr>
              </thead>
              <tbody>
                {guide.scopes.map((s) => (
                  <tr key={s.scope}>
                    <td className="mono">{s.scope}</td>
                    <td>{s.grants}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 id="approval" style={{ fontSize: 18, fontWeight: 600, margin: "0 0 14px" }}>
            Approval process
          </h2>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "18px 20px",
              marginBottom: 40,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "IBM Plex Mono, monospace",
                  padding: "4px 9px",
                  borderRadius: 5,
                  background: guide.approval.required ? "rgba(251,191,36,0.12)" : "rgba(52,211,153,0.12)",
                  color: guide.approval.required ? "var(--amber)" : "var(--green)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {guide.approval.required ? "Review required" : "No review required"}
              </span>
              {guide.approval.required && (
                <span style={{ fontSize: 12.5, color: "var(--text-faint)", fontFamily: "IBM Plex Mono, monospace" }}>
                  Expected wait: {guide.approval.expectedWait}
                </span>
              )}
            </div>
            <p style={{ margin: 0, color: "var(--text-mute)", fontSize: 13.5, lineHeight: 1.6 }}>{guide.approval.notes}</p>
          </div>

          <h2 id="gotchas" style={{ fontSize: 18, fontWeight: 600, margin: "0 0 14px" }}>
            Common blockers
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-dim)", fontSize: 14, lineHeight: 1.9 }}>
            {guide.gotchas.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>

        <div style={{ flex: "1 1 220px", minWidth: 200, order: 2, position: "sticky", top: 96, alignSelf: "flex-start" }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "IBM Plex Mono, monospace",
              color: "var(--text-faint)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}
          >
            On this page
          </div>
          <nav aria-label="Guide sections" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {SECTIONS.map((s) => {
              const active = s.id === activeSection;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="toc-link"
                  style={{
                    fontSize: 13.5,
                    color: active ? "var(--text-dim)" : "var(--text-mute)",
                    padding: "7px 10px",
                    borderRadius: 7,
                    borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                  }}
                >
                  {s.label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
