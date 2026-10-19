import type { FrictionLevel } from "@/lib/types";

const CONFIG: Record<FrictionLevel, { label: string; color: string; bg: string }> = {
  instant: { label: "Instant", color: "var(--green)", bg: "rgba(52,211,153,0.12)" },
  review: { label: "Review required", color: "var(--amber)", bg: "rgba(251,191,36,0.12)" },
  "long-wait": { label: "Approval can take weeks", color: "var(--red)", bg: "rgba(248,113,113,0.14)" },
};

export default function FrictionBadge({ level }: { level: FrictionLevel }) {
  const c = CONFIG[level];
  return (
    <span
      style={{
        fontSize: 11,
        fontFamily: "IBM Plex Mono, monospace",
        padding: "4px 9px",
        borderRadius: 5,
        background: c.bg,
        color: c.color,
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}
