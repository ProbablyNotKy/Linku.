import { useState } from "react";
import { Link } from "wouter";
import { Shield, CheckCircle2, AlertCircle, Plus, ArrowLeft } from "lucide-react";

const ADMIN_KEY = "Ascendia2024";
const API_BASE_URL = "http://127.0.0.1:8000";

const EDUCATION_LEVELS = ["SPM", "Diploma", "Degree", "Masters", "Undergraduate", "Postgraduate"];

interface ScholarshipCreate {
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  education_level: string;
  url?: string;
  tags?: string[];
}

async function createScholarship(data: ScholarshipCreate) {
  const response = await fetch(`${API_BASE_URL}/scholarships/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create scholarship: ${error}`);
  }
  return response.json();
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    provider: "",
    amount: "",
    deadline: "",
    education_level: "",
    url: "",
    tags: "",
  });

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

      await createScholarship(scholarshipData);

      setSuccessMessage("Scholarship Added!");
      setFormData({
        title: "",
        provider: "",
        amount: "",
        deadline: "",
        education_level: "",
        url: "",
        tags: "",
      });
    } catch (err) {
      console.error("Failed to create scholarship:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to create scholarship");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-indigo-100 rounded-full p-4">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Admin Access
          </h1>
          <p className="text-gray-500 text-center mb-6">
            Enter the admin key to continue
          </p>

          <form onSubmit={handleKeySubmit}>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
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
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
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
    <main className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 rounded-lg p-2">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Create New Opportunity
            </h2>
          </div>

          {successMessage && (
            <div 
              className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6"
              data-testid="success-message"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div 
              className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6"
              data-testid="error-message"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Yayasan Khazanah Scholarship"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="input-title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Yayasan Khazanah"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="input-provider"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., RM 50,000 / year"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="input-amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="input-deadline"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/apply"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="input-url"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., Merit, STEM, Overseas (comma separated)"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                data-testid="input-tags"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple tags with commas
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                data-testid="button-create"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Opportunity
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
