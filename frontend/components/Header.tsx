"use client";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-indigo-900 to-indigo-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center">
          <h1 
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-heading"
            data-testid="text-brand-title"
          >
            Ascendia
          </h1>
          <p 
            className="mt-3 text-lg text-indigo-200"
            data-testid="text-brand-subtitle"
          >
            Malaysia&apos;s Premier Opportunity Navigator
          </p>
        </div>
      </div>
    </header>
  );
}
