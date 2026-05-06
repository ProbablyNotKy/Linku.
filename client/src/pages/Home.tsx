import { useEffect, useState, useCallback } from "react";
import { Link, useSearch } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
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
import { UpgradePrompt } from "@/components/UpgradePrompt";
import {
  Search,
  X,
  Sparkles,
  MessageSquare,
  SlidersHorizontal,
  Clock,
  GraduationCap,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const EDUCATION_FILTERS = ["SPM", "Diploma", "Undergraduate", "Degree", "Masters", "Postgraduate"];

const QUICK_FILTERS = [
  { label: "Closing Soon", icon: Clock, value: "urgent" },
  { label: "Full Ride", icon: Zap, value: "full-ride" },
  { label: "Undergraduate", icon: GraduationCap, value: "undergraduate" },
  { label: "Postgraduate", icon: GraduationCap, value: "postgraduate" },
];

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
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>("");

  const [magicMatchEnabled, setMagicMatchEnabled] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | ScholarshipMatch | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState({ name: "", description: "" });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const debouncedQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    if (!profileLoading && searchParams.includes("magic=true") && hasProfile) {
      setMagicMatchEnabled(true);
    }
  }, [searchParams, hasProfile, profileLoading]);

  const loadScholarships = useCallback(async (query?: string, level?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchScholarships({
        query: query?.trim() || undefined,
        level: level || undefined,
      });
      setScholarships(data);
    } catch (err) {
      setError("Failed to load scholarships. Please try again.");
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
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("premium") || msg.includes("403")) {
        setUpgradeFeature({ name: "AI Matching", description: "Get personalized scholarship recommendations powered by AI" });
        setShowUpgradePrompt(true);
        setMagicMatchEnabled(false);
      } else {
        setError("Failed to find matches. Try creating your profile again.");
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

  const handleMagicMatchToggle = async (enabled: boolean) => {
    if (enabled && !hasProfile) return;
    if (enabled && !isPremium) {
      const access = await checkFeature("ai_matching");
      if (!access.has_access) {
        setUpgradeFeature({ name: "AI Matching", description: "Get personalized scholarship recommendations powered by AI" });
        setShowUpgradePrompt(true);
        return;
      }
    }
    setMagicMatchEnabled(enabled);
  };

  const handleChatToggle = async () => {
    if (!chatOpen && !isPremium) {
      const access = await checkFeature("ai_mentor");
      if (!access.has_access) {
        setUpgradeFeature({ name: "Socratic Mentor", description: "Get AI-powered guidance for your scholarship essays" });
        setShowUpgradePrompt(true);
        return;
      }
    }
    setChatOpen(!chatOpen);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedLevel("");
    setActiveQuickFilter("");
  };

  const handleQuickFilter = (value: string) => {
    setActiveQuickFilter((prev) => (prev === value ? "" : value));
    if (value === "undergraduate") {
      setSelectedLevel((prev) => (prev === "Undergraduate" ? "" : "Undergraduate"));
      setActiveQuickFilter((prev) => (prev === value ? "" : value));
    } else if (value === "postgraduate") {
      setSelectedLevel((prev) => (prev === "Postgraduate" ? "" : "Postgraduate"));
      setActiveQuickFilter((prev) => (prev === value ? "" : value));
    }
  };

  // Client-side quick filter application
  const baseList = magicMatchEnabled ? matchedScholarships : scholarships;
  const displayScholarships = baseList.filter((s) => {
    if (activeQuickFilter === "urgent") {
      if (!s.deadline || s.deadline_type === "TBA") return false;
      const days = Math.ceil((new Date(s.deadline).getTime() - Date.now()) / 86400000);
      return days >= 0 && days <= 30;
    }
    if (activeQuickFilter === "full-ride") {
      const amount = (s.amount || "").toLowerCase();
      return amount.includes("full") || amount.includes("full ride") || amount.includes("penuh");
    }
    return true;
  });

  const hasFilters = !!(searchQuery.trim() || selectedLevel || activeQuickFilter);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0B0F19]">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className={`transition-all duration-300 overflow-auto flex-1 ${selectedScholarship ? "md:w-1/2 md:flex-none" : ""}`}>
          <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-full flex flex-col ${selectedScholarship ? "max-w-full" : "max-w-7xl"}`}>

            {/* Page header */}
            <div className="mb-8">
              <h1
                className="text-2xl sm:text-3xl font-black text-white mb-1"
                data-testid="text-section-title"
              >
                {magicMatchEnabled ? "Your Best Matches" : "Scholarships"}
              </h1>
              <p className="text-sm text-gray-500">
                {magicMatchEnabled
                  ? "AI-ranked opportunities based on your profile"
                  : "Discover opportunities tailored for Malaysian students"}
              </p>
            </div>

            {/* Search + Controls bar */}
            <div className="mb-6 space-y-3">
              {/* Command-palette search */}
              {!magicMatchEnabled && (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search by title, provider, or field of study…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 pr-4 py-3 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/60 focus:bg-white/8 rounded-xl text-sm transition-all"
                    data-testid="input-search"
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Filter row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Quick filter badges */}
                {!magicMatchEnabled && QUICK_FILTERS.map((qf) => (
                  <button
                    key={qf.value}
                    onClick={() => handleQuickFilter(qf.value)}
                    data-testid={`badge-filter-${qf.value}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150
                      ${activeQuickFilter === qf.value
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/25 hover:text-gray-300"
                      }`}
                  >
                    <qf.icon className="w-3 h-3" />
                    {qf.label}
                  </button>
                ))}

                {/* Level filter badges */}
                {!magicMatchEnabled && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-gray-600" />
                    {EDUCATION_FILTERS.map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSelectedLevel((prev) => (prev === lvl ? "" : lvl))}
                        data-testid={`badge-level-${lvl}`}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150
                          ${selectedLevel === lvl
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                            : "bg-white/5 border-white/8 text-gray-500 hover:border-white/20 hover:text-gray-400"
                          }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1" />

                {/* Magic Match toggle */}
                <div
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-300 ${
                    magicMatchEnabled
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${magicMatchEnabled ? "text-emerald-400" : "text-gray-500"}`} />
                  <span className={`text-sm font-semibold ${magicMatchEnabled ? "text-emerald-300" : "text-gray-400"}`}>
                    Magic Match
                  </span>
                  <Switch
                    checked={magicMatchEnabled}
                    onCheckedChange={handleMagicMatchToggle}
                    disabled={!hasProfile}
                    data-testid="switch-magic-match"
                  />
                </div>

                {/* Create profile CTA */}
                {!hasProfile && !magicMatchEnabled && (
                  <Link href="/onboarding">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3"
                      data-testid="button-create-profile"
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      Create AI Profile
                    </Button>
                  </Link>
                )}

                {/* Clear filters */}
                {hasFilters && !magicMatchEnabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-gray-500 hover:text-gray-300 hover:bg-white/8 h-8 text-xs"
                    data-testid="button-clear-filters"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Count + active filter pills */}
              {!isLoading && !error && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-600" data-testid="text-scholarship-count">
                    {displayScholarships.length} {displayScholarships.length === 1 ? "result" : "results"}
                  </span>
                  {activeQuickFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {QUICK_FILTERS.find(q => q.value === activeQuickFilter)?.label}
                      <button onClick={() => setActiveQuickFilter("")}>
                        <X className="w-2.5 h-2.5 ml-0.5" />
                      </button>
                    </span>
                  )}
                  {selectedLevel && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {selectedLevel}
                      <button onClick={() => setSelectedLevel("")}>
                        <X className="w-2.5 h-2.5 ml-0.5" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Grid */}
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState
                message={error}
                onRetry={() => magicMatchEnabled ? loadMatchedScholarships() : loadScholarships(debouncedQuery, selectedLevel)}
              />
            ) : displayScholarships.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center py-24"
                data-testid="empty-state"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-gray-600" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">
                  {hasFilters ? "No matching scholarships" : "No scholarships found"}
                </h3>
                <p className="text-sm text-gray-500 mb-4 text-center max-w-xs">
                  {hasFilters
                    ? "Try adjusting your filters or search terms."
                    : "Check back later for new opportunities."}
                </p>
                {hasFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5"
                    onClick={handleClearFilters}
                    data-testid="button-clear-empty"
                  >
                    Clear Filters
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div
                layout
                className={`grid gap-4 sm:gap-5 ${
                  selectedScholarship
                    ? "grid-cols-1 lg:grid-cols-2"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                }`}
                data-testid="scholarship-grid"
              >
                <AnimatePresence mode="sync">
                  {displayScholarships.map((scholarship) => (
                    <ScholarshipCard
                      key={scholarship.id}
                      scholarship={scholarship}
                      showMatchInfo={magicMatchEnabled}
                      onViewDetails={setSelectedScholarship}
                      isSelected={selectedScholarship?.id === scholarship.id}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Footer */}
            <footer className="mt-auto pt-12 pb-4">
              <div className="border-t border-white/5 pt-6 text-center text-xs text-gray-700">
                <p data-testid="text-footer">
                  &copy; {new Date().getFullYear()} Linku. All rights reserved.
                </p>
                <p className="mt-0.5">Helping Malaysian students discover educational opportunities.</p>
              </div>
            </footer>
          </div>
        </div>

        {/* Desktop detail panel */}
        {selectedScholarship && (
          <div className="hidden md:block w-1/2 h-full border-l border-white/8">
            <ScholarshipDetailPanel
              scholarship={selectedScholarship}
              onClose={() => setSelectedScholarship(null)}
            />
          </div>
        )}
      </div>

      {/* Mobile detail drawer */}
      <ScholarshipDetailDrawer
        scholarship={selectedScholarship}
        isOpen={!!selectedScholarship && isMobile}
        onClose={() => setSelectedScholarship(null)}
      />

      {/* Chat FAB */}
      <motion.div
        className="fixed bottom-5 right-5 z-40"
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleChatToggle}
          className="rounded-full w-13 h-13 w-[52px] h-[52px] bg-blue-600 hover:bg-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.35)] border border-blue-500/40"
          size="icon"
          data-testid="button-open-chat"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      </motion.div>

      <ChatComponent isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        featureName={upgradeFeature.name}
        featureDescription={upgradeFeature.description}
      />
    </div>
  );
}
