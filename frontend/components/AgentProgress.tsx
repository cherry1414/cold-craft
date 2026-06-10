"use client";

import clsx from "clsx";
import { CheckCircle2, Loader2, Search, Mail, RefreshCw, Circle } from "lucide-react";
import type { AgentStatus } from "@/lib/types";

interface Agent {
  key: "research" | "email_writer" | "followup";
  label: string;
  description: string;
  icon: React.ReactNode;
}

const AGENTS: Agent[] = [
  {
    key: "research",
    label: "Research Agent",
    description: "Searches company info & recent news",
    icon: <Search className="h-4 w-4" />,
  },
  {
    key: "email_writer",
    label: "Email Writer",
    description: "Writes a personalised cold email",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    key: "followup",
    label: "Follow-up Agent",
    description: "Generates a 3-email follow-up sequence",
    icon: <RefreshCw className="h-4 w-4" />,
  },
];

interface Props {
  states: { research: AgentStatus; email_writer: AgentStatus; followup: AgentStatus };
  messages: { research?: string; email_writer?: string; followup?: string };
}

export default function AgentProgress({ states, messages }: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
      {AGENTS.map((agent, i) => {
        const status = states[agent.key];
        const message = messages[agent.key];
        const isLast = i === AGENTS.length - 1;

        return (
          <div key={agent.key} className="flex items-center gap-0 w-full sm:w-auto">
            {/* Agent card */}
            <div
              className={clsx(
                "flex items-start gap-3 rounded-xl border p-4 transition-all duration-500",
                "w-full sm:w-48 md:w-52",
                status === "idle" && "border-[#2A2A2A] bg-[#141414] opacity-50",
                status === "running" && "border-accent/40 bg-accent/5 shadow-lg shadow-accent/10",
                status === "complete" && "border-success/30 bg-success/5",
                status === "error" && "border-error/30 bg-error/5"
              )}
            >
              {/* Status icon */}
              <div className="mt-0.5 shrink-0">
                {status === "idle" && (
                  <Circle className="h-4 w-4 text-[#444]" />
                )}
                {status === "running" && (
                  <Loader2 className="h-4 w-4 text-accent animate-spin" />
                )}
                {status === "complete" && (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
                {status === "error" && (
                  <div className="h-4 w-4 rounded-full border-2 border-error flex items-center justify-center">
                    <span className="text-[8px] text-error font-bold">!</span>
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="min-w-0">
                <p
                  className={clsx(
                    "text-xs font-semibold truncate",
                    status === "idle" && "text-[#555]",
                    status === "running" && "text-accent",
                    status === "complete" && "text-success",
                    status === "error" && "text-error"
                  )}
                >
                  {agent.label}
                </p>
                <p className="text-[11px] text-[#666] mt-0.5 leading-tight">
                  {status === "running" && message
                    ? message
                    : agent.description}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="hidden sm:block h-px w-6 md:w-8 shrink-0 mx-1">
                <div
                  className={clsx(
                    "h-px w-full transition-all duration-700",
                    states[AGENTS[i + 1].key] !== "idle"
                      ? "bg-accent/40"
                      : "bg-[#2A2A2A]"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
