"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Tag,
  Newspaper,
} from "lucide-react";
import clsx from "clsx";
import AgentProgress from "@/components/AgentProgress";
import EmailCard from "@/components/EmailCard";
import { generateCampaign } from "@/lib/api";
import type { AgentStates, Email, ResearchData, SSEEvent } from "@/lib/types";

const IDLE_STATES: AgentStates = {
  research: "idle",
  email_writer: "idle",
  followup: "idle",
};

function ResultsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const company = params.get("company") ?? "";
  const role = params.get("role") ?? "";
  const name = params.get("name") ?? "";

  const [agentStates, setAgentStates] = useState<AgentStates>(IDLE_STATES);
  const [agentMessages, setAgentMessages] = useState<
    Partial<Record<keyof AgentStates, string>>
  >({});
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResearch, setShowResearch] = useState(false);
  const hasStarted = useRef(false);

  const handleEvent = useCallback((event: SSEEvent) => {
    if (event.event === "agent_start" && event.agent) {
      setAgentStates((prev) => ({ ...prev, [event.agent!]: "running" }));
      if (event.message) {
        setAgentMessages((prev) => ({ ...prev, [event.agent!]: event.message }));
      }
    }

    if (event.event === "agent_complete" && event.agent) {
      setAgentStates((prev) => ({ ...prev, [event.agent!]: "complete" }));

      if (event.agent === "research" && event.data) {
        setResearch(event.data as ResearchData);
      }

      if (event.agent === "email_writer" && event.data) {
        const d = event.data as { subject: string; body: string };
        setEmails([{ type: "cold", subject: d.subject, body: d.body }]);
      }

      if (event.agent === "followup" && event.data) {
        const fus = event.data as Array<{
          subject: string;
          body: string;
          send_day?: number;
          strategy?: string;
        }>;
        setEmails((prev) => [
          ...prev,
          ...fus.map((f, i) => ({
            type: `followup_${i + 1}` as Email["type"],
            subject: f.subject,
            body: f.body,
            send_day: f.send_day,
            strategy: f.strategy,
          })),
        ]);
      }
    }

    if (event.event === "complete") {
      setIsLoading(false);
      if (event.research) setResearch(event.research);
      if (event.emails) setEmails(event.emails);
    }

    if (event.event === "error") {
      setError(event.message ?? "An unknown error occurred");
      setIsLoading(false);
      setAgentStates((prev) => {
        const next = { ...prev };
        (Object.keys(next) as (keyof AgentStates)[]).forEach((k) => {
          if (next[k] === "running") next[k] = "error";
        });
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (!company || !role || !name || hasStarted.current) return;
    hasStarted.current = true;

    generateCampaign(
      { company_name: company, target_role: role, sender_name: name },
      handleEvent
    ).catch((err) => {
      setError(err.message ?? "Failed to connect to the server");
      setIsLoading(false);
    });
  }, [company, role, name, handleEvent]);

  if (!company || !role || !name) {
    router.replace("/");
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Back nav */}
      <button
        onClick={() => router.push("/")}
        className="mb-6 flex items-center gap-1.5 text-sm text-[#666] hover:text-[#F0F0F0] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        New campaign
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F0F0F0]">
          {company}
          <span className="ml-2 text-base font-normal text-[#666]">· {role}</span>
        </h1>
        <p className="mt-1 text-sm text-[#666]">From: {name}</p>
      </div>

      {/* Agent progress */}
      <section className="mb-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#555]">
          Agent Pipeline
        </p>
        <AgentProgress states={agentStates} messages={agentMessages} />

        {isLoading && (
          <p className="mt-4 text-xs text-[#555] animate-pulseRing">
            Agents are running — this usually takes 20–40 seconds…
          </p>
        )}
      </section>

      {/* Error state */}
      {error && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-5 py-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
          <div>
            <p className="text-sm font-semibold text-error">Generation failed</p>
            <p className="mt-0.5 text-xs text-[#888]">{error}</p>
          </div>
        </div>
      )}

      {/* Research summary */}
      {research && (
        <section className="mb-8 animate-fadeIn">
          <button
            onClick={() => setShowResearch((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-[#2A2A2A] bg-[#141414] px-5 py-4 text-left transition-colors hover:border-[#383838]"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-4 w-4 text-[#555]" />
              <span className="text-sm font-semibold text-[#F0F0F0]">
                Research Summary
              </span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                {research.industry}
              </span>
            </div>
            {showResearch ? (
              <ChevronUp className="h-4 w-4 text-[#555]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#555]" />
            )}
          </button>

          {showResearch && (
            <div className="mt-1 rounded-xl border border-[#2A2A2A] bg-[#141414] px-5 py-5 space-y-5 animate-fadeIn">
              {/* Summary */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                  Overview
                </p>
                <p className="text-sm text-[#C0C0C0] leading-relaxed">{research.summary}</p>
              </div>

              {/* Key points */}
              {research.key_points?.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                    Key Facts
                  </p>
                  <ul className="space-y-1.5">
                    {research.key_points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#C0C0C0]">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent news */}
              {research.recent_news && (
                <div className="flex items-start gap-3 rounded-lg border border-[#222] bg-[#0F0F0F] p-4">
                  <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-[#555]" />
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                      Recent News
                    </p>
                    <p className="text-sm text-[#C0C0C0] leading-relaxed">
                      {research.recent_news}
                    </p>
                  </div>
                </div>
              )}

              {/* Pain points */}
              {research.pain_points && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                    <Tag className="h-3 w-3" />
                    Pain Points
                  </p>
                  <p className="text-sm text-[#C0C0C0] leading-relaxed">
                    {research.pain_points}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Email cards skeleton while loading */}
      {isLoading && emails.length === 0 && (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-xl border border-[#1E1E1E] shimmer"
            />
          ))}
        </div>
      )}

      {/* Generated emails */}
      {emails.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#555]">
              Generated Emails
              <span className="ml-2 rounded-full bg-[#1E1E1E] px-2 py-0.5 text-[#888] normal-case">
                {emails.length} of 4
              </span>
            </p>
            {!isLoading && (
              <span className="text-xs text-success animate-fadeIn">
                ✓ All emails ready · Click Edit to customise
              </span>
            )}
          </div>

          <div className="space-y-4">
            {emails.map((email, i) => (
              <EmailCard key={`${email.type}-${i}`} email={email} index={i} />
            ))}
          </div>

          {/* Skeleton for remaining emails while loading */}
          {isLoading &&
            [...Array(Math.max(0, 4 - emails.length))].map((_, i) => (
              <div
                key={`skel-${i}`}
                className="mt-4 h-40 rounded-xl border border-[#1E1E1E] shimmer"
              />
            ))}
        </section>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-[#555]">
          Loading…
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
