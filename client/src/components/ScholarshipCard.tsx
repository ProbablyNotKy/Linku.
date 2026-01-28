import { useState } from "react";
import { Scholarship, ScholarshipMatch } from "@shared/schema";
import { Calendar, Building2, GraduationCap, XCircle, Sparkles, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import MatchInsightsSheet from "./MatchInsightsSheet";

interface ScholarshipCardProps {
  scholarship: Scholarship | ScholarshipMatch;
  showMatchInfo?: boolean;
  onViewDetails?: (scholarship: Scholarship | ScholarshipMatch) => void;
  isSelected?: boolean;
}

function getDeadlineStatus(deadline: string): "urgent" | "normal" | "expired" {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "urgent";
  return "normal";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isScholarshipMatch(scholarship: Scholarship | ScholarshipMatch): scholarship is ScholarshipMatch {
  return 'match_score' in scholarship && scholarship.match_score !== undefined;
}

function getMatchScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getMatchScoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (score >= 60) return "bg-blue-100 dark:bg-blue-900/30";
  if (score >= 40) return "bg-amber-100 dark:bg-amber-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

export default function ScholarshipCard({ scholarship, showMatchInfo = false, onViewDetails, isSelected = false }: ScholarshipCardProps) {
  const [insightsOpen, setInsightsOpen] = useState(false);
  
  const deadlineStatus = getDeadlineStatus(scholarship.deadline);
  const isExpired = deadlineStatus === "expired";
  const isUrgent = deadlineStatus === "urgent";
  
  const matchData = showMatchInfo && isScholarshipMatch(scholarship) ? scholarship : null;
  const matchScore = matchData?.match_score ?? 0;
  const isEligible = matchData?.is_eligible ?? true;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    onViewDetails?.(scholarship);
  };

  return (
    <>
      <Card 
        className={`flex flex-col h-full transition-all cursor-pointer hover-elevate ${
          isExpired ? "opacity-60" : ""
        } ${isUrgent && !isExpired ? "border-red-300 dark:border-red-800" : ""} ${
          matchData && !isEligible && !isExpired ? "opacity-70" : ""
        } ${isSelected ? "ring-2 ring-indigo-500 border-indigo-500" : ""}`}
        data-testid={`card-scholarship-${scholarship.id}`}
        onClick={handleCardClick}
      >
        <div className="p-6 flex-1 flex flex-col">
          {matchData && (
            <div className={`flex items-center justify-between gap-2 mb-3 pb-3 border-b border-border`}>
              <div className="flex items-center gap-2">
                {isEligible ? (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${getMatchScoreBgColor(matchScore)}`}>
                    <Sparkles className={`w-3.5 h-3.5 ${getMatchScoreColor(matchScore)}`} />
                    <span className={`text-sm font-semibold ${getMatchScoreColor(matchScore)}`} data-testid={`text-match-score-${scholarship.id}`}>
                      {matchScore.toFixed(0)}% Match
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30">
                    <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400" data-testid={`text-ineligible-${scholarship.id}`}>
                      Not Eligible
                    </span>
                  </div>
                )}
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setInsightsOpen(true)}
                    data-testid={`button-view-details-${scholarship.id}`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    Details
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <span className="text-xs">View detailed match breakdown</span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        
          <div className="flex justify-between items-start gap-4 mb-4">
            <h3 
              className="text-lg font-bold text-foreground leading-tight flex-1"
              data-testid={`text-title-${scholarship.id}`}
            >
              {scholarship.title}
            </h3>
            <Badge 
              variant="secondary"
              className="whitespace-nowrap"
              style={{ backgroundColor: "#e0e7ff", color: "#4338ca" }}
              data-testid={`badge-education-${scholarship.id}`}
            >
              <GraduationCap className="w-3 h-3 mr-1" />
              {scholarship.education_level && scholarship.education_level.length > 0 
                ? (scholarship.education_level.length <= 2 
                    ? scholarship.education_level.join(", ") 
                    : `${scholarship.education_level.slice(0, 2).join(", ")}...`)
                : "All Levels"}
            </Badge>
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center text-muted-foreground">
              <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
              <span 
                className="text-sm"
                data-testid={`text-provider-${scholarship.id}`}
              >
                {scholarship.provider}
              </span>
            </div>

            <div className="flex items-center">
              <span 
                className="text-xl font-semibold"
                style={{ color: "#16a34a" }}
                data-testid={`text-amount-${scholarship.id}`}
              >
                {scholarship.amount}
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <span 
                className={`text-sm font-medium ${
                  isExpired ? "text-muted-foreground line-through" : 
                  isUrgent ? "text-red-600" : "text-amber-600"
                }`}
                data-testid={`text-deadline-${scholarship.id}`}
              >
                {isExpired ? "Expired: " : "Deadline: "}{formatDate(scholarship.deadline)}
              </span>
              {isUrgent && !isExpired && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
              {isExpired && (
                <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                  Expired
                </Badge>
              )}
            </div>

            {scholarship.tags && scholarship.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3" data-testid={`tags-${scholarship.id}`}>
                {scholarship.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-4 pt-2">
          <div 
            className="flex items-center justify-center gap-1 text-sm text-muted-foreground"
            data-testid={`hint-view-details-${scholarship.id}`}
          >
            <span>View Details</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Card>
      
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
