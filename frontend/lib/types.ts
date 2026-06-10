export type EmailType = "cold" | "followup_1" | "followup_2" | "followup_3";

export interface Email {
  type: EmailType;
  subject: string;
  body: string;
  send_day?: number;
  strategy?: string;
}

export interface ResearchData {
  summary: string;
  key_points: string[];
  recent_news: string;
  industry: string;
  pain_points: string;
  company_culture: string;
  tech_stack?: string;
}

export interface Campaign {
  id: string;
  company_name: string;
  target_role: string;
  sender_name: string;
  research_summary: string;
  research_data: ResearchData;
  emails: Email[];
  created_at: string;
}

export type AgentStatus = "idle" | "running" | "complete" | "error";

export interface AgentStates {
  research: AgentStatus;
  email_writer: AgentStatus;
  followup: AgentStatus;
}

export interface SSEEvent {
  event: "agent_start" | "agent_complete" | "complete" | "error";
  agent?: "research" | "email_writer" | "followup";
  message?: string;
  data?: unknown;
  campaign_id?: string;
  research?: ResearchData;
  emails?: Email[];
}
