export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h1 
            className="text-4xl sm:text-5xl font-bold tracking-tight"
            style={{ color: "#4f46e5" }}
            data-testid="text-brand-title"
          >
            Ascendia
          </h1>
          <p 
            className="mt-2 text-lg text-gray-600"
            data-testid="text-brand-subtitle"
          >
            Malaysia's Premier Opportunity Navigator
          </p>
        </div>
      </div>
    </header>
  );
}
