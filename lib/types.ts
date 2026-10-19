export type FrictionLevel = "instant" | "review" | "long-wait";
export type Evidence = "tested" | "doc-sourced" | "uncertain";

export interface GuideStep {
  title: string;
  body: string;
  codeSnippet?: string;
}

export interface GuideScope {
  scope: string;
  grants: string;
}

export interface GuideApproval {
  required: boolean;
  expectedWait: string;
  notes: string;
}

export interface AgentPrompt {
  do: string[];
  dont: string[];
  envVars: string[];
  redirectUri: string;
}

export interface Guide {
  app: string;
  frictionSummary: string;
  frictionLevel: FrictionLevel;
  prerequisites: string[];
  steps: GuideStep[];
  scopes: GuideScope[];
  approval: GuideApproval;
  gotchas: string[];
  agentPrompt: AgentPrompt;
  evidence: Evidence;
}
