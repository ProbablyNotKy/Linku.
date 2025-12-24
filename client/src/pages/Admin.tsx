import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { 
  Shield, CheckCircle2, AlertCircle, Plus, ArrowLeft, 
  Pencil, Trash2, Search, GraduationCap, Clock, AlertTriangle,
  X, Globe, Eye, ChevronDown, ChevronUp, Bot
} from "lucide-react";
import { Scholarship } from "@shared/schema";
import { 
  fetchScholarships, 
  createScholarship, 
  updateScholarship, 
  deleteScholarship,
  ScholarshipCreate,
  scrapeUrl,
  fetchDrafts,
  publishDraft,
  rejectDraft,
  Draft
} from "@/lib/api";

const ADMIN_KEY = "Ascendia2024";
const EDUCATION_LEVELS = ["SPM", "Diploma", "Degree", "Masters", "Undergraduate", "Postgraduate", "Diploma/Degree"];

interface FormData {
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  education_level: string;
  url: string;
  tags: string;
}

const emptyFormData: FormData = {
  title: "",
  provider: "",
  amount: "",
  deadline: "",
  education_level: "",
  url: "",
  tags: "",
};

export default function Admin() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
  const [scrapeUrl_, setScrapeUrl] = useState("");
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [expandedDraftId, setExpandedDraftId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const loadDrafts = async () => {
    setIsLoadingDrafts(true);
    try {
      const data = await fetchDrafts("pending");
      setDrafts(data);
    } catch (err) {
      console.error("Failed to load drafts:", err);
      setErrorMessage("Failed to load drafts");
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl_.trim()) return;
    
    setIsScrapingUrl(true);
    setSuccessMessage("");
    setErrorMessage("");
    
    try {
      const result = await scrapeUrl(scrapeUrl_);
      setSuccessMessage(result.message);
      setScrapeUrl("");
      await loadDrafts();
    } catch (err) {
      console.error("Failed to scrape URL:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to scrape URL");
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handlePublish = async (id: number) => {
    setPublishingId(id);
    try {
      const result = await publishDraft(id);
      setSuccessMessage(result.message);
      await loadDrafts();
      await loadScholarships();
    } catch (err) {
      console.error("Failed to publish draft:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to publish draft");
    } finally {
      setPublishingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setRejectingId(id);
    try {
      await rejectDraft(id);
      setSuccessMessage("Draft rejected successfully");
      await loadDrafts();
    } catch (err) {
      console.error("Failed to reject draft:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to reject draft");
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
      s.education_level.toLowerCase().includes(query)
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

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey === ADMIN_KEY) {
      setIsAuthenticated(true);
      setErrorMessage("");
    } else {
      setErrorMessage("Invalid admin key. Access denied.");
    }
  };

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
      education_level: scholarship.education_level,
      url: scholarship.url || "",
      tags: scholarship.tags?.join(", ") || "",
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
        education_level: formData.education_level,
        url: formData.url || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      };

      if (editingId) {
        await updateScholarship(editingId, scholarshipData);
        setSuccessMessage("Scholarship updated successfully!");
      } else {
        await createScholarship(scholarshipData);
        setSuccessMessage("Scholarship created successfully!");
      }

      closeForm();
      await loadScholarships();
    } catch (err) {
      console.error("Failed to save scholarship:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save scholarship");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await deleteScholarship(id);
      setSuccessMessage("Scholarship deleted successfully!");
      setDeleteConfirmId(null);
      await loadScholarships();
    } catch (err) {
      console.error("Failed to delete scholarship:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete scholarship");
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
            Admin Access
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            Enter the admin key to continue
          </p>

          <form onSubmit={handleKeySubmit}>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              data-testid="input-admin-key"
            />
            {errorMessage && (
              <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
                <AlertCircle className="w-4 h-4" />
                <span data-testid="text-error">{errorMessage}</span>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              data-testid="button-authenticate"
            >
              Access Dashboard
            </button>
          </form>

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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-indigo-200 mt-1">Manage Ascendia Scholarships</p>
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
                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{scholarship.education_level}</td>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Scan websites to discover new scholarships</p>
                </div>
              </div>

              <form onSubmit={handleScrape} className="flex gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={scrapeUrl_}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    placeholder="https://www.example.com/scholarships"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-scrape-url"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isScrapingUrl || !scrapeUrl_.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                  data-testid="button-scrape"
                >
                  {isScrapingUrl ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Scan Website
                    </>
                  )}
                </button>
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
                            {draft.education_level && <span>Level: {draft.education_level}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                    Education Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="education_level"
                    value={formData.education_level}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="select-education-level"
                  >
                    <option value="">Select level...</option>
                    {EDUCATION_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
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
    </main>
  );
}
