import { useEffect, useState, useCallback } from "react";
import { Link, useSearch } from "wouter";
import { Scholarship, ScholarshipMatch } from "@shared/schema";
import { fetchScholarships, matchWithProfile } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import Header from "@/components/Header";
import ScholarshipCard from "@/components/ScholarshipCard";
import ScholarshipDetailPanel from "@/components/ScholarshipDetailPanel";
import ScholarshipDetailDrawer from "@/components/ScholarshipDetailDrawer";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ChatComponent from "@/components/ChatComponent";
import { UpgradePrompt, PremiumBadge } from "@/components/UpgradePrompt";
import { Search, Filter, X, Sparkles, MessageSquare, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  const searchParams = useSearch();
  const { hasProfile, profileId, profileLoading, session } = useAuth();
  const { isPremium, checkFeature } = useSubscription();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [matchedScholarships, setMatchedScholarships] = useState<ScholarshipMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  
  const [magicMatchEnabled, setMagicMatchEnabled] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | ScholarshipMatch | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<{ name: string; description: string }>({
    name: '',
    description: '',
  });
  
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const debouncedQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (!profileLoading && searchParams.includes("magic=true") && hasProfile) {
      setMagicMatchEnabled(true);
    }
  }, [searchParams, hasProfile, profileLoading]);

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

  const loadMatchedScholarships = useCallback(async () => {
    if (!profileId || !session?.access_token) {
      setMagicMatchEnabled(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const matches = await matchWithProfile(profileId, session.access_token, 10);
      setMatchedScholarships(matches);
    } catch (err: unknown) {
      console.error("Failed to match scholarships:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('premium') || errorMessage.includes('403')) {
        setUpgradeFeature({
          name: 'AI Matching',
          description: 'Get personalized scholarship recommendations powered by AI',
        });
        setShowUpgradePrompt(true);
        setMagicMatchEnabled(false);
      } else {
        setError("Failed to find matches. Please try creating your profile again.");
        setMagicMatchEnabled(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [profileId, session?.access_token]);

  useEffect(() => {
    if (magicMatchEnabled && hasProfile) {
      loadMatchedScholarships();
    } else {
      loadScholarships(debouncedQuery, selectedLevel);
    }
  }, [loadScholarships, loadMatchedScholarships, debouncedQuery, selectedLevel, magicMatchEnabled, hasProfile]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedLevel("");
  };

  const handleMagicMatchToggle = async (enabled: boolean) => {
    if (enabled && !hasProfile) {
      return;
    }
    if (enabled && !isPremium) {
      const access = await checkFeature('ai_matching');
      if (!access.has_access) {
        setUpgradeFeature({
          name: 'AI Matching',
          description: 'Get personalized scholarship recommendations powered by AI',
        });
        setShowUpgradePrompt(true);
        return;
      }
    }
    setMagicMatchEnabled(enabled);
  };

  const handleChatToggle = async () => {
    if (!chatOpen && !isPremium) {
      const access = await checkFeature('ai_mentor');
      if (!access.has_access) {
        setUpgradeFeature({
          name: 'Socratic Mentor',
          description: 'Get AI-powered guidance for your scholarship essays and applications',
        });
        setShowUpgradePrompt(true);
        return;
      }
    }
    setChatOpen(!chatOpen);
  };

  const hasFilters = searchQuery.trim() || selectedLevel;
  const displayScholarships = magicMatchEnabled ? matchedScholarships : scholarships;

  const handleViewDetails = (scholarship: Scholarship | ScholarshipMatch) => {
    setSelectedScholarship(scholarship);
  };

  const handleCloseDetail = () => {
    setSelectedScholarship(null);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <div className={`transition-all duration-300 overflow-auto ${selectedScholarship ? "w-full md:w-1/2" : "w-full"}`}>
          <div className={`mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 min-h-full flex flex-col ${selectedScholarship ? "max-w-full" : "max-w-7xl"}`}>
            <div className="mb-4 sm:mb-8">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-foreground" data-testid="text-section-title">
                      {magicMatchEnabled ? "Your Best Matches" : "Available Scholarships"}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
                      {magicMatchEnabled 
                        ? "Scholarships ranked by AI based on your profile"
                        : "Discover opportunities that match your educational journey"}
                    </p>
                  </div>
                  {!isLoading && !error && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span data-testid="text-scholarship-count">
                        {displayScholarships.length} opportunities found
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {!magicMatchEnabled && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="relative flex-1">
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
                        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Select 
                          value={selectedLevel || "all"} 
                          onValueChange={(val) => setSelectedLevel(val === "all" ? "" : val)}
                        >
                          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-level">
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
                            className="text-muted-foreground flex-shrink-0"
                            data-testid="button-clear-filters"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 border border-indigo-200 dark:border-indigo-800">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs sm:text-sm font-medium text-indigo-900 dark:text-indigo-200">
                        Magic Match
                      </span>
                      <Switch
                        checked={magicMatchEnabled}
                        onCheckedChange={handleMagicMatchToggle}
                        disabled={!hasProfile}
                        data-testid="switch-magic-match"
                      />
                    </div>

                    {!hasProfile && (
                      <Link href="/onboarding">
                        <Button 
                          variant="default"
                          size="sm"
                          className="bg-gradient-to-r from-indigo-600 to-purple-600"
                          data-testid="button-create-profile"
                        >
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Create AI Profile</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} onRetry={() => magicMatchEnabled ? loadMatchedScholarships() : loadScholarships(debouncedQuery, selectedLevel)} />
            ) : displayScholarships.length === 0 ? (
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
                className={`grid gap-3 sm:gap-6 ${selectedScholarship ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}
                data-testid="scholarship-grid"
              >
                {displayScholarships.map((scholarship) => (
                  <ScholarshipCard 
                    key={scholarship.id} 
                    scholarship={scholarship} 
                    showMatchInfo={magicMatchEnabled}
                    onViewDetails={handleViewDetails}
                    isSelected={selectedScholarship?.id === scholarship.id}
                  />
                ))}
              </div>
            )}

            <footer className="bg-card border-t border-border mt-auto py-4 sm:py-8 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8">
              <div className="text-center text-muted-foreground text-sm">
                <p data-testid="text-footer">
                  &copy; {new Date().getFullYear()} Linku. All rights reserved.
                </p>
                <p className="mt-1">
                  Helping Malaysian students discover educational opportunities.
                </p>
              </div>
            </footer>
          </div>
        </div>

        {selectedScholarship && (
          <div className="hidden md:block w-1/2 h-full border-l border-border">
            <ScholarshipDetailPanel 
              scholarship={selectedScholarship}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>

      <ScholarshipDetailDrawer
        scholarship={selectedScholarship}
        isOpen={!!selectedScholarship && isMobile}
        onClose={handleCloseDetail}
      />

      <Button
        onClick={handleChatToggle}
        className="fixed bottom-4 right-4 z-40 rounded-full w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg"
        size="icon"
        data-testid="button-open-chat"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>

      <ChatComponent isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        featureName={upgradeFeature.name}
        featureDescription={upgradeFeature.description}
      />
    </main>
  );
}
