import { Scholarship } from "@shared/schema";
import { Calendar, Building2, GraduationCap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ScholarshipCardProps {
  scholarship: Scholarship;
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

export default function ScholarshipCard({ scholarship }: ScholarshipCardProps) {
  const deadlineStatus = getDeadlineStatus(scholarship.deadline);
  const isExpired = deadlineStatus === "expired";
  const isUrgent = deadlineStatus === "urgent";

  return (
    <Card 
      className={`flex flex-col h-full transition-all ${
        isExpired ? "opacity-60" : ""
      } ${isUrgent ? "border-red-300 dark:border-red-800" : ""}`}
      data-testid={`card-scholarship-${scholarship.id}`}
    >
      <div className="p-6 flex-1 flex flex-col">
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
