import type { Guide } from "./types";

export function guideToMarkdown(guide: Guide): string {
  const lines: string[] = [];
  const evidenceLabel = { tested: "Hands-on tested", "doc-sourced": "Doc-sourced", uncertain: "Uncertain" }[guide.evidence];

  lines.push(`# ${guide.app} OAuth App Setup`);
  lines.push("");
  lines.push(`> Evidence: ${evidenceLabel} · Friction: ${guide.frictionLevel}`);
  lines.push("");
  lines.push(guide.frictionSummary);
  lines.push("");

  lines.push("## Prerequisites");
  for (const p of guide.prerequisites) lines.push(`- ${p}`);
  lines.push("");

  lines.push("## Step-by-step");
  guide.steps.forEach((step, i) => {
    lines.push(`${i + 1}. **${step.title}** — ${step.body}`);
    if (step.codeSnippet) {
      lines.push("");
      lines.push("   ```");
      lines.push(step.codeSnippet.split("\n").map((l) => `   ${l}`).join("\n"));
      lines.push("   ```");
    }
  });
  lines.push("");

  lines.push("## Scopes");
  lines.push("| Scope | Grants |");
  lines.push("| --- | --- |");
  for (const s of guide.scopes) lines.push(`| \`${s.scope}\` | ${s.grants} |`);
  lines.push("");

  lines.push("## Approval process");
  lines.push(`**${guide.approval.required ? "Review required" : "No review required"}** — expected wait: ${guide.approval.expectedWait}`);
  lines.push("");
  lines.push(guide.approval.notes);
  lines.push("");

  lines.push("## Common blockers");
  for (const g of guide.gotchas) lines.push(`- ${g}`);
  lines.push("");

  lines.push("## Agent setup prompt");
  lines.push("");
  lines.push(`Context: Setting up OAuth for ${guide.app} in this codebase.`);
  lines.push("");
  lines.push("DO (safe for an agent to execute):");
  guide.agentPrompt.do.forEach((d, i) => lines.push(`${i + 1}. ${d}`));
  lines.push("");
  lines.push("DO NOT (requires the developer, not the agent):");
  for (const d of guide.agentPrompt.dont) lines.push(`- ${d}`);
  lines.push("");
  lines.push(`Env vars: ${guide.agentPrompt.envVars.join(", ")}`);
  lines.push(`Redirect URI to register: ${guide.agentPrompt.redirectUri}`);
  lines.push("");

  return lines.join("\n");
}
