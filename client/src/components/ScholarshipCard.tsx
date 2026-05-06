import { useState } from "react";
import { motion } from "framer-motion";
import { Scholarship, ScholarshipMatch } from "@shared/schema";
import { Calendar, Building2, GraduationCap, XCircle, Sparkles, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import MatchInsightsSheet from "./MatchInsightsSheet";

interface ScholarshipCardProps {
  scholarship: Scholarship | ScholarshipMatch;
  showMatchInfo?: boolean;
  onViewDetails?: (scholarship: Scholarship | ScholarshipMatch) => void;
  isSelected?: boolean;
}

type DeadlineStatus = "urgent" | "normal" | "expired" | "tba" | "rolling";

function getDeadlineInfo(deadline: string | null | undefined, deadlineType?: string | null): {
  status: DeadlineStatus;
  daysLeft: number | null;
  progressPct: number;
  barColor: string;
} {
  if (deadlineType === "TBA" || (!deadline && deadlineType !== "Rolling")) {
    return { status: "tba", daysLeft: null, progressPct: 100, barColor: "bg-gray-600" };
  }
  if (deadlineType === "Rolling") {
    return { status: "rolling", daysLeft: null, progressPct: 100, barColor: "bg-emerald-500" };
  }

  const deadlineDate = new Date(deadline!);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { status: "expired", daysLeft, progressPct: 0, barColor: "bg-gray-700" };
  }

  const MAX_DAYS = 90;
  const progressPct = Math.min(100, Math.max(2, (daysLeft / MAX_DAYS) * 100));

  let barColor: string;
  let status: DeadlineStatus;

  if (daysLeft <= 7) {
    barColor = "bg-red-500";
    status = "urgent";
  } else if (daysLeft <= 30) {
    barColor = "bg-amber-400";
    status = "urgent";
  } else {
    barColor = "bg-emerald-500";
    status = "normal";
  }

  return { status, daysLeft, progressPct, barColor };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isScholarshipMatch(s: Scholarship | ScholarshipMatch): s is ScholarshipMatch {
  return "match_score" in s && s.match_score !== undefined;
}

export default function ScholarshipCard({
  scholarship,
  showMatchInfo = false,
  onViewDetails,
  isSelected = false,
}: ScholarshipCardProps) {
  const [insightsOpen, setInsightsOpen] = useState(false);

  const { status, daysLeft, progressPct, barColor } = getDeadlineInfo(
    scholarship.deadline,
    scholarship.deadline_type
  );

  const isExpired = status === "expired";
  const isUrgent = status === "urgent";
  const isTBA = status === "tba";
  const isRolling = status === "rolling";
  const isEstimated = scholarship.deadline_type === "Estimated";

  const matchData = showMatchInfo && isScholarshipMatch(scholarship) ? scholarship : null;
  const matchScore = matchData?.match_score ?? 0;
  const isEligible = matchData?.is_eligible ?? true;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    onViewDetails?.(scholarship);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: isExpired ? 0.55 : 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ scale: 1.025, y: -2 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`relative flex flex-col h-full rounded-2xl overflow-hidden cursor-pointer
          bg-white/5 backdrop-blur-md
          border transition-all duration-200
          ${isSelected
            ? "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_0_24px_rgba(59,130,246,0.25)]"
            : matchData && showMatchInfo
              ? "border-blue-500/40 hover:border-blue-400/60 shadow-[0_0_20px_rgba(59,130,246,0.12)] hover:shadow-[0_0_28px_rgba(59,130,246,0.25)]"
              : "border-white/8 hover:border-white/20"
          }
        `}
        data-testid={`card-scholarship-${scholarship.id}`}
        onClick={handleCardClick}
      >
        {/* AI Match badge — top right */}
        {matchData && isEligible && (
          <div
            className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-semibold"
            data-testid={`text-match-score-${scholarship.id}`}
          >
            <Sparkles className="w-3 h-3" />
            {matchScore.toFixed(0)}% Match
          </div>
        )}
        {matchData && !isEligible && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            Not Eligible
          </div>
        )}

        <div className="p-5 flex-1 flex flex-col">
          {/* Match insights button */}
          {matchData && (
            <div className="mb-3 pb-3 border-b border-white/8 flex justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInsightsOpen(true)}
                    className="text-gray-400 hover:text-white hover:bg-white/10 h-7 text-xs"
                    data-testid={`button-view-details-${scholarship.id}`}
                  >
                    <Info className="w-3 h-3 mr-1" />
                    View Breakdown
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <span className="text-xs">Detailed match analysis</span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Title + education level */}
          <div className="flex justify-between items-start gap-3 mb-3">
            <h3
              className="text-base font-bold text-white leading-snug flex-1 pr-2"
              data-testid={`text-title-${scholarship.id}`}
              style={matchData ? { paddingRight: "80px" } : {}}
            >
              {scholarship.title}
            </h3>
          </div>

          <div className="space-y-2.5 flex-1">
            {/* Education level */}
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span
                className="text-xs text-gray-400"
                data-testid={`badge-education-${scholarship.id}`}
              >
                {scholarship.education_level && scholarship.education_level.length > 0
                  ? scholarship.education_level.length <= 2
                    ? scholarship.education_level.join(", ")
                    : `${scholarship.education_level.slice(0, 2).join(", ")}…`
                  : "All Levels"}
              </span>
            </div>

            {/* Provider */}
            <div className="flex items-center text-gray-400">
              <Building2 className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span className="text-xs" data-testid={`text-provider-${scholarship.id}`}>
                {scholarship.provider}
              </span>
            </div>

            {/* Amount */}
            <div>
              <span
                className="text-lg font-bold"
                style={{ color: "#16a34a" }}
                data-testid={`text-amount-${scholarship.id}`}
              >
                {scholarship.amount}
              </span>
            </div>

            {/* Deadline */}
            <div className="flex items-center flex-wrap gap-1.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
              {isTBA ? (
                <span className="text-xs text-gray-500" data-testid={`text-deadline-${scholarship.id}`}>
                  Deadline: TBA
                </span>
              ) : isRolling ? (
                <span className="text-xs text-emerald-400 font-medium" data-testid={`text-deadline-${scholarship.id}`}>
                  Rolling Admission
                </span>
              ) : (
                <span
                  className={`text-xs font-medium ${
                    isExpired
                      ? "text-gray-500 line-through"
                      : daysLeft !== null && daysLeft <= 7
                      ? "text-red-400"
                      : daysLeft !== null && daysLeft <= 30
                      ? "text-amber-400"
                      : "text-gray-300"
                  }`}
                  data-testid={`text-deadline-${scholarship.id}`}
                >
                  {isExpired ? "Expired: " : "Closes: "}
                  {formatDate(scholarship.deadline!)}
                  {isEstimated && " (Est.)"}
                </span>
              )}
              {isUrgent && !isExpired && daysLeft !== null && daysLeft <= 7 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-red-500/20 text-red-300 border-red-500/40 h-4">
                  Urgent
                </Badge>
              )}
              {isExpired && (
                <Badge className="text-[10px] px-1.5 py-0 bg-white/5 text-gray-500 border-white/10 h-4">
                  Closed
                </Badge>
              )}
              {isRolling && (
                <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 h-4">
                  Rolling
                </Badge>
              )}
            </div>

            {/* Tags */}
            {scholarship.tags && scholarship.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1" data-testid={`tags-${scholarship.id}`}>
                {scholarship.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/6 text-gray-400 border border-white/8"
                  >
                    {tag}
                  </span>
                ))}
                {scholarship.tags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] text-gray-600">
                    +{scholarship.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View details hint */}
        <div
          className="px-5 py-2.5 flex items-center justify-between text-xs text-gray-600 hover:text-gray-400 transition-colors border-t border-white/5"
          data-testid={`hint-view-details-${scholarship.id}`}
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>

        {/* Progress bar — bottom */}
        <div className="h-1 w-full bg-white/5">
          {!isTBA && (
            <motion.div
              className={`h-full ${barColor} rounded-r-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              data-testid={`progress-bar-${scholarship.id}`}
            />
          )}
          {isRolling && (
            <div className="h-full w-full bg-emerald-500/60" />
          )}
        </div>
      </motion.div>

      {matchData && (
        <MatchInsightsSheet
          scholarship={matchData}
          isOpen={insightsOpen}
          onClose={() => setInsightsOpen(false)}
        />
      )}
    </>
  );
}
