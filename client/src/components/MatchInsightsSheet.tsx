import { ScholarshipMatch } from "@shared/schema";
import { CheckCircle, XCircle, Sparkles, TrendingUp, GraduationCap, BookOpen, DollarSign, MapPin, Users, Languages } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MatchInsightsSheetProps {
  scholarship: ScholarshipMatch;
  isOpen: boolean;
  onClose: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "[&>div]:bg-emerald-500";
  if (score >= 60) return "[&>div]:bg-blue-500";
  if (score >= 40) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

interface EligibilityItemProps {
  label: string;
  status?: string;
  icon: React.ReactNode;
  detail?: string;
}

function EligibilityItem({ label, status, icon, detail }: EligibilityItemProps) {
  const isPassing = status === "Match" || status === "Eligible" || status === "Qualifies" || status === "Met";
  const isNotApplicable = !status || status === "N/A" || status === "Not Required";
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className={`flex-shrink-0 mt-0.5 ${isPassing ? "text-emerald-500" : isNotApplicable ? "text-muted-foreground" : "text-red-500"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{label}</span>
          {isPassing ? (
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : isNotApplicable ? (
            <span className="text-xs text-muted-foreground">N/A</span>
          ) : (
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
        </div>
        {detail && (
          <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
        )}
      </div>
    </div>
  );
}

export default function MatchInsightsSheet({ scholarship, isOpen, onClose }: MatchInsightsSheetProps) {
  const matchScore = scholarship.match_score ?? 0;
  const breakdown = scholarship.score_breakdown;
  const badges = scholarship.eligibility_badges ?? {};
  const reasons = scholarship.match_reasons ?? [];
  const ineligibilityReasons = scholarship.ineligibility_reasons ?? [];
  
  const similarityPercent = breakdown ? Math.round(breakdown.similarity_component * 100) : 0;
  const academicPercent = breakdown ? Math.round(breakdown.academic_component * 100) : 0;
  const socioeconomicPercent = breakdown ? Math.round(breakdown.socioeconomic_component * 100) : 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Match Insights
          </SheetTitle>
          <SheetDescription>
            Detailed breakdown of how this scholarship matches your profile
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800">
            <div className={`text-4xl font-bold ${getScoreColor(matchScore)}`} data-testid="text-overall-match">
              {matchScore.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">Overall Match Score</div>
            {scholarship.is_eligible ? (
              <Badge className="mt-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Eligible
              </Badge>
            ) : (
              <Badge className="mt-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                <XCircle className="w-3 h-3 mr-1" />
                Not Eligible
              </Badge>
            )}
          </div>

          {breakdown && scholarship.is_eligible && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4" />
                  Score Breakdown
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Semantic Match</span>
                      <span className="font-medium">{similarityPercent}%</span>
                    </div>
                    <Progress value={similarityPercent} className={`h-2 ${getProgressColor(similarityPercent)}`} />
                    <p className="text-xs text-muted-foreground mt-1">
                      How well your profile description matches this scholarship (50% weight)
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Academic Fit</span>
                      <span className="font-medium">{academicPercent}%</span>
                    </div>
                    <Progress value={academicPercent} className={`h-2 ${getProgressColor(academicPercent)}`} />
                    <p className="text-xs text-muted-foreground mt-1">
                      CGPA, SPM grades, and education level alignment (30% weight)
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Socioeconomic Fit</span>
                      <span className="font-medium">{socioeconomicPercent}%</span>
                    </div>
                    <Progress value={socioeconomicPercent} className={`h-2 ${getProgressColor(socioeconomicPercent)}`} />
                    <p className="text-xs text-muted-foreground mt-1">
                      Income bracket match and B40 bonus consideration (20% weight)
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4" />
              Eligibility Checklist
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <EligibilityItem 
                label="Education Level" 
                status={badges.education || "Match"} 
                icon={<GraduationCap className="w-4 h-4" />}
                detail={scholarship.education_level && scholarship.education_level.length > 0 
                  ? `Requires ${scholarship.education_level.join(", ")}` 
                  : "Open to all education levels"}
              />
              <EligibilityItem 
                label="Study Area" 
                status={badges.study_area || "Match"} 
                icon={<BookOpen className="w-4 h-4" />}
                detail={scholarship.study_areas?.length ? `For ${scholarship.study_areas.slice(0, 2).join(", ")}${scholarship.study_areas.length > 2 ? "..." : ""}` : "Open to all study areas"}
              />
              <EligibilityItem 
                label="CGPA" 
                status={badges.cgpa} 
                icon={<TrendingUp className="w-4 h-4" />}
                detail={scholarship.min_cgpa ? `Minimum ${scholarship.min_cgpa.toFixed(2)} required` : undefined}
              />
              <EligibilityItem 
                label="Household Income" 
                status={badges.income} 
                icon={<DollarSign className="w-4 h-4" />}
                detail={scholarship.household_income_max ? `Max RM ${scholarship.household_income_max.toLocaleString()}/month` : undefined}
              />
              <EligibilityItem 
                label="State" 
                status={badges.state} 
                icon={<MapPin className="w-4 h-4" />}
                detail={scholarship.state_restriction ? `Restricted to ${scholarship.state_restriction}` : undefined}
              />
              <EligibilityItem 
                label="Bumiputera Status" 
                status={badges.bumiputera} 
                icon={<Users className="w-4 h-4" />}
                detail={scholarship.is_bumiputera_only ? "Bumiputera only" : undefined}
              />
              <EligibilityItem 
                label="English Proficiency" 
                status={badges.english} 
                icon={<Languages className="w-4 h-4" />}
                detail={scholarship.min_muet ? `Min MUET Band ${scholarship.min_muet}` : scholarship.min_ielts ? `Min IELTS ${scholarship.min_ielts}` : undefined}
              />
            </div>
          </div>

          {reasons.length > 0 && scholarship.is_eligible && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" />
                  Why This Matches You
                </h3>
                <ul className="space-y-2">
                  {reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {ineligibilityReasons.length > 0 && !scholarship.is_eligible && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" />
                  Why You Don't Qualify
                </h3>
                <ul className="space-y-2">
                  {ineligibilityReasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
