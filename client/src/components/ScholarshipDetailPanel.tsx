import { Scholarship, ScholarshipMatch } from "@shared/schema";
import { 
  Calendar, Building2, GraduationCap, ExternalLink, 
  MapPin, Mail, Link2, FileText, Globe, X, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ScholarshipDetailPanelProps {
  scholarship: Scholarship | ScholarshipMatch | null;
  onClose: () => void;
}

function getDeadlineStatus(deadline: string | null | undefined, deadlineType?: string | null): "urgent" | "normal" | "expired" | "rolling" | "tba" {
  if (deadlineType === "Rolling") return "rolling";
  if (deadlineType === "TBA") return "tba";
  if (!deadline) return "tba";
  
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

function FieldRow({ 
  icon: Icon, 
  label, 
  children 
}: { 
  icon: React.ElementType; 
  label: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground min-w-[140px] shrink-0">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function ScholarshipDetailPanel({ 
  scholarship, 
  onClose 
}: ScholarshipDetailPanelProps) {
  if (!scholarship) return null;
  
  const deadlineStatus = getDeadlineStatus(scholarship.deadline, scholarship.deadline_type);
  const isExpired = deadlineStatus === "expired";
  const isUrgent = deadlineStatus === "urgent";
  const isRolling = deadlineStatus === "rolling";
  const isTBA = deadlineStatus === "tba";

  const providerGradients: Record<string, string> = {
    "petronas": "from-emerald-800 to-emerald-950",
    "khazanah": "from-blue-800 to-blue-950",
    "maybank": "from-amber-700 to-amber-900",
    "jpa": "from-indigo-800 to-indigo-950",
    "default": "from-slate-700 to-slate-900"
  };

  const getProviderGradient = (provider: string) => {
    const key = Object.keys(providerGradients).find(k => 
      provider.toLowerCase().includes(k)
    );
    return providerGradients[key || "default"];
  };

  return (
    <div 
      className="h-full flex flex-col bg-zinc-900 dark:bg-zinc-900 text-white relative"
      data-testid="panel-scholarship-detail"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-3 right-3 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full"
        data-testid="button-close-panel"
      >
        <X className="w-5 h-5" />
      </Button>

      <div className="relative">
        <div 
          className={`h-40 bg-gradient-to-br ${getProviderGradient(scholarship.provider)} relative overflow-hidden`}
          style={scholarship.banner_image_url ? {
            backgroundImage: `url(${scholarship.banner_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-4 right-4 text-3xl font-bold text-white/80 uppercase tracking-wider">
            {scholarship.provider.split(' ').slice(0, 2).join(' ')}
          </div>
        </div>

        <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-lg bg-zinc-800 border-4 border-zinc-900 flex items-center justify-center shadow-lg">
          <Building2 className="w-8 h-8 text-white/80" />
        </div>
      </div>
      
      <div className="pt-12 px-6 pb-4">
        <h2 
          className="text-2xl font-bold text-white"
          data-testid="text-title-panel"
        >
          {scholarship.title}
        </h2>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-2">
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3 text-white/80">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Requirements</span>
            </div>
            
            {scholarship.detailed_description ? (
              <div 
                className="prose prose-sm prose-invert max-w-none text-zinc-300 text-sm leading-relaxed"
                data-testid="text-detailed-description"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {scholarship.detailed_description}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-zinc-300 text-sm leading-relaxed space-y-2">
                {scholarship.min_cgpa && (
                  <p>Minimum CGPA of {scholarship.min_cgpa.toFixed(2)} required</p>
                )}
                {scholarship.min_spm_as && (
                  <p>{scholarship.min_spm_as} A's required in SPM</p>
                )}
                {scholarship.household_income_max && (
                  <p>Household income must not exceed {formatCurrency(scholarship.household_income_max)}</p>
                )}
                {scholarship.is_bumiputera_only && (
                  <p>Open to Bumiputera students only</p>
                )}
                {scholarship.state_restriction && (
                  <p>Restricted to students from {scholarship.state_restriction}</p>
                )}
                {scholarship.min_muet && (
                  <p>Minimum MUET Band {scholarship.min_muet}</p>
                )}
                {scholarship.min_ielts && (
                  <p>Minimum IELTS score of {scholarship.min_ielts}</p>
                )}
                {!scholarship.min_cgpa && !scholarship.min_spm_as && !scholarship.household_income_max && 
                 !scholarship.is_bumiputera_only && !scholarship.state_restriction && (
                  <p className="text-zinc-400 italic">No specific requirements listed. Please check the official website for details.</p>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-zinc-700" />

          <div className="space-y-1 py-2">
            <FieldRow icon={Award} label="Status">
              <Badge 
                variant={isExpired ? "secondary" : "default"}
                className={`${
                  isExpired 
                    ? "bg-red-600 text-white" 
                    : isUrgent 
                      ? "bg-amber-500 text-black" 
                      : "bg-emerald-600 text-white"
                }`}
              >
                {isExpired ? "Closed" : isUrgent ? "Closing Soon" : "Open"}
              </Badge>
            </FieldRow>

            {scholarship.url && (
              <FieldRow icon={Link2} label="Application Link">
                <a 
                  href={scholarship.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm truncate block"
                  data-testid="link-scholarship-url"
                >
                  {new URL(scholarship.url).hostname}
                </a>
              </FieldRow>
            )}

            {scholarship.email && (
              <FieldRow icon={Mail} label="Email">
                <a 
                  href={`mailto:${scholarship.email}`}
                  className="text-blue-400 hover:underline text-sm"
                  data-testid="text-email-panel"
                >
                  {scholarship.email}
                </a>
              </FieldRow>
            )}

            <FieldRow icon={Calendar} label="Deadline">
              {isRolling ? (
                <Badge variant="secondary" className="bg-green-600 text-white">
                  Rolling Admission
                </Badge>
              ) : isTBA ? (
                <Badge variant="secondary" className="bg-gray-600 text-white">
                  To Be Announced
                </Badge>
              ) : scholarship.deadline ? (
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isExpired ? "text-red-400 line-through" : isUrgent ? "text-amber-400" : "text-white"}`}>
                    {formatDate(scholarship.deadline)}
                  </span>
                  {scholarship.deadline_type === "Estimated" && (
                    <Badge variant="outline" className="border-amber-500 text-amber-400 text-xs">
                      Estimated
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-sm text-zinc-400">Not specified</span>
              )}
            </FieldRow>
            
            {scholarship.opens_at && (
              <FieldRow icon={Calendar} label="Opens">
                <span className="text-sm text-emerald-400">
                  {formatDate(scholarship.opens_at)}
                </span>
              </FieldRow>
            )}

            <FieldRow icon={Award} label="Scholarship Type">
              <Badge variant="secondary" className="bg-indigo-600 text-white">
                {scholarship.scholarship_type || "Scholarship"}
              </Badge>
            </FieldRow>

            <FieldRow icon={GraduationCap} label="Open for">
              <div className="flex flex-wrap gap-1">
                {scholarship.education_level && scholarship.education_level.length > 0 ? (
                  scholarship.education_level.map((level, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-purple-600 text-white text-xs">
                      {level}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                    All Levels
                  </Badge>
                )}
              </div>
            </FieldRow>

            {scholarship.study_areas && scholarship.study_areas.length > 0 && (
              <FieldRow icon={FileText} label="Study Areas">
                <div className="flex flex-wrap gap-1">
                  {scholarship.study_areas.map((area, idx) => (
                    <Badge key={idx} variant="outline" className="border-zinc-600 text-zinc-300 text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </FieldRow>
            )}

            <FieldRow icon={Globe} label="Place of Study">
              <div className="flex flex-wrap gap-1">
                {scholarship.place_of_study && scholarship.place_of_study.length > 0 ? (
                  scholarship.place_of_study.map((place, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-teal-600 text-white text-xs">
                      {place}
                    </Badge>
                  ))
                ) : (
                  <>
                    <Badge variant="secondary" className="bg-teal-600 text-white text-xs">Local</Badge>
                    <Badge variant="secondary" className="bg-cyan-600 text-white text-xs">Overseas</Badge>
                  </>
                )}
              </div>
            </FieldRow>

            {scholarship.tags && scholarship.tags.length > 0 && (
              <FieldRow icon={Award} label="Tags">
                <div className="flex flex-wrap gap-1">
                  {scholarship.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </FieldRow>
            )}
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-6 pt-4 border-t border-zinc-700 mt-auto">
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          disabled={isExpired}
          data-testid="button-apply-panel"
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
    </div>
  );
}
