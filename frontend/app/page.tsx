"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Search, Mail, RefreshCw, ArrowRight, Loader2 } from "lucide-react";
import clsx from "clsx";

const AGENT_CARDS = [
  {
    icon: <Search className="h-4 w-4" />,
    title: "Research Agent",
    desc: "Scans company info, recent news, and industry context",
    color: "text-violet-400",
    bg: "bg-violet-400/10 border-violet-400/20",
  },
  {
    icon: <Mail className="h-4 w-4" />,
    title: "Email Writer",
    desc: "Crafts a hyper-personalised cold email using the research",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
  },
  {
    icon: <RefreshCw className="h-4 w-4" />,
    title: "Follow-up Agent",
    desc: "Writes a 3-touch follow-up sequence (Days 3, 7, 14)",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
];

const EXAMPLE_COMPANIES = ["Stripe", "Notion", "Figma", "Linear", "Vercel"];
const EXAMPLE_ROLES = ["VP of Engineering", "Head of Sales", "CTO", "Head of Growth", "CEO"];

export default function HomePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: "",
    target_role: "",
    sender_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.company_name.trim()) e.company_name = "Company name is required";
    if (!form.target_role.trim()) e.target_role = "Target role is required";
    if (!form.sender_name.trim()) e.sender_name = "Your name is required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({
      company: form.company_name.trim(),
      role: form.target_role.trim(),
      name: form.sender_name.trim(),
    });
    router.push(`/results?${params.toString()}`);
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  return (
    <div className="min-h-[calc(100vh-56px)] grid-bg flex flex-col items-center justify-center px-4 py-16">
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[600px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Eyebrow */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Zap className="h-3 w-3" strokeWidth={2.5} />
            3 AI Agents · Powered by Gemini
          </span>
        </div>

        {/* Headline */}
        <h1 className="mb-3 text-center text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Cold emails that{" "}
          <span className="gradient-text">actually work</span>
        </h1>
        <p className="mb-10 text-center text-[#888] text-base leading-relaxed">
          Enter a company name and target role. Three AI agents research the company,
          write a cold email, and build a full follow-up sequence — in seconds.
        </p>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6 shadow-2xl"
        >
          <div className="space-y-4">
            {/* Company name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#888]">
                Company Name
              </label>
              <input
                type="text"
                placeholder={`e.g. ${EXAMPLE_COMPANIES[Math.floor(Math.random() * EXAMPLE_COMPANIES.length)]}`}
                value={form.company_name}
                onChange={(e) => handleChange("company_name", e.target.value)}
                className={clsx(
                  "w-full rounded-lg border bg-[#0F0F0F] px-4 py-2.5 text-sm text-[#F0F0F0] placeholder-[#444] outline-none transition-all",
                  errors.company_name
                    ? "border-error/60 focus:border-error"
                    : "border-[#2A2A2A] focus:border-accent/60"
                )}
              />
              {errors.company_name && (
                <p className="mt-1 text-xs text-error">{errors.company_name}</p>
              )}
            </div>

            {/* Target role */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#888]">
                Target Role
              </label>
              <input
                type="text"
                placeholder={`e.g. ${EXAMPLE_ROLES[Math.floor(Math.random() * EXAMPLE_ROLES.length)]}`}
                value={form.target_role}
                onChange={(e) => handleChange("target_role", e.target.value)}
                className={clsx(
                  "w-full rounded-lg border bg-[#0F0F0F] px-4 py-2.5 text-sm text-[#F0F0F0] placeholder-[#444] outline-none transition-all",
                  errors.target_role
                    ? "border-error/60 focus:border-error"
                    : "border-[#2A2A2A] focus:border-accent/60"
                )}
              />
              {errors.target_role && (
                <p className="mt-1 text-xs text-error">{errors.target_role}</p>
              )}
            </div>

            {/* Sender name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#888]">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Johnson"
                value={form.sender_name}
                onChange={(e) => handleChange("sender_name", e.target.value)}
                className={clsx(
                  "w-full rounded-lg border bg-[#0F0F0F] px-4 py-2.5 text-sm text-[#F0F0F0] placeholder-[#444] outline-none transition-all",
                  errors.sender_name
                    ? "border-error/60 focus:border-error"
                    : "border-[#2A2A2A] focus:border-accent/60"
                )}
              />
              {errors.sender_name && (
                <p className="mt-1 text-xs text-error">{errors.sender_name}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all",
                "bg-accent text-white hover:bg-accent-hover active:scale-[0.98]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "shadow-lg shadow-accent/20"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting agents…
                </>
              ) : (
                <>
                  Generate Campaign
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Agent cards */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {AGENT_CARDS.map((card) => (
            <div
              key={card.title}
              className={clsx(
                "rounded-xl border p-3 text-center",
                card.bg
              )}
            >
              <div className={clsx("mb-1.5 flex justify-center", card.color)}>
                {card.icon}
              </div>
              <p className={clsx("text-[11px] font-semibold", card.color)}>
                {card.title}
              </p>
              <p className="mt-1 text-[10px] text-[#666] leading-tight">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
