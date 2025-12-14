"use client";

import { useEffect, useState, useCallback } from "react";
import { Scholarship } from "@/types";
import { fetchScholarships } from "@/lib/api";
import Header from "@/components/Header";
import ScholarshipCard from "@/components/ScholarshipCard";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Search } from "lucide-react";

export default function Home() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScholarships = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchScholarships();
      setScholarships(data);
    } catch (err) {
      console.error("Failed to fetch scholarships:", err);
      setError("Gagal memuat senarai biasiswa. Pastikan pelayan API sedang berjalan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScholarships();
  }, [loadScholarships]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-section-title">
                Available Scholarships
              </h2>
              <p className="text-gray-600 mt-1">
                Discover opportunities that match your educational journey
              </p>
            </div>
            {!isLoading && !error && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Search className="w-4 h-4" />
                <span data-testid="text-scholarship-count">
                  {scholarships.length} opportunities found
                </span>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadScholarships} />
        ) : scholarships.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-state">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tiada biasiswa dijumpai
            </h3>
            <p className="text-gray-600">
              No scholarships available at the moment. Check back later.
            </p>
          </div>
        ) : (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="scholarship-grid"
          >
            {scholarships.map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
            ))}
          </div>
        )}
      </div>

      <footer className="bg-white border-t border-gray-100 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p data-testid="text-footer">
              &copy; {new Date().getFullYear()} Ascendia. All rights reserved.
            </p>
            <p className="mt-1">
              Helping Malaysian students discover educational opportunities.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
