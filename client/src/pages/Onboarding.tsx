import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ArrowRight, GraduationCap, Sparkles, CheckCircle2, 
  AlertCircle, Loader2, Target, BookOpen, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  createUserProfile, 
  MALAYSIAN_STATES, 
  STUDY_AREAS, 
  SPM_ENGLISH_GRADES,
  INCOME_BRACKET_LIST,
  MUET_BANDS,
  HIGHEST_QUALIFICATIONS,
  INTENDED_STUDY_LEVELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type Step1Phase = "qualification" | "study-level" | "details";

const STEPS = [
  { id: 1, title: "Academics", icon: GraduationCap },
  { id: 2, title: "Eligibility", icon: Target },
  { id: 3, title: "Interests", icon: BookOpen },
];

function CardOption({
  value,
  label,
  desc,
  selected,
  onClick,
  testId,
}: {
  value: string;
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      data-testid={testId}
      className={`relative w-full text-left rounded-xl border px-5 py-4 transition-all duration-150 cursor-pointer group
        ${selected
          ? "bg-blue-600/20 border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.5)]"
          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20"
        }`}
    >
      {selected && (
        <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-blue-500">
          <Check className="w-3 h-3 text-white" />
        </span>
      )}
      <p className={`font-semibold text-sm mb-0.5 ${selected ? "text-blue-300" : "text-white"}`}>{label}</p>
      <p className="text-xs text-gray-500 leading-snug">{desc}</p>
    </motion.button>
  );
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { session, setProfileDirectly } = useAuth();
  const [step, setStep] = useState(1);
  const [step1Phase, setStep1Phase] = useState<Step1Phase>("qualification");

  // Step 1a: Qualification + Study Level (new v2 fields)
  const [highestQualification, setHighestQualification] = useState("");
  const [intendedStudyLevel, setIntendedStudyLevel] = useState("");

  // Step 1b: Academic details
  const [cgpa, setCgpa] = useState<string>("");
  const [spmAs, setSpmAs] = useState<string>("");

  // English Proficiency (optional)
  const [muetBand, setMuetBand] = useState<string>("");
  const [ieltsScore, setIeltsScore] = useState<string>("");
  const [spmEnglishGrade, setSpmEnglishGrade] = useState<string>("");

  // Step 2: Eligibility
  const [householdIncome, setHouseholdIncome] = useState("");
  const [state, setState] = useState("");
  const [isBumiputera, setIsBumiputera] = useState(false);

  // Step 3: Interests
  const [selectedStudyAreas, setSelectedStudyAreas] = useState<string[]>([]);
  const [bioAchievements, setBioAchievements] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const toggleStudyArea = (area: string) => {
    setSelectedStudyAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleStep1Next = () => {
    setError("");
    if (step1Phase === "qualification") {
      if (!highestQualification) {
        setError("Please select your highest completed qualification.");
        return;
      }
      setStep1Phase("study-level");
    } else if (step1Phase === "study-level") {
      if (!intendedStudyLevel) {
        setError("Please select the study level you're seeking funding for.");
        return;
      }
      setStep1Phase("details");
    } else {
      setStep(2);
    }
  };

  const handleStep1Back = () => {
    setError("");
    if (step1Phase === "study-level") setStep1Phase("qualification");
    else if (step1Phase === "details") setStep1Phase("study-level");
  };

  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 2:
        if (!householdIncome) { setError("Please select your household income bracket."); return false; }
        if (!state) { setError("Please select your state."); return false; }
        return true;
      case 3:
        if (selectedStudyAreas.length === 0) { setError("Please select at least one study area."); return false; }
        if (bioAchievements.trim().length < 50) { setError("Please write at least 50 characters about yourself."); return false; }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    setError("");

    try {
      const profileData = {
        highest_qualification: highestQualification || null,
        intended_study_level: intendedStudyLevel || null,
        cgpa: cgpa ? parseFloat(cgpa) : null,
        spm_as: spmAs ? parseInt(spmAs, 10) : null,
        household_income: householdIncome,
        state: state,
        is_bumiputera: isBumiputera,
        study_areas: selectedStudyAreas,
        bio_achievements: bioAchievements,
        muet_band: muetBand && muetBand !== "none" ? parseFloat(muetBand) : null,
        ielts_score: ieltsScore ? parseFloat(ieltsScore) : null,
        spm_english_grade: spmEnglishGrade && spmEnglishGrade !== "none" ? spmEnglishGrade : null,
      };

      let accessToken: string | undefined;
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      const hasAuthSignal = !!supabaseUser || !!session;
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      accessToken = freshSession?.access_token;

      if (!accessToken && hasAuthSignal) {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        accessToken = refreshedSession?.access_token;
      }
      if (!accessToken && session?.access_token) accessToken = session.access_token;

      if (hasAuthSignal && !accessToken) {
        throw new Error("Unable to verify your session. Please try logging out and back in.");
      }

      const createdProfile = await createUserProfile(profileData, accessToken);
      if (createdProfile?.id) setProfileDirectly(createdProfile.id);

      setSuccess(true);
      setTimeout(() => setLocation("/?magic=true"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/[0.04] border border-white/8 rounded-2xl p-10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Created!</h2>
          <p className="text-gray-400 mb-4">Your scholarship matcher profile is ready. Finding your matches now…</p>
          <div className="flex items-center justify-center gap-2 text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Redirecting…</span>
          </div>
        </motion.div>
      </main>
    );
  }

  const phaseLabel =
    step1Phase === "qualification"
      ? "Your Qualification"
      : step1Phase === "study-level"
      ? "Funding Goal"
      : "Academic Details";

  return (
    <main className="min-h-screen bg-[#0B0F19]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s.id === step
                      ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                      : s.id < step
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                      : "bg-white/5 border border-white/10 text-gray-600"
                  }`}
                >
                  {s.id < step ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-8 h-px mx-1 ${s.id < step ? "bg-emerald-500/40" : "bg-white/8"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <motion.div
          key={`${step}-${step1Phase}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden"
        >
          {/* Card header */}
          <div className="px-8 py-5 border-b border-white/6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Scholarship Matcher</h1>
              <p className="text-xs text-gray-500">
                Step {step} of 3: {step === 1 ? phaseLabel : STEPS[step - 1].title}
              </p>
            </div>
          </div>

          <div className="p-8">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ─── STEP 1 — Phase: Qualification ─── */}
            {step === 1 && step1Phase === "qualification" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">What is your highest completed qualification?</h2>
                  <p className="text-sm text-gray-500">Select the highest level of education you have finished.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HIGHEST_QUALIFICATIONS.map((q) => (
                    <CardOption
                      key={q.value}
                      value={q.value}
                      label={q.label}
                      desc={q.desc}
                      selected={highestQualification === q.value}
                      onClick={() => { setHighestQualification(q.value); setError(""); }}
                      testId={`card-qualification-${q.value.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                    />
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleStep1Next} className="bg-blue-600 hover:bg-blue-700 gap-2" data-testid="button-next-qualification">
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ─── STEP 1 — Phase: Study Level ─── */}
            {step === 1 && step1Phase === "study-level" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">What level of study are you seeking funding for?</h2>
                  <p className="text-sm text-gray-500">This is the programme you want the scholarship to pay for.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INTENDED_STUDY_LEVELS.map((l) => (
                    <CardOption
                      key={l.value}
                      value={l.value}
                      label={l.label}
                      desc={l.desc}
                      selected={intendedStudyLevel === l.value}
                      onClick={() => { setIntendedStudyLevel(l.value); setError(""); }}
                      testId={`card-study-level-${l.value.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={handleStep1Back} className="text-gray-400 hover:text-white gap-2" data-testid="button-back-study-level">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button onClick={handleStep1Next} className="bg-blue-600 hover:bg-blue-700 gap-2" data-testid="button-next-study-level">
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ─── STEP 1 — Phase: Academic Details ─── */}
            {step === 1 && step1Phase === "details" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Academic Details</h2>
                  <p className="text-sm text-gray-500">Optional — but the more you share, the better your matches.</p>
                </div>

                {/* Selected summary */}
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/8">
                  {highestQualification && (
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-600/15 text-blue-300 border border-blue-500/20">
                      ✓ {highestQualification}
                    </span>
                  )}
                  {intendedStudyLevel && (
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-600/15 text-emerald-300 border border-emerald-500/20">
                      → {intendedStudyLevel}
                    </span>
                  )}
                </div>

                <div className="grid gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CGPA (Optional)</label>
                    <Input
                      type="number" step="0.01" min="0" max="4"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g., 3.50"
                      className="bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500"
                      data-testid="input-cgpa"
                    />
                    <p className="text-xs text-gray-600 mt-1">Current or expected CGPA (0–4 scale)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">SPM A's (Optional)</label>
                    <Input
                      type="number" min="0" max="12"
                      value={spmAs}
                      onChange={(e) => setSpmAs(e.target.value)}
                      placeholder="e.g., 8"
                      className="bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500"
                      data-testid="input-spm-as"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/6">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">English Proficiency (Optional)</h3>
                  <p className="text-xs text-gray-600 mb-4">We use cross-test equivalence — just enter whichever test you have.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">MUET Band</label>
                      <Select value={muetBand} onValueChange={setMuetBand}>
                        <SelectTrigger className="bg-white/[0.04] border-white/10 text-white" data-testid="select-muet-band">
                          <SelectValue placeholder="Band" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Result Yet</SelectItem>
                          {[1,2,3,4,5].map(b => <SelectItem key={b} value={String(b)}>Band {b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">IELTS Score</label>
                      <Input
                        type="number" step="0.5" min="0" max="9"
                        value={ieltsScore}
                        onChange={(e) => setIeltsScore(e.target.value)}
                        placeholder="e.g., 6.5"
                        className="bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600"
                        data-testid="input-ielts-score"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">SPM English</label>
                      <Select value={spmEnglishGrade} onValueChange={setSpmEnglishGrade}>
                        <SelectTrigger className="bg-white/[0.04] border-white/10 text-white" data-testid="select-spm-english">
                          <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Result Yet</SelectItem>
                          {SPM_ENGLISH_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={handleStep1Back} className="text-gray-400 hover:text-white gap-2" data-testid="button-back-details">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button onClick={handleStep1Next} className="bg-blue-600 hover:bg-blue-700 gap-2" data-testid="button-next-step1">
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ─── STEP 2: Eligibility ─── */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Eligibility Details</h2>
                  <p className="text-sm text-gray-500">Helps us filter out scholarships you don't qualify for.</p>
                </div>

                <div className="grid gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Household Income <span className="text-red-400">*</span>
                    </label>
                    <Select value={householdIncome} onValueChange={setHouseholdIncome}>
                      <SelectTrigger className="bg-white/[0.04] border-white/10 text-white" data-testid="select-household-income">
                        <SelectValue placeholder="Select income bracket" />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME_BRACKET_LIST.map((b) => (
                          <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      State <span className="text-red-400">*</span>
                    </label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger className="bg-white/[0.04] border-white/10 text-white" data-testid="select-state">
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent>
                        {MALAYSIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/8">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Bumiputera Status</p>
                      <p className="text-xs text-gray-600 mt-0.5">Some scholarships are exclusive to Bumiputera applicants</p>
                    </div>
                    <Switch checked={isBumiputera} onCheckedChange={setIsBumiputera} data-testid="switch-bumiputera" />
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={handleBack} className="text-gray-400 hover:text-white gap-2" data-testid="button-back-step2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2" data-testid="button-next-step2">
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: Interests ─── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Interests & Achievements</h2>
                  <p className="text-sm text-gray-500">What are you passionate about?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Study Areas <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-gray-600 mb-3">Select the fields you're interested in</p>
                  <div className="flex flex-wrap gap-2">
                    {STUDY_AREAS.map((area) => (
                      <Badge
                        key={area}
                        variant={selectedStudyAreas.includes(area) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors text-xs ${
                          selectedStudyAreas.includes(area)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-white/15 text-gray-400 hover:border-blue-500/50 hover:text-gray-200"
                        }`}
                        onClick={() => toggleStudyArea(area)}
                        data-testid={`badge-study-area-${area.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Story & Achievements <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    value={bioAchievements}
                    onChange={(e) => setBioAchievements(e.target.value)}
                    placeholder="Share your story: academic achievements, leadership experiences, community service, extracurricular activities, and career goals. The more details you provide, the better we can match you with scholarships."
                    className="min-h-[150px] resize-none bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500"
                    data-testid="textarea-bio-achievements"
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>Include: leadership, academics, service, achievements</span>
                    <span className={bioAchievements.length < 50 ? "text-amber-500" : "text-emerald-400"}>
                      {bioAchievements.length} / 50+ chars
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-600/8 border border-blue-500/15">
                  <p className="text-xs font-semibold text-blue-300 mb-2">Tips for a better match:</p>
                  <ul className="text-xs text-blue-400/80 space-y-1">
                    <li>• Mention specific competitions or awards you've won</li>
                    <li>• Include leadership roles in clubs or organizations</li>
                    <li>• Describe community service or volunteer work</li>
                    <li>• Share your career aspirations and goals</li>
                  </ul>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={handleBack} className="text-gray-400 hover:text-white gap-2" data-testid="button-back-step3">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                    data-testid="button-create-profile"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating Profile…</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Find My Scholarships</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
