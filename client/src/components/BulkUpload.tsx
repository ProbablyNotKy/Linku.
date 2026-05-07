import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, FileText, X, CheckCircle, AlertCircle, Loader2, Eye, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { bulkUploadScholarships } from "@/lib/api";

interface BulkRow {
  title: string;
  provider: string;
  amount?: string;
  deadline?: string;
  education_level?: string;
  url?: string;
  tags?: string;
  study_areas?: string;
  min_cgpa?: string;
  is_bumiputera_only?: string;
  deadline_type?: string;
  [key: string]: string | undefined;
}

interface BulkUploadProps {
  accessToken: string;
  onSuccess?: () => void;
}

const CSV_TEMPLATE_HEADERS = [
  "title",
  "provider",
  "amount",
  "deadline",
  "education_level",
  "url",
  "tags",
  "study_areas",
  "min_cgpa",
  "is_bumiputera_only",
  "deadline_type",
];

const CSV_TEMPLATE_EXAMPLE = [
  "Yayasan Khazanah Scholarship",
  "Yayasan Khazanah",
  "Full Ride + RM 2000/month",
  "2026-05-31",
  "Undergraduate",
  "https://yayasankhazanah.com.my",
  "merit-based,overseas,stem",
  "Engineering,STEM",
  "3.7",
  "false",
  "Fixed",
];

function parseCSV(text: string): BulkRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: BulkRow = { title: "", provider: "" };
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  }).filter((r) => r.title && r.provider);
}

function downloadTemplate() {
  const content = [CSV_TEMPLATE_HEADERS.join(","), CSV_TEMPLATE_EXAMPLE.join(",")].join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "linku_scholarship_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkUpload({ accessToken, onSuccess }: BulkUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  const parseFile = (file: File) => {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".json")) {
      toast({ title: "Unsupported file", description: "Please upload a .csv or .json file.", variant: "destructive" });
      return;
    }
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          const arr = Array.isArray(parsed) ? parsed : parsed.scholarships ?? [];
          setRows(arr.filter((r: BulkRow) => r.title && r.provider));
        } else {
          setRows(parseCSV(text));
        }
      } catch {
        toast({ title: "Parse error", description: "Could not read the file. Check the format.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!rows.length) return;
    setIsSubmitting(true);
    try {
      const res = await bulkUploadScholarships(rows, accessToken);
      setResult(res);
      if (res.inserted > 0) {
        toast({ title: `${res.inserted} scholarship${res.inserted > 1 ? "s" : ""} imported!`, description: res.errors.length ? `${res.errors.length} row(s) had errors.` : "All rows inserted successfully." });
        onSuccess?.();
      } else {
        toast({ title: "No rows inserted", description: res.errors.join("; "), variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setRows([]);
    setFileName("");
    setResult(null);
  };

  const isValid = (row: BulkRow) => !!(row.title?.trim() && row.provider?.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Bulk Upload</h2>
          <p className="text-sm text-gray-400 mt-0.5">Import multiple scholarships from a CSV or JSON file</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          className="border-white/15 text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/8 gap-2"
          data-testid="button-download-template"
        >
          <Download className="w-4 h-4" />
          Download CSV Template
        </Button>
      </div>

      {/* Drop zone */}
      {rows.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-14 flex flex-col items-center justify-center gap-4 text-center
            ${isDragging
              ? "border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
              : "border-white/15 bg-white/[0.02] hover:border-blue-500/50 hover:bg-white/5"
            }`}
          data-testid="dropzone-bulk-upload"
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-blue-500/20" : "bg-white/5"}`}>
            <Upload className={`w-6 h-6 transition-colors ${isDragging ? "text-blue-400" : "text-gray-500"}`} />
          </div>
          <div>
            <p className="text-white font-semibold mb-1">
              {isDragging ? "Drop it here!" : "Drag & drop your file here"}
            </p>
            <p className="text-sm text-gray-500">or click to browse — supports <span className="text-blue-400">.csv</span> and <span className="text-blue-400">.json</span></p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={handleFileInput}
            data-testid="input-bulk-file"
          />
        </motion.div>
      )}

      {/* Preview table */}
      <AnimatePresence>
        {rows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
          >
            {/* File info bar */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">{fileName}</span>
                <span className="text-xs text-gray-500">— {rows.length} row{rows.length !== 1 ? "s" : ""} parsed</span>
              </div>
              <button
                onClick={handleClear}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                data-testid="button-clear-preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-white/8 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-white/[0.03]">
                <Eye className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</span>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-xs" data-testid="table-bulk-preview">
                  <thead className="sticky top-0 bg-[#0d1220]">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium w-8">#</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium whitespace-nowrap">Status</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium whitespace-nowrap">Title</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium whitespace-nowrap">Provider</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium whitespace-nowrap">Amount</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium whitespace-nowrap">Deadline</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium whitespace-nowrap">Level</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium whitespace-nowrap">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((row, i) => {
                      const valid = isValid(row);
                      return (
                        <tr
                          key={i}
                          className={`transition-colors ${valid ? "hover:bg-white/[0.02]" : "bg-red-500/5"}`}
                          data-testid={`row-preview-${i}`}
                        >
                          <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                          <td className="px-3 py-2">
                            {valid
                              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              : <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            }
                          </td>
                          <td className="px-3 py-2 text-white font-medium max-w-[180px] truncate">{row.title || <span className="text-red-400">Missing</span>}</td>
                          <td className="px-3 py-2 text-gray-300 whitespace-nowrap">{row.provider || <span className="text-red-400">Missing</span>}</td>
                          <td className="px-3 py-2 text-emerald-400 whitespace-nowrap">{row.amount || "—"}</td>
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{row.deadline || "—"}</td>
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{row.education_level || "—"}</td>
                          <td className="px-3 py-2 text-gray-500 max-w-[140px] truncate">{row.tags || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Validation summary */}
            {rows.some((r) => !isValid(r)) && (
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{rows.filter((r) => !isValid(r)).length} row(s) are missing required fields (title + provider) and will be skipped.</span>
              </div>
            )}

            {/* Result block */}
            {result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-start gap-3 rounded-xl px-4 py-3 border text-sm ${
                  result.inserted > 0 ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300" : "bg-red-500/10 border-red-500/25 text-red-300"
                }`}
                data-testid="bulk-result"
              >
                {result.inserted > 0 ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <div>
                  <p className="font-semibold">{result.inserted} scholarship{result.inserted !== 1 ? "s" : ""} inserted successfully.</p>
                  {result.errors.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-xs opacity-80 list-disc list-inside">
                      {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                      {result.errors.length > 5 && <li>…and {result.errors.length - 5} more</li>}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || rows.filter(isValid).length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                data-testid="button-submit-bulk"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSubmitting ? "Importing…" : `Import ${rows.filter(isValid).length} Scholarship${rows.filter(isValid).length !== 1 ? "s" : ""}`}
              </Button>
              <Button
                variant="ghost"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-200 hover:bg-white/8 gap-2"
                data-testid="button-clear-all"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
