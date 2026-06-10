"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Building2,
  Clock,
  Plus,
  Loader2,
  Mail,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import EmailCard from "@/components/EmailCard";
import { deleteCampaign, getCampaigns } from "@/lib/api";
import type { Campaign } from "@/lib/types";

export default function HistoryPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getCampaigns()
      .then((res) => {
        setCampaigns(res.data ?? []);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load campaigns");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Failed to delete campaign");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-[#555]">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading campaigns…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F0F0]">Campaign History</h1>
          <p className="mt-1 text-sm text-[#666]">
            {campaigns.length} saved campaign{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-5 py-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
          <p className="text-sm text-[#C0C0C0]">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!error && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A2A2A] py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1A1A] border border-[#2A2A2A]">
            <Mail className="h-5 w-5 text-[#555]" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-[#F0F0F0]">
            No campaigns yet
          </h3>
          <p className="mb-5 text-xs text-[#666] max-w-xs">
            Generate your first AI-powered sales campaign to see it here.
          </p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create first campaign
          </button>
        </div>
      )}

      {/* Campaign list */}
      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const isExpanded = expandedId === campaign.id;
          const emails = Array.isArray(campaign.emails) ? campaign.emails : [];
          const dateStr = campaign.created_at
            ? format(new Date(campaign.created_at), "MMM d, yyyy · h:mm a")
            : "Unknown date";

          return (
            <div
              key={campaign.id}
              className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414] transition-all"
            >
              {/* Campaign row */}
              <button
                onClick={() => toggleExpand(campaign.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#1A1A1A] transition-colors"
              >
                {/* Company icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                  <Building2 className="h-4 w-4 text-accent" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-semibold text-[#F0F0F0] truncate">
                      {campaign.company_name}
                    </p>
                    <span className="text-[11px] text-[#555] shrink-0">
                      · {campaign.target_role}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-[#555]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {dateStr}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {emails.length} email{emails.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDelete(campaign.id, e)}
                    disabled={deletingId === campaign.id}
                    className={clsx(
                      "rounded-md p-1.5 text-[#555] hover:text-error hover:bg-error/10 transition-colors",
                      deletingId === campaign.id && "opacity-50 cursor-not-allowed"
                    )}
                    title="Delete campaign"
                  >
                    {deletingId === campaign.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#555]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#555]" />
                  )}
                </div>
              </button>

              {/* Expanded: email cards */}
              {isExpanded && (
                <div className="border-t border-[#1E1E1E] px-5 py-5 space-y-4 animate-fadeIn">
                  {/* Research summary */}
                  {campaign.research_summary && (
                    <div className="rounded-lg border border-[#222] bg-[#0F0F0F] p-4 mb-4">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                        Research Summary
                      </p>
                      <p className="text-sm text-[#A0A0A0] leading-relaxed line-clamp-4">
                        {campaign.research_summary}
                      </p>
                    </div>
                  )}

                  {emails.length > 0 ? (
                    emails.map((email, i) => (
                      <EmailCard key={`${email.type}-${i}`} email={email} index={i} />
                    ))
                  ) : (
                    <p className="text-sm text-[#555]">No emails found in this campaign.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
