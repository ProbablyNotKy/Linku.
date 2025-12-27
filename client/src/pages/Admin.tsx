import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { 
  Shield, CheckCircle2, AlertCircle, Plus, ArrowLeft, 
  Pencil, Trash2, Search, GraduationCap, Clock, AlertTriangle,
  X, Globe, Eye, ChevronDown, ChevronUp, Bot, LinkIcon, LogIn
} from "lucide-react";
import { Scholarship, MALAYSIAN_STATES, STUDY_AREAS, SPM_ENGLISH_GRADES, EDUCATION_LEVELS } from "@shared/schema";
import { 
  fetchScholarships, 
  createScholarship, 
  updateScholarship, 
  deleteScholarship,
  ScholarshipCreate,
  scrapeUrls,
  fetchDrafts,
  publishDraft,
  rejectDraft,
  updateDraft,
  Draft,
  DraftUpdate
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface FormData {
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  education_levels: string[];  // Multi-select array, empty = open to all
  url: string;
  tags: string;
  study_areas: string[];
  min_cgpa: string;
  min_spm_as: string;
  household_income_max: string;
  state_restriction: string;
  is_bumiputera_only: boolean;
  ai_matching_context: string;
}

const emptyFormData: FormData = {
  title: "",
  provider: "",
  amount: "",
  deadline: "",
  education_levels: [],  // Empty = open to all
  url: "",
  tags: "",
  study_areas: [],
  min_cgpa: "",
  min_spm_as: "",
  household_income_max: "",
  state_restriction: "",
  is_bumiputera_only: false,
  ai_matching_context: "",
};

export default function Admin() {
  const { user, session, isLoading: authLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      setLocation("/");
    }
  }, [authLoading, isAdmin, setLocation]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [activeTab, setActiveTab] = useState<"scholarships" | "discovery">("scholarships");
  const [scrapeUrlList, setScrapeUrlList] = useState<string[]>([""]);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [expandedDraftId, setExpandedDraftId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [draftFormData, setDraftFormData] = useState<DraftUpdate>({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);

  const accessToken = session?.access_token;
  const isAuthenticated = !!user;

  const handleApiError = (err: unknown) => {
    if (err instanceof Error && (err.message.includes("[403]") || err.message.includes("403"))) {
      setIsForbidden(true);
      return true;
    }
    return false;
  };

  const loadDrafts = async () => {
    if (!accessToken) return;
    setIsLoadingDrafts(true);
    try {
      const data = await fetchDrafts("pending", accessToken);
      setDrafts(data);
    } catch (err) {
      console.error("Failed to load drafts:", err);
      if (!handleApiError(err)) {
        setErrorMessage("Failed to load drafts");
      }
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  const addUrlField = () => {
    setScrapeUrlList([...scrapeUrlList, ""]);
  };

  const removeUrlField = (index: number) => {
    if (scrapeUrlList.length > 1) {
      setScrapeUrlList(scrapeUrlList.filter((_, i) => i !== index));
    }
  };

  const updateUrlField = (index: number, value: string) => {
    const updated = [...scrapeUrlList];
    updated[index] = value;
    setScrapeUrlList(updated);
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    const validUrls = scrapeUrlList.filter(url => url.trim());
    if (validUrls.length === 0) return;
    
    setIsScrapingUrl(true);
    setSuccessMessage("");
    setErrorMessage("");
    
    try {
      const result = await scrapeUrls(validUrls, accessToken);
      setSuccessMessage(result.message);
      setScrapeUrlList([""]);
      await loadDrafts();
    } catch (err) {
      console.error("Failed to scrape URLs:", err);
      if (!handleApiError(err)) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to scrape URLs");
      }
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const openEditDraft = (draft: Draft) => {
    setEditingDraft(draft);
    setDraftFormData({
      title: draft.title || "",
      provider: draft.provider || "",
      amount: draft.amount || "",
      deadline: draft.deadline || "",
      education_level: draft.education_level || [],  // Array or empty for "open to all"
      url: draft.url || "",
      description: draft.description || "",
      study_areas: draft.study_areas || [],
      min_cgpa: draft.min_cgpa,
      min_spm_as: draft.min_spm_as,
      household_income_max: draft.household_income_max,
      state_restriction: draft.state_restriction,
      is_bumiputera_only: draft.is_bumiputera_only || false,
      ai_matching_context: draft.ai_matching_context || "",
      min_muet: draft.min_muet,
      min_ielts: draft.min_ielts,
      min_spm_english: draft.min_spm_english
    });
  };

  const closeEditDraft = () => {
    setEditingDraft(null);
    setDraftFormData({});
  };

  const handleSaveDraft = async () => {
    if (!editingDraft || !accessToken) return;
    
    setIsSavingDraft(true);
    try {
      await updateDraft(editingDraft.id, draftFormData, accessToken);
      setSuccessMessage("Draft updated successfully");
      closeEditDraft();
      await loadDrafts();
    } catch (err) {
      console.error("Failed to save draft:", err);
      if (!handleApiError(err)) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to save draft");
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async (id: number) => {
    if (!accessToken) return;
    setPublishingId(id);
    try {
      const result = await publishDraft(id, accessToken);
      setSuccessMessage(result.message);
      await loadDrafts();
      await loadScholarships();
    } catch (err) {
      console.error("Failed to publish draft:", err);
      if (!handleApiError(err)) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to publish draft");
      }
    } finally {
      setPublishingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!accessToken) return;
    setRejectingId(id);
    try {
      await rejectDraft(id, accessToken);
      setSuccessMessage("Draft rejected successfully");
      await loadDrafts();
    } catch (err) {
      console.error("Failed to reject draft:", err);
      if (!handleApiError(err)) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to reject draft");
      }
    } finally {
      setRejectingId(null);
    }
  };

  const loadScholarships = async () => {
    setIsLoading(true);
    try {
      const data = await fetchScholarships();
      setScholarships(data);
    } catch (err) {
      console.error("Failed to load scholarships:", err);
      setErrorMessage("Failed to load scholarships");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadScholarships();
      loadDrafts();
    }
  }, [isAuthenticated]);

  const filteredScholarships = useMemo(() => {
    if (!searchQuery.trim()) return scholarships;
    const query = searchQuery.toLowerCase();
    return scholarships.filter(s => 
      s.title.toLowerCase().includes(query) ||
      s.provider.toLowerCase().includes(query) ||
      (s.education_level && s.education_level.some(level => level.toLowerCase().includes(query)))
    );
  }, [scholarships, searchQuery]);

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringSoon = scholarships.filter(s => {
      const deadline = new Date(s.deadline);
      return deadline > now && deadline <= thirtyDaysFromNow;
    }).length;
    
    const expired = scholarships.filter(s => new Date(s.deadline) < now).length;
    
    return {
      total: scholarships.length,
      expiringSoon,
      expired,
      active: scholarships.length - expired,
    };
  }, [scholarships]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyFormData);
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const openEditForm = (scholarship: Scholarship) => {
    setEditingId(scholarship.id);
    setFormData({
      title: scholarship.title,
      provider: scholarship.provider,
      amount: scholarship.amount,
      deadline: scholarship.deadline,
      education_levels: scholarship.education_level || [],  // Array or empty for "open to all"
      url: scholarship.url || "",
      tags: scholarship.tags?.join(", ") || "",
      study_areas: scholarship.study_areas || [],
      min_cgpa: scholarship.min_cgpa?.toString() || "",
      min_spm_as: scholarship.min_spm_as?.toString() || "",
      household_income_max: scholarship.household_income_max?.toString() || "",
      state_restriction: scholarship.state_restriction || "",
      is_bumiputera_only: scholarship.is_bumiputera_only || false,
      ai_matching_context: scholarship.ai_matching_context || "",
    });
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const scholarshipData: ScholarshipCreate = {
        title: formData.title,
        provider: formData.provider,
        amount: formData.amount,
        deadline: formData.deadline,
        education_level: formData.education_levels.length > 0 ? formData.education_levels : null,  // null = open to all
        url: formData.url || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        study_areas: formData.study_areas.length > 0 ? formData.study_areas : undefined,
        min_cgpa: formData.min_cgpa ? parseFloat(formData.min_cgpa) : null,
        min_spm_as: formData.min_spm_as ? parseInt(formData.min_spm_as, 10) : null,
        household_income_max: formData.household_income_max ? parseFloat(formData.household_income_max) : null,
        state_restriction: formData.state_restriction || null,
        is_bumiputera_only: formData.is_bumiputera_only,
        ai_matching_context: formData.ai_matching_context || null,
      };

      if (editingId) {
        await updateScholarship(editingId, scholarshipData, accessToken);
        setSuccessMessage("Scholarship updated successfully!");
      } else {
        await createScholarship(scholarshipData, accessToken);
        setSuccessMessage("Scholarship created successfully!");
      }

      closeForm();
      await loadScholarships();
    } catch (err) {
      console.error("Failed to save scholarship:", err);
      if (!handleApiError(err)) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to save scholarship");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!accessToken) return;
    setIsDeleting(true);
    try {
      await deleteScholarship(id, accessToken);
      setSuccessMessage("Scholarship deleted successfully!");
      setDeleteConfirmId(null);
      await loadScholarships();
    } catch (err) {
      console.error("Failed to delete scholarship:", err);
      if (!handleApiError(err)) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to delete scholarship");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const isDeadlineSoon = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return deadlineDate > now && deadlineDate.getTime() - now.getTime() <= thirtyDays;
  };

  const isExpired = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-4">
              <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Admin Access Required
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            You need to sign in with an authorized account to access the admin dashboard.
          </p>

          <button
            onClick={() => setLocation("/login")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            data-testid="button-go-to-login"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </button>

          <div className="mt-4 text-center">
            <Link 
              href="/"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              data-testid="link-back"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isForbidden) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-100 dark:bg-red-900 rounded-full p-4">
              <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Admin Access Required
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
            You are signed in as:
          </p>
          <p className="text-gray-900 dark:text-white text-center font-medium mb-4" data-testid="text-user-email">
            {user?.email}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            This account does not have admin privileges. Please contact the administrator to request access.
          </p>

          <Link 
            href="/"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
            data-testid="link-back-home"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-indigo-200 mt-1">
                Manage Ascendia Scholarships
                {user?.email && (
                  <span className="ml-2 text-indigo-300" data-testid="text-admin-email">
                    ({user.email})
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors"
              data-testid="link-back-home"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <div 
            className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-6"
            data-testid="success-message"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage("")} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMessage && !showForm && (
          <div 
            className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6"
            data-testid="error-message"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage("")} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("scholarships")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "scholarships"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            }`}
            data-testid="tab-scholarships"
          >
            <GraduationCap className="w-4 h-4" />
            Scholarships
          </button>
          <button
            onClick={() => setActiveTab("discovery")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "discovery"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            }`}
            data-testid="tab-discovery"
          >
            <Bot className="w-4 h-4" />
            Discovery Agent
            {drafts.length > 0 && (
              <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {drafts.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "scholarships" && (
        <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-900 rounded-lg p-2">
                <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 rounded-lg p-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 dark:bg-amber-900 rounded-lg p-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expiringSoon}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Expiring Soon</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-900 rounded-lg p-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expired}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Expired</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                All Scholarships
              </h2>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-search"
                  />
                </div>
                <button
                  onClick={openCreateForm}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                  data-testid="button-add-new"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Loading scholarships...</p>
            </div>
          ) : filteredScholarships.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? "No scholarships match your search." : "No scholarships found. Add one to get started!"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Provider</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deadline</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Level</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredScholarships.map((scholarship) => (
                    <tr 
                      key={scholarship.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isExpired(scholarship.deadline) ? 'opacity-50' : ''}`}
                      data-testid={`row-scholarship-${scholarship.id}`}
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{scholarship.title}</div>
                        {scholarship.tags && scholarship.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {scholarship.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{scholarship.provider}</td>
                      <td className="px-4 py-4 text-green-600 dark:text-green-400 font-medium">{scholarship.amount}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 ${
                          isExpired(scholarship.deadline) 
                            ? 'text-red-600 dark:text-red-400' 
                            : isDeadlineSoon(scholarship.deadline) 
                              ? 'text-amber-600 dark:text-amber-400' 
                              : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {isExpired(scholarship.deadline) && <AlertTriangle className="w-3 h-3" />}
                          {isDeadlineSoon(scholarship.deadline) && !isExpired(scholarship.deadline) && <Clock className="w-3 h-3" />}
                          {scholarship.deadline}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                        {scholarship.education_level && scholarship.education_level.length > 0 
                          ? scholarship.education_level.join(", ") 
                          : <span className="text-indigo-600 dark:text-indigo-400">All Levels</span>}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(scholarship)}
                            className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            data-testid={`button-edit-${scholarship.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(scholarship.id)}
                            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            data-testid={`button-delete-${scholarship.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}

        {activeTab === "discovery" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900 rounded-lg p-2">
                  <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Discovery Agent</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add multiple URLs to research scholarship details across pages</p>
                </div>
              </div>

              <form onSubmit={handleScrape} className="space-y-3">
                {scrapeUrlList.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateUrlField(index, e.target.value)}
                        placeholder={index === 0 ? "Main scholarship page URL" : "Additional page (eligibility, FAQ, etc.)"}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        data-testid={`input-scrape-url-${index}`}
                      />
                    </div>
                    {scrapeUrlList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUrlField(index)}
                        className="p-2.5 text-gray-400 hover:text-red-500 rounded-lg"
                        data-testid={`button-remove-url-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={addUrlField}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm"
                    data-testid="button-add-url"
                  >
                    <Plus className="w-4 h-4" />
                    Add another URL
                  </button>
                  
                  <div className="flex-1" />
                  
                  <button
                    type="submit"
                    disabled={isScrapingUrl || scrapeUrlList.every(u => !u.trim())}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                    data-testid="button-scrape"
                  >
                    {isScrapingUrl ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Research Scholarship
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pending Drafts ({drafts.length})
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review AI-extracted scholarships before publishing
                </p>
              </div>

              {isLoadingDrafts ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Loading drafts...</p>
                </div>
              ) : drafts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No pending drafts. Scan a website to discover scholarships.
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="p-4" data-testid={`draft-${draft.id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {draft.title || "Untitled Scholarship"}
                            </h4>
                            <button
                              onClick={() => setExpandedDraftId(expandedDraftId === draft.id ? null : draft.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              data-testid={`button-expand-${draft.id}`}
                            >
                              {expandedDraftId === draft.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                            {draft.provider && <span>Provider: {draft.provider}</span>}
                            {draft.amount && <span className="text-green-600 dark:text-green-400">{draft.amount}</span>}
                            {draft.deadline && <span>Deadline: {draft.deadline}</span>}
                            {draft.education_level && draft.education_level.length > 0 
                              ? <span>Level: {draft.education_level.join(", ")}</span>
                              : <span className="text-indigo-600 dark:text-indigo-400">All Levels</span>}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {draft.study_areas?.map((area, i) => (
                              <span key={i} className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                                {area}
                              </span>
                            ))}
                            {draft.min_cgpa && (
                              <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                                Min CGPA: {draft.min_cgpa}
                              </span>
                            )}
                            {draft.is_bumiputera_only && (
                              <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                                Bumiputera Only
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditDraft(draft)}
                            className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 rounded-lg transition-colors"
                            data-testid={`button-edit-draft-${draft.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handlePublish(draft.id)}
                            disabled={publishingId === draft.id}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                            data-testid={`button-approve-${draft.id}`}
                          >
                            {publishingId === draft.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(draft.id)}
                            disabled={rejectingId === draft.id}
                            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                            data-testid={`button-reject-${draft.id}`}
                          >
                            {rejectingId === draft.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Reject
                          </button>
                        </div>
                      </div>

                      {expandedDraftId === draft.id && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                          {draft.description && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Description</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{draft.description}</p>
                            </div>
                          )}
                          {draft.source_quote && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Source Quote (for verification)
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-amber-50 dark:bg-amber-900/20 p-2 rounded border-l-2 border-amber-400">
                                "{draft.source_quote}"
                              </p>
                            </div>
                          )}
                          {draft.url && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Source URL</p>
                              <a 
                                href={draft.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                              >
                                {draft.url}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Scholarship" : "Create New Scholarship"}
              </h3>
              <button
                onClick={closeForm}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg"
                data-testid="button-close-form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {errorMessage && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Yayasan Khazanah Scholarship"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Provider <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="provider"
                    value={formData.provider}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Yayasan Khazanah"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-provider"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., RM 50,000 / year"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-deadline"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Education Levels
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
                      <input
                        type="checkbox"
                        checked={formData.education_levels.length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, education_levels: [] }));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        data-testid="checkbox-open-to-all"
                      />
                      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Open to All Levels</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                      {EDUCATION_LEVELS.map((level) => (
                        <label key={level} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.education_levels.includes(level)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  education_levels: [...prev.education_levels, level] 
                                }));
                              } else {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  education_levels: prev.education_levels.filter(l => l !== level) 
                                }));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            data-testid={`checkbox-level-${level.toLowerCase().replace(/[^a-z]/g, '-')}`}
                          />
                          <span className="text-gray-700 dark:text-gray-300">{level}</span>
                        </label>
                      ))}
                    </div>
                    {formData.education_levels.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Selected: {formData.education_levels.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/apply"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-url"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., Merit, STEM, Overseas (comma separated)"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  data-testid="input-tags"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Separate multiple tags with commas
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  Eligibility Criteria (Optional)
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Study Areas
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {STUDY_AREAS.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => {
                          const current = formData.study_areas || [];
                          if (current.includes(area)) {
                            setFormData({...formData, study_areas: current.filter(a => a !== area)});
                          } else {
                            setFormData({...formData, study_areas: [...current, area]});
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formData.study_areas?.includes(area)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                        data-testid={`toggle-study-${area.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Min CGPA
                    </label>
                    <input
                      type="number"
                      name="min_cgpa"
                      value={formData.min_cgpa}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      max="4"
                      placeholder="e.g., 3.5"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="input-min-cgpa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Min SPM A's
                    </label>
                    <input
                      type="number"
                      name="min_spm_as"
                      value={formData.min_spm_as}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      placeholder="e.g., 5"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="input-min-spm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Household Income (RM)
                    </label>
                    <input
                      type="number"
                      name="household_income_max"
                      value={formData.household_income_max}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="e.g., 5000"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="input-income-max"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State Restriction
                    </label>
                    <select
                      name="state_restriction"
                      value={formData.state_restriction}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="select-state-restriction"
                    >
                      <option value="">All states eligible</option>
                      {MALAYSIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_bumiputera_only}
                        onChange={(e) => setFormData({...formData, is_bumiputera_only: e.target.checked})}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        data-testid="checkbox-bumiputera"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bumiputera Only
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    AI Matching Context
                  </label>
                  <textarea
                    name="ai_matching_context"
                    value={formData.ai_matching_context}
                    onChange={(e) => setFormData({...formData, ai_matching_context: e.target.value})}
                    rows={3}
                    placeholder="Describe the ideal candidate for improved AI matching (e.g., 'Values leadership and community service in rural areas')"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    data-testid="textarea-ai-context"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This helps the AI match students more accurately
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-lg transition-colors"
                  data-testid="button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  data-testid="button-save"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingId ? "Update Scholarship" : "Create Scholarship"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 dark:bg-red-900 rounded-full p-3">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Scholarship
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this scholarship? Students will no longer be able to see it.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-lg transition-colors"
                data-testid="button-cancel-delete"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                data-testid="button-confirm-delete"
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingDraft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Draft Before Publishing
              </h3>
              <button
                onClick={closeEditDraft}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg"
                data-testid="button-close-edit-draft"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={draftFormData.title || ""}
                    onChange={(e) => setDraftFormData({...draftFormData, title: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-draft-title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
                  <input
                    type="text"
                    value={draftFormData.provider || ""}
                    onChange={(e) => setDraftFormData({...draftFormData, provider: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-draft-provider"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <input
                    type="text"
                    value={draftFormData.amount || ""}
                    onChange={(e) => setDraftFormData({...draftFormData, amount: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-draft-amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={draftFormData.deadline || ""}
                    onChange={(e) => setDraftFormData({...draftFormData, deadline: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-draft-deadline"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Education Levels</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
                      <input
                        type="checkbox"
                        checked={!draftFormData.education_level || draftFormData.education_level.length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDraftFormData({...draftFormData, education_level: []});
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        data-testid="checkbox-draft-open-to-all"
                      />
                      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Open to All Levels</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 max-h-40 overflow-y-auto">
                      {EDUCATION_LEVELS.map((level) => (
                        <label key={level} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={(draftFormData.education_level || []).includes(level)}
                            onChange={(e) => {
                              const currentLevels = draftFormData.education_level || [];
                              if (e.target.checked) {
                                setDraftFormData({...draftFormData, education_level: [...currentLevels, level]});
                              } else {
                                setDraftFormData({...draftFormData, education_level: currentLevels.filter(l => l !== level)});
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            data-testid={`checkbox-draft-level-${level.toLowerCase().replace(/[^a-z]/g, '-')}`}
                          />
                          <span className="text-gray-700 dark:text-gray-300">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                  <input
                    type="url"
                    value={draftFormData.url || ""}
                    onChange={(e) => setDraftFormData({...draftFormData, url: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-draft-url"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Eligibility Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={draftFormData.min_cgpa ?? ""}
                      onChange={(e) => setDraftFormData({...draftFormData, min_cgpa: e.target.value ? parseFloat(e.target.value) : null})}
                      placeholder="e.g. 3.5"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="input-draft-cgpa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min SPM A's</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={draftFormData.min_spm_as ?? ""}
                      onChange={(e) => setDraftFormData({...draftFormData, min_spm_as: e.target.value ? parseInt(e.target.value) : null})}
                      placeholder="e.g. 5"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="input-draft-spm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Household Income (RM)</label>
                    <input
                      type="number"
                      min="0"
                      value={draftFormData.household_income_max ?? ""}
                      onChange={(e) => setDraftFormData({...draftFormData, household_income_max: e.target.value ? parseFloat(e.target.value) : null})}
                      placeholder="e.g. 5000"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="input-draft-income"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State Restriction</label>
                    <select
                      value={draftFormData.state_restriction || ""}
                      onChange={(e) => setDraftFormData({...draftFormData, state_restriction: e.target.value || null})}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="select-draft-state"
                    >
                      <option value="">Nationwide (no restriction)</option>
                      {MALAYSIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="bumiputera-only"
                      checked={draftFormData.is_bumiputera_only || false}
                      onChange={(e) => setDraftFormData({...draftFormData, is_bumiputera_only: e.target.checked})}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      data-testid="checkbox-draft-bumiputera"
                    />
                    <label htmlFor="bumiputera-only" className="text-sm text-gray-700 dark:text-gray-300">
                      Bumiputera Only
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Study Areas</label>
                <div className="flex flex-wrap gap-2">
                  {STUDY_AREAS.map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        const current = draftFormData.study_areas || [];
                        if (current.includes(area)) {
                          setDraftFormData({...draftFormData, study_areas: current.filter(a => a !== area)});
                        } else {
                          setDraftFormData({...draftFormData, study_areas: [...current, area]});
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        (draftFormData.study_areas || []).includes(area)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                      data-testid={`button-study-area-${area}`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  English Proficiency Requirements
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Set minimum English test scores. Cross-test equivalence is used for matching.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min MUET Band</label>
                    <select
                      value={draftFormData.min_muet ?? ""}
                      onChange={(e) => setDraftFormData({...draftFormData, min_muet: e.target.value ? parseFloat(e.target.value) : null})}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="select-draft-min-muet"
                    >
                      <option value="">None</option>
                      <option value="1">Band 1</option>
                      <option value="2">Band 2</option>
                      <option value="3">Band 3</option>
                      <option value="4">Band 4</option>
                      <option value="5">Band 5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min IELTS Score</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      value={draftFormData.min_ielts ?? ""}
                      onChange={(e) => setDraftFormData({...draftFormData, min_ielts: e.target.value ? parseFloat(e.target.value) : null})}
                      placeholder="e.g., 6.0"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="input-draft-min-ielts"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min SPM English</label>
                    <select
                      value={draftFormData.min_spm_english ?? ""}
                      onChange={(e) => setDraftFormData({...draftFormData, min_spm_english: e.target.value || null})}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      data-testid="select-draft-min-spm-english"
                    >
                      <option value="">None</option>
                      {SPM_ENGLISH_GRADES.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  AI Matching Context (hidden from students)
                </label>
                <textarea
                  value={draftFormData.ai_matching_context || ""}
                  onChange={(e) => setDraftFormData({...draftFormData, ai_matching_context: e.target.value})}
                  placeholder="Describe the ideal candidate profile for better AI matching (e.g., 'Values leadership and community service in rural areas')"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  data-testid="textarea-draft-ai-context"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditDraft}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-lg transition-colors"
                  data-testid="button-cancel-edit-draft"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  data-testid="button-save-draft"
                >
                  {isSavingDraft ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
