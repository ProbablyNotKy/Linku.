"use client";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h1 
            className="text-4xl sm:text-5xl font-bold text-indigo-600 tracking-tight"
            data-testid="text-brand-title"
          >
            Ascendia
          </h1>
          <p 
            className="mt-2 text-lg text-gray-600"
            data-testid="text-brand-subtitle"
          >
            Malaysia&apos;s Premier Opportunity Navigator
          </p>
        </div>
      </div>
    </header>
  );
}
