"use client";

import { Scholarship } from "@/types";
import { Calendar, Building2, GraduationCap, ExternalLink } from "lucide-react";

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
    <div 
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full"
      data-testid={`card-scholarship-${scholarship.id}`}
    >
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-4 mb-4">
          <h3 
            className="text-lg font-bold text-slate-900 leading-tight flex-1 font-heading"
            data-testid={`text-title-${scholarship.id}`}
          >
            {scholarship.title}
          </h3>
          <span 
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 whitespace-nowrap"
            data-testid={`badge-education-${scholarship.id}`}
          >
            <GraduationCap className="w-3 h-3 mr-1" />
            {scholarship.education_level}
          </span>
        </div>

        <div className="space-y-3 flex-1">
          <div className="flex items-center text-slate-500">
            <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
            <span 
              className="text-sm"
              data-testid={`text-provider-${scholarship.id}`}
            >
              {scholarship.provider}
            </span>
          </div>

          <div className="flex items-center">
            <span className="text-xl font-semibold text-amber-600" data-testid={`text-amount-${scholarship.id}`}>
              {scholarship.amount}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0 text-slate-400" />
            <span 
              className={`text-sm font-medium ${isUrgent ? "text-red-600" : "text-slate-500"}`}
              data-testid={`text-deadline-${scholarship.id}`}
            >
              Deadline: {formatDate(scholarship.deadline)}
            </span>
            {isUrgent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                Urgent
              </span>
            )}
          </div>

          {scholarship.tags && scholarship.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {scholarship.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        <button
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-lg shadow-indigo-600/25 transition-all duration-200"
          data-testid={`button-apply-${scholarship.id}`}
          onClick={() => {
            if (scholarship.url) {
              window.open(scholarship.url, "_blank");
            }
          }}
        >
          Apply Now
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
