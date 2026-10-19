"use client";

type Phase = "search" | "read" | "write";

const STEPS: { phase: Phase; label: string }[] = [
  { phase: "search", label: "Searching for developer docs" },
  { phase: "read", label: "Reading real documentation" },
  { phase: "write", label: "Writing the guide" },
];

const ORDER: Record<Phase, number> = { search: 0, read: 1, write: 2 };

function StepIcon({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") {
    return (
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "var(--green)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth={3}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (state === "active") {
    return (
      <span
        className="spin"
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "2px solid var(--border-strong)",
          borderTopColor: "var(--accent)",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: "2px solid var(--border-strong)",
        flexShrink: 0,
      }}
    />
  );
}

export default function GeneratingModal({
  appName,
  phase,
  message,
  error,
  onClose,
}: {
  appName: string;
  phase: Phase;
  message: string;
  error: string | null;
  onClose: () => void;
}) {
  const currentIndex = ORDER[phase];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Investigating ${appName}`}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5, 7, 11, 0.72)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 24,
      }}
    >
      <div
        className="fade-in-up"
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--card)",
          border: "1px solid var(--border-strong)",
          borderRadius: 16,
          padding: "32px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {!error ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  flexShrink: 0,
                  animation: "pulse 1.2s ease-in-out infinite",
                }}
              />
              <div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 14, color: "var(--text)" }}>
                  Investigating {appName}…
                </div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{message}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {STEPS.map((s, i) => (
                <div key={s.phase} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <StepIcon state={i < currentIndex ? "done" : i === currentIndex ? "active" : "pending"} />
                  <span
                    style={{
                      fontSize: 13.5,
                      color: i <= currentIndex ? "var(--text-dim)" : "var(--text-faint)",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 24,
                height: 3,
                borderRadius: 2,
                background: "var(--border)",
                overflow: "hidden",
              }}
            >
              <div className="progress-sweep" style={{ height: "100%", width: "40%", background: "var(--accent)", borderRadius: 2 }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: "var(--red)" }}>
              Couldn&apos;t generate this guide
            </div>
            <p style={{ color: "var(--text-mute)", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 20px" }}>{error}</p>
            <button
              type="button"
              onClick={onClose}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 16px",
                borderRadius: 8,
                border: "1px solid var(--border-strong)",
                background: "transparent",
                color: "var(--text-dim)",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.2s ease-out; }
        @keyframes sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
        .progress-sweep { animation: sweep 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
