import { Scholarship, ScholarshipMatch } from "@shared/schema";
import { 
  Calendar, Building2, GraduationCap, ExternalLink, 
  MapPin, DollarSign, BookOpen, Users, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ScholarshipDetailDrawerProps {
  scholarship: Scholarship | ScholarshipMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

function getDeadlineStatus(deadline: string | null | undefined, deadlineType?: string | null): "urgent" | "normal" | "expired" | "tba" | "rolling" {
  if (deadlineType === "TBA" || !deadline) return "tba";
  if (deadlineType === "Rolling") return "rolling";

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-MY', { 
    style: 'currency', 
    currency: 'MYR',
    maximumFractionDigits: 0 
  }).format(value);
}

export default function ScholarshipDetailDrawer({ 
  scholarship, 
  isOpen, 
  onClose 
}: ScholarshipDetailDrawerProps) {
  if (!scholarship) return null;
  
  const deadlineStatus = getDeadlineStatus(scholarship.deadline, scholarship.deadline_type);
  const isExpired = deadlineStatus === "expired";
  const isUrgent = deadlineStatus === "urgent";
  const isTBA = deadlineStatus === "tba";
  const isRolling = deadlineStatus === "rolling";
  const isEstimated = scholarship.deadline_type === "Estimated";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg p-0 flex flex-col"
        data-testid="drawer-scholarship-detail"
      >
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            <Badge 
              variant="secondary"
              className="whitespace-nowrap shrink-0"
              style={{ backgroundColor: "#e0e7ff", color: "#4338ca" }}
              data-testid="badge-education-drawer"
            >
              <GraduationCap className="w-3 h-3 mr-1" />
              {scholarship.education_level && scholarship.education_level.length > 0 
                ? (scholarship.education_level.length <= 2 
                    ? scholarship.education_level.join(", ") 
                    : `${scholarship.education_level.slice(0, 2).join(", ")}...`)
                : "All Levels"}
            </Badge>
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
            {isTBA && (
              <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                TBA
              </Badge>
            )}
            {isRolling && (
              <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                Rolling
              </Badge>
            )}
          </div>
          <SheetTitle 
            className="text-xl font-bold text-foreground text-left mt-2"
            data-testid="text-title-drawer"
          >
            {scholarship.title}
          </SheetTitle>
          <SheetDescription className="text-left flex items-center gap-2 text-muted-foreground">
            <Building2 className="w-4 h-4" />
            {scholarship.provider}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  Amount
                </div>
                <p 
                  className="text-lg font-semibold text-green-600 dark:text-green-400"
                  data-testid="text-amount-drawer"
                >
                  {scholarship.amount}
                </p>
              </div>
              
              <div className={`rounded-lg p-4 ${
                isTBA || isRolling ? "bg-gray-50 dark:bg-gray-800" :
                isExpired ? "bg-gray-50 dark:bg-gray-800" :
                isUrgent ? "bg-red-50 dark:bg-red-900/20" : "bg-amber-50 dark:bg-amber-900/20"
              }`}>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  Deadline
                </div>
                {isTBA ? (
                  <p
                    className="text-lg font-semibold text-muted-foreground"
                    data-testid="text-deadline-drawer"
                  >
                    To Be Announced
                  </p>
                ) : isRolling ? (
                  <p
                    className="text-lg font-semibold text-emerald-600 dark:text-emerald-400"
                    data-testid="text-deadline-drawer"
                  >
                    Rolling Admission
                  </p>
                ) : (
                  <p
                    className={`text-lg font-semibold ${
                      isExpired ? "text-gray-500 line-through" :
                      isUrgent ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                    }`}
                    data-testid="text-deadline-drawer"
                  >
                    {formatDate(scholarship.deadline!)}
                    {isEstimated && <span className="text-sm font-normal ml-1">(Est.)</span>}
                  </p>
                )}
              </div>
            </div>

            {(scholarship.study_areas && scholarship.study_areas.length > 0) && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Study Areas
                </h4>
                <div className="flex flex-wrap gap-1.5" data-testid="study-areas-drawer">
                  {scholarship.study_areas.map((area, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {scholarship.tags && scholarship.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5" data-testid="tags-drawer">
                  {scholarship.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Eligibility Requirements</h4>
              
              <div className="grid gap-2 text-sm">
                {scholarship.min_cgpa && (
                  <div className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/50">
                    <span className="text-muted-foreground">Minimum CGPA</span>
                    <span className="font-medium">{scholarship.min_cgpa.toFixed(2)}</span>
                  </div>
                )}
                
                {scholarship.min_spm_as && (
                  <div className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/50">
                    <span className="text-muted-foreground">SPM A's Required</span>
                    <span className="font-medium">{scholarship.min_spm_as}</span>
                  </div>
                )}
                
                {scholarship.household_income_max && (
                  <div className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/50">
                    <span className="text-muted-foreground">Max Household Income</span>
                    <span className="font-medium">{formatCurrency(scholarship.household_income_max)}</span>
                  </div>
                )}
                
                {scholarship.state_restriction && (
                  <div className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/50">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> State Restriction
                    </span>
                    <span className="font-medium">{scholarship.state_restriction}</span>
                  </div>
                )}
                
                {scholarship.is_bumiputera_only && (
                  <div className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/50">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> Bumiputera Only
                    </span>
                    <Badge variant="secondary" className="text-xs">Yes</Badge>
                  </div>
                )}

                {scholarship.min_muet && (
                  <div className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/50">
                    <span className="text-muted-foreground">Minimum MUET Band</span>
                    <span className="font-medium">{scholarship.min_muet}</span>
                  </div>
                )}

                {scholarship.min_ielts && (
                  <div className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/50">
                    <span className="text-muted-foreground">Minimum IELTS</span>
                    <span className="font-medium">{scholarship.min_ielts}</span>
                  </div>
                )}

                {scholarship.min_spm_english && (
                  <div className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/50">
                    <span className="text-muted-foreground">Minimum SPM English</span>
                    <span className="font-medium">{scholarship.min_spm_english}</span>
                  </div>
                )}
              </div>
            </div>

            {scholarship.detailed_description && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Full Description</h4>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                    data-testid="text-detailed-description"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {scholarship.detailed_description}
                    </ReactMarkdown>
                  </div>
                </div>
              </>
            )}

            {scholarship.url && (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <a 
                    href={scholarship.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                    data-testid="link-scholarship-url"
                  >
                    {scholarship.url}
                  </a>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-6 pt-4 border-t mt-auto">
          <Button
            className="w-full"
            style={{ backgroundColor: "#4f46e5" }}
            disabled={isExpired}
            data-testid="button-apply-drawer"
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
      </SheetContent>
    </Sheet>
  );
}
