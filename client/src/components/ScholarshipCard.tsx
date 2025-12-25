import { Scholarship, ScholarshipMatch } from "@shared/schema";
import { Calendar, Building2, GraduationCap, ExternalLink, AlertCircle, CheckCircle, XCircle, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ScholarshipCardProps {
  scholarship: Scholarship | ScholarshipMatch;
  showMatchInfo?: boolean;
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
  return 'is_eligible' in scholarship;
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

export default function ScholarshipCard({ scholarship, showMatchInfo = false }: ScholarshipCardProps) {
  const deadlineStatus = getDeadlineStatus(scholarship.deadline);
  const isExpired = deadlineStatus === "expired";
  const isUrgent = deadlineStatus === "urgent";
  
  const matchData = isScholarshipMatch(scholarship) ? scholarship : null;
  const matchScore = matchData?.match_score ?? 0;
  const isEligible = matchData?.is_eligible ?? true;

  return (
    <Card 
      className={`flex flex-col h-full transition-all ${
        isExpired ? "opacity-60" : ""
      } ${isUrgent ? "border-red-300 dark:border-red-800" : ""} ${
        matchData && !isEligible ? "opacity-70 border-muted" : ""
      }`}
      data-testid={`card-scholarship-${scholarship.id}`}
    >
      <div className="p-6 flex-1 flex flex-col">
        {showMatchInfo && matchData && (
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
            
            {isEligible && matchData.match_reasons && matchData.match_reasons.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-xs">Why this matches you:</p>
                    <ul className="text-xs space-y-0.5">
                      {matchData.match_reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            
            {!isEligible && matchData.ineligibility_reasons && matchData.ineligibility_reasons.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-xs">Why you don't qualify:</p>
                    <ul className="text-xs space-y-0.5">
                      {matchData.ineligibility_reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
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
            {scholarship.education_level}
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

      <div className="px-6 pb-6 pt-2">
        <Button
          className="w-full"
          style={{ backgroundColor: "#4f46e5" }}
          disabled={isExpired}
          data-testid={`button-apply-${scholarship.id}`}
          onClick={() => {
            if (scholarship.url && !isExpired) {
              window.open(scholarship.url, "_blank");
            }
          }}
        >
          {isExpired ? "Application Closed" : "Apply Now"}
          {!isExpired && <ExternalLink className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </Card>
  );
}
