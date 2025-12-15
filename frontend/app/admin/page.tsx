"use client";

import { useState, useEffect } from "react";
import { createScholarship, updateScholarship, deleteScholarship, fetchScholarships, ScholarshipCreate } from "@/lib/api";
import { Scholarship } from "@/types";
import { Shield, CheckCircle2, AlertCircle, Plus, ArrowLeft, Pencil, Trash2, RefreshCw, List } from "lucide-react";
import Link from "next/link";

const ADMIN_KEY = "Ascendia2024";

const EDUCATION_LEVELS = ["SPM", "Diploma", "Degree", "Masters", "Undergraduate", "Postgraduate"];

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    provider: "",
    amount: "",
    deadline: "",
    education_level: "",
    url: "",
    tags: "",
  });

  const loadScholarships = async () => {
    setIsLoading(true);
    try {
      const data = await fetchScholarships();
      setScholarships(data);
    } catch (err) {
      console.error("Failed to fetch scholarships:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadScholarships();
    }
  }, [isAuthenticated]);

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

  const resetForm = () => {
    setFormData({
      title: "",
      provider: "",
      amount: "",
      deadline: "",
      education_level: "",
      url: "",
      tags: "",
    });
    setEditingId(null);
  };

  const handleEdit = (scholarship: Scholarship) => {
    setFormData({
      title: scholarship.title,
      provider: scholarship.provider,
      amount: scholarship.amount,
      deadline: scholarship.deadline,
      education_level: scholarship.education_level,
      url: scholarship.url || "",
      tags: scholarship.tags?.join(", ") || "",
    });
    setEditingId(scholarship.id);
    setSuccessMessage("");
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scholarship?")) {
      return;
    }

    try {
      await deleteScholarship(id);
      setSuccessMessage("Scholarship deleted successfully!");
      loadScholarships();
    } catch (err) {
      console.error("Failed to delete scholarship:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete scholarship");
    }
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

      resetForm();
      loadScholarships();
    } catch (err) {
      console.error("Failed to save scholarship:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save scholarship");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-indigo-100 rounded-full p-4">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2 font-heading">
            Admin Access
          </h1>
          <p className="text-slate-500 text-center mb-6">
            Enter the admin key to continue
          </p>

          <form onSubmit={handleKeySubmit}>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key..."
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
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
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading">Admin Dashboard</h1>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 rounded-lg p-2">
              {editingId ? <Pencil className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              {editingId ? "Edit Scholarship" : "Create New Opportunity"}
            </h2>
            {editingId && (
              <button
                onClick={resetForm}
                className="ml-auto text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                data-testid="button-cancel-edit"
              >
                Cancel Edit
              </button>
            )}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Yayasan Khazanah Scholarship"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="input-title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Provider <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Yayasan Khazanah"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="input-provider"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., RM 50,000 / year"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="input-amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="input-deadline"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Education Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/apply"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-testid="input-url"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., Merit, STEM, Overseas (comma separated)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                data-testid="input-tags"
              />
              <p className="text-xs text-slate-500 mt-1">
                Separate multiple tags with commas
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    {editingId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editingId ? "Update Scholarship" : "Create Opportunity"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 rounded-lg p-2">
                <List className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                Current Opportunities
              </h2>
              <span className="text-sm text-slate-500">({scholarships.length} total)</span>
            </div>
            <button
              onClick={loadScholarships}
              disabled={isLoading}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : scholarships.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No scholarships found. Create one above to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-scholarships">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Provider</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Deadline</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Level</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scholarships.map((scholarship) => (
                    <tr 
                      key={scholarship.id} 
                      className="border-b border-slate-100 hover:bg-slate-50"
                      data-testid={`row-scholarship-${scholarship.id}`}
                    >
                      <td className="py-3 px-4 text-sm text-slate-500">{scholarship.id}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{scholarship.title}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{scholarship.provider}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{scholarship.deadline}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                          {scholarship.education_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(scholarship)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                            data-testid={`button-edit-${scholarship.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(scholarship.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
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
      </div>
    </main>
  );
}
