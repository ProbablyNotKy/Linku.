import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  ArrowLeft, ArrowRight, User, GraduationCap, Sparkles, CheckCircle2, 
  AlertCircle, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { syncProfile } from "@/lib/api";

const EDUCATION_LEVELS = [
  { value: "SPM", label: "SPM" },
  { value: "Diploma", label: "Diploma" },
  { value: "Degree", label: "Degree / Undergraduate" },
  { value: "Masters", label: "Masters / Postgraduate" },
  { value: "PhD", label: "PhD" },
];

const FIELDS_OF_STUDY = [
  { value: "engineering", label: "Engineering" },
  { value: "medicine", label: "Medicine & Health Sciences" },
  { value: "business", label: "Business & Finance" },
  { value: "it", label: "IT & Computer Science" },
  { value: "arts", label: "Arts & Humanities" },
  { value: "science", label: "Natural Sciences" },
  { value: "law", label: "Law" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleNext = () => {
    if (step === 1 && bio.trim().length < 50) {
      setError("Please write at least 50 characters about yourself.");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!educationLevel) {
      setError("Please select your education level.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await syncProfile({
        bio,
        education_level: educationLevel,
        field_of_study: fieldOfStudy || undefined,
      });

      localStorage.setItem("ascendia_profile_embedding", JSON.stringify(response.embedding));
      localStorage.setItem("ascendia_profile_created", "true");
      
      setSuccess(true);
      
      setTimeout(() => {
        setLocation("/?magic=true");
      }, 2000);
    } catch (err) {
      console.error("Failed to sync profile:", err);
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
            Your AI profile has been generated. Redirecting you to find your best scholarship matches...
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
          <div className="flex items-center gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s === step ? "bg-indigo-400" : s < step ? "bg-green-400" : "bg-indigo-700"
                }`}
              />
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
                <h1 className="text-2xl font-bold text-white">Create Your AI Profile</h1>
                <p className="text-indigo-200">Let us find scholarships that match your story</p>
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

            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2">
                    <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Background</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tell us about yourself</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Share your story, experiences, and achievements
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Example: I am a Form 5 student from Kuala Lumpur with a passion for STEM subjects. I have participated in robotics competitions and won 2nd place at the state level. I volunteer at a local orphanage teaching basic computer skills. My goal is to pursue engineering at a top university..."
                    className="min-h-[200px] resize-none"
                    data-testid="textarea-bio"
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Include: leadership, academics, community service, achievements</span>
                    <span className={bio.length < 50 ? "text-amber-500" : "text-green-500"}>
                      {bio.length} / 50+ characters
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
                  <h3 className="font-medium text-indigo-900 dark:text-indigo-200 mb-2">Tips for a better profile:</h3>
                  <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
                    <li>Mention your academic interests and strengths</li>
                    <li>Include leadership roles or team experiences</li>
                    <li>Describe community service or volunteer work</li>
                    <li>Share your career goals and aspirations</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext} data-testid="button-next">
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Goals</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">What are you looking for?</p>
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
                      Field of Study (Optional)
                    </label>
                    <Select value={fieldOfStudy} onValueChange={setFieldOfStudy}>
                      <SelectTrigger className="w-full" data-testid="select-field-of-study">
                        <SelectValue placeholder="Select your field of interest" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELDS_OF_STUDY.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Your profile will be analyzed by AI to find the best matching scholarships. 
                    The more details you provide, the better the matches will be.
                  </p>
                </div>

                <div className="flex justify-between gap-4">
                  <Button variant="outline" onClick={handleBack} data-testid="button-back">
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
                        Create My AI Profile
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
