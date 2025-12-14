"use client";

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20" data-testid="loading-state">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
      <p className="text-lg text-gray-600 font-medium">Sedang memuatkan...</p>
      <p className="text-sm text-gray-400 mt-1">Loading opportunities</p>
    </div>
  );
}
