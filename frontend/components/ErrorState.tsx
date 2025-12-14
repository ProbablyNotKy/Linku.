"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20" data-testid="error-state">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Ralat berlaku
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        {message || "Tidak dapat memuat data. Sila cuba lagi."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
          data-testid="button-retry"
        >
          <RefreshCw className="w-4 h-4" />
          Cuba Lagi
        </button>
      )}
    </div>
  );
}
