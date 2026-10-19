"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "Copy", small = false }: { text: string; label?: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable; nothing more we can do here
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      style={
        small
          ? {
              fontSize: 11,
              fontFamily: "IBM Plex Mono, monospace",
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid var(--border-strong)",
              background: "var(--card)",
              color: "var(--text-mute)",
              cursor: "pointer",
            }
          : {
              fontSize: 12,
              fontWeight: 600,
              padding: "7px 13px",
              borderRadius: 7,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "var(--bg)",
              cursor: "pointer",
            }
      }
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
