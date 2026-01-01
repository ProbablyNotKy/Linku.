import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  ArrowLeft, ArrowRight, GraduationCap, Sparkles, CheckCircle2, 
  AlertCircle, Loader2, User, Target, BookOpen
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
  EDUCATION_LEVELS,
  INCOME_BRACKET_LIST,
  MUET_BANDS,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const STEPS = [
  { id: 1, title: "Academics", icon: GraduationCap },
  { id: 2, title: "Eligibility", icon: Target },
  { id: 3, title: "Interests", icon: BookOpen },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { session, setProfileDirectly } = useAuth();
  const [step, setStep] = useState(1);
  
  // Step 1: Academics
  const [educationLevel, setEducationLevel] = useState("");
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
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        if (!educationLevel) {
          setError("Please select your education level.");
          return false;
        }
        return true;
      case 2:
        if (!householdIncome) {
          setError("Please select your household income bracket.");
          return false;
        }
        if (!state) {
          setError("Please select your state.");
          return false;
        }
        return true;
      case 3:
        if (selectedStudyAreas.length === 0) {
          setError("Please select at least one study area.");
          return false;
        }
        if (bioAchievements.trim().length < 50) {
          setError("Please write at least 50 characters about yourself.");
          return false;
        }
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
        education_level: educationLevel,
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

      // Get fresh session directly from Supabase to ensure we have a valid token
      // The context session might be stale, so we fetch it directly
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const accessToken = freshSession?.access_token || session?.access_token;
      
      console.log("[Onboarding] Creating profile with token:", accessToken ? "present" : "missing");
      
      const createdProfile = await createUserProfile(profileData, accessToken);
      
      // Set the profile ID directly from the API response (bypasses broken column lookup)
      if (createdProfile?.id) {
        setProfileDirectly(createdProfile.id);
      }
      
      setSuccess(true);
      
      // Redirect to Magic Match
      setTimeout(() => {
        setLocation("/?magic=true");
      }, 2000);
    } catch (err) {
      console.error("Failed to create profile:", err);
      setError(err instanceof Error ? err.message : "Failed to create your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 dark:bg-green-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Created!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your scholarship matcher profile is ready. Redirecting you to find your best matches...
          </p>
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Finding matches...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    s.id === step 
                      ? "bg-indigo-400 text-white" 
                      : s.id < step 
                        ? "bg-green-400 text-white" 
                        : "bg-indigo-700 text-indigo-300"
                  }`}
                >
                  {s.id < step ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <s.icon className="w-4 h-4" />
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 ${s.id < step ? "bg-green-400" : "bg-indigo-700"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-2">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Scholarship Matcher</h1>
                <p className="text-indigo-200">Step {step} of 3: {STEPS[step - 1].title}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Academics */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Academic Information</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tell us about your education</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Education Level <span className="text-red-500">*</span>
                    </label>
                    <Select value={educationLevel} onValueChange={setEducationLevel}>
                      <SelectTrigger className="w-full" data-testid="select-education-level">
                        <SelectValue placeholder="Select your education level" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CGPA (Optional)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g., 3.50"
                      data-testid="input-cgpa"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter your current or expected CGPA (0-4 scale)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SPM A's (Optional)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="12"
                      value={spmAs}
                      onChange={(e) => setSpmAs(e.target.value)}
                      placeholder="e.g., 8"
                      data-testid="input-spm-as"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Number of A's obtained in SPM (0-12)</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    English Proficiency (Optional)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Enter any English test scores you have. We use cross-test equivalence to match scholarships.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        MUET Band
                      </label>
                      <Select value={muetBand} onValueChange={setMuetBand}>
                        <SelectTrigger className="w-full" data-testid="select-muet-band">
                          <SelectValue placeholder="Select Band" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Result Yet</SelectItem>
                          <SelectItem value="1">Band 1</SelectItem>
                          <SelectItem value="2">Band 2</SelectItem>
                          <SelectItem value="3">Band 3</SelectItem>
                          <SelectItem value="4">Band 4</SelectItem>
                          <SelectItem value="5">Band 5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        IELTS Score
                      </label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="9"
                        value={ieltsScore}
                        onChange={(e) => setIeltsScore(e.target.value)}
                        placeholder="e.g., 6.5"
                        data-testid="input-ielts-score"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        SPM English Grade
                      </label>
                      <Select value={spmEnglishGrade} onValueChange={setSpmEnglishGrade}>
                        <SelectTrigger className="w-full" data-testid="select-spm-english">
                          <SelectValue placeholder="Select Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Result Yet</SelectItem>
                          {SPM_ENGLISH_GRADES.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={handleNext} data-testid="button-next-step1">
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Eligibility */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2">
                    <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Eligibility Details</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Help us filter scholarships for you</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Household Income <span className="text-red-500">*</span>
                    </label>
                    <Select value={householdIncome} onValueChange={setHouseholdIncome}>
                      <SelectTrigger className="w-full" data-testid="select-household-income">
                        <SelectValue placeholder="Select income bracket" />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME_BRACKET_LIST.map((bracket) => (
                          <SelectItem key={bracket.value} value={bracket.value}>
                            {bracket.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger className="w-full" data-testid="select-state">
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent>
                        {MALAYSIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bumiputera Status
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Some scholarships are exclusive to Bumiputera applicants
                      </p>
                    </div>
                    <Switch
                      checked={isBumiputera}
                      onCheckedChange={setIsBumiputera}
                      data-testid="switch-bumiputera"
                    />
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <Button variant="outline" onClick={handleBack} data-testid="button-back-step2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} data-testid="button-next-step2">
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Interests & Achievements</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">What are you passionate about?</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Study Areas <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Select the fields you're interested in</p>
                  <div className="flex flex-wrap gap-2">
                    {STUDY_AREAS.map((area) => (
                      <Badge
                        key={area}
                        variant={selectedStudyAreas.includes(area) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          selectedStudyAreas.includes(area)
                            ? "bg-indigo-600 text-white"
                            : "hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Story & Achievements <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={bioAchievements}
                    onChange={(e) => setBioAchievements(e.target.value)}
                    placeholder="Share your story: academic achievements, leadership experiences, community service, extracurricular activities, and career goals. The more details you provide, the better we can match you with scholarships."
                    className="min-h-[150px] resize-none"
                    data-testid="textarea-bio-achievements"
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Include: leadership, academics, service, achievements</span>
                    <span className={bioAchievements.length < 50 ? "text-amber-500" : "text-green-500"}>
                      {bioAchievements.length} / 50+ characters
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
                  <h3 className="font-medium text-indigo-900 dark:text-indigo-200 mb-2">Tips for a better match:</h3>
                  <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
                    <li>Mention specific competitions or awards you've won</li>
                    <li>Include leadership roles in clubs or organizations</li>
                    <li>Describe community service or volunteer work</li>
                    <li>Share your career aspirations and goals</li>
                  </ul>
                </div>

                <div className="flex justify-between gap-4">
                  <Button variant="outline" onClick={handleBack} data-testid="button-back-step3">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    data-testid="button-create-profile"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Find My Scholarships
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
