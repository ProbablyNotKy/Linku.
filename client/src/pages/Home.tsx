import { useEffect, useState, useCallback, useMemo } from "react";
import { Scholarship } from "@shared/schema";
import { fetchScholarships } from "@/lib/api";
import Header from "@/components/Header";
import ScholarshipCard from "@/components/ScholarshipCard";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function Home() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  
  const debouncedQuery = useDebounce(searchQuery, 500);

  const loadScholarships = useCallback(async (query?: string, level?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const trimmedQuery = query?.trim();
      const data = await fetchScholarships({ 
        query: trimmedQuery || undefined, 
        level: level || undefined 
      });
      setScholarships(data);
    } catch (err) {
      console.error("Failed to fetch scholarships:", err);
      setError("Gagal memuat senarai biasiswa. Pastikan pelayan API sedang berjalan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScholarships(debouncedQuery, selectedLevel);
  }, [loadScholarships, debouncedQuery, selectedLevel]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedLevel("");
  };

  const hasFilters = searchQuery.trim() || selectedLevel;

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-section-title">
                  Available Scholarships
                </h2>
                <p className="text-muted-foreground mt-1">
                  Discover opportunities that match your educational journey
                </p>
              </div>
              {!isLoading && !error && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Search className="w-4 h-4" />
                  <span data-testid="text-scholarship-count">
                    {scholarships.length} opportunities found
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search scholarships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select 
                  value={selectedLevel || "all"} 
                  onValueChange={(val) => setSelectedLevel(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="w-[180px]" data-testid="select-level">
                    <SelectValue placeholder="Education Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="SPM">SPM</SelectItem>
                    <SelectItem value="Diploma">Diploma</SelectItem>
                    <SelectItem value="Degree">Degree</SelectItem>
                    <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                    <SelectItem value="Masters">Masters</SelectItem>
                  </SelectContent>
                </Select>
                
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-muted-foreground"
                    data-testid="button-clear-filters"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => loadScholarships(debouncedQuery, selectedLevel)} />
        ) : scholarships.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-state">
            <div className="bg-muted rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {hasFilters ? "No matching scholarships" : "Tiada biasiswa dijumpai"}
            </h3>
            <p className="text-muted-foreground">
              {hasFilters 
                ? "Try adjusting your search or filter criteria." 
                : "No scholarships available at the moment. Check back later."}
            </p>
            {hasFilters && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleClearFilters}
                data-testid="button-clear-empty"
              >
                Clear Filters
              </Button>
            )}
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

      <footer className="bg-card border-t border-border mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground text-sm">
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
