"use client";

import { useState } from "react";
import clsx from "clsx";
import { Copy, Check, Pencil, X, Save, Mail, Calendar } from "lucide-react";
import type { Email } from "@/lib/types";

const EMAIL_META: Record<
  string,
  { label: string; color: string; day?: string; description: string }
> = {
  cold: {
    label: "Cold Email",
    color: "text-accent bg-accent/10 border-accent/20",
    description: "Initial outreach",
  },
  followup_1: {
    label: "Follow-up 1",
    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    day: "Day 3",
    description: "Gentle bump + new insight",
  },
  followup_2: {
    label: "Follow-up 2",
    color: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    day: "Day 7",
    description: "Case study / social proof",
  },
  followup_3: {
    label: "Follow-up 3",
    color: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    day: "Day 14",
    description: "Break-up email",
  },
};

interface Props {
  email: Email;
  index: number;
}

export default function EmailCard({ email, index }: Props) {
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = EMAIL_META[email.type] ?? {
    label: email.type,
    color: "text-[#888] bg-[#222] border-[#333]",
    description: "",
  };

  const handleCopy = async () => {
    const text = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelEdit = () => {
    setSubject(email.subject);
    setBody(email.body);
    setIsEditing(false);
  };

  return (
    <div
      className={clsx(
        "rounded-xl border bg-[#141414] overflow-hidden transition-all duration-300 animate-fadeIn",
        "border-[#2A2A2A] hover:border-[#383838]"
      )}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#222]">
        <div className="flex items-center gap-2.5 min-w-0">
          <Mail className="h-3.5 w-3.5 text-[#555] shrink-0" />

          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
              meta.color
            )}
          >
            {meta.label}
          </span>

          {meta.day && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#555]">
              <Calendar className="h-3 w-3" />
              {meta.day}
            </span>
          )}

          {email.strategy && (
            <span className="hidden sm:inline text-[11px] text-[#555] truncate">
              · {email.strategy}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
              >
                <Save className="h-3 w-3" />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#888] hover:text-[#F0F0F0] hover:bg-[#222] transition-colors"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#888] hover:text-[#F0F0F0] hover:bg-[#222] transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={handleCopy}
                className={clsx(
                  "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                  copied
                    ? "bg-success/10 text-success border border-success/20"
                    : "text-[#888] hover:text-[#F0F0F0] hover:bg-[#222]"
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Subject */}
      <div className="px-5 py-3.5 border-b border-[#1E1E1E]">
        <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1.5">
          Subject
        </p>
        {isEditing ? (
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-[#F0F0F0] placeholder-[#555] outline-none focus:border-accent/50 transition-colors"
          />
        ) : (
          <p className="text-sm font-semibold text-[#F0F0F0] leading-relaxed">
            {subject}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-2">
          Body
        </p>
        {isEditing ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="w-full rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2.5 text-sm text-[#D0D0D0] leading-relaxed placeholder-[#555] outline-none focus:border-accent/50 transition-colors font-mono resize-y"
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-[#C8C8C8] leading-relaxed font-sans">
            {body}
          </pre>
        )}
      </div>
    </div>
  );
}
