import { Scholarship } from "@shared/schema";
import { Calendar, Building2, GraduationCap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ScholarshipCardProps {
  scholarship: Scholarship;
}

function isDeadlineUrgent(deadline: string): boolean {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays >= 0;
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
  const isUrgent = isDeadlineUrgent(scholarship.deadline);

  return (
    <Card 
      className="flex flex-col h-full"
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
              className={`text-sm font-medium ${isUrgent ? "text-red-600" : "text-muted-foreground"}`}
              data-testid={`text-deadline-${scholarship.id}`}
            >
              Deadline: {formatDate(scholarship.deadline)}
            </span>
            {isUrgent && (
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            )}
          </div>

        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        <Button
          className="w-full"
          style={{ backgroundColor: "#4f46e5" }}
          data-testid={`button-apply-${scholarship.id}`}
          onClick={() => {
            if (scholarship.url) {
              window.open(scholarship.url, "_blank");
            }
          }}
        >
          Apply Now
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
}
