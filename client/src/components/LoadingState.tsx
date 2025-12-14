export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20" data-testid="loading-state">
      <div 
        className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 mb-4"
        style={{ borderColor: "#e0e7ff", borderTopColor: "#4f46e5" }}
      />
      <p className="text-lg text-foreground font-medium">Sedang memuatkan...</p>
      <p className="text-sm text-muted-foreground mt-1">Loading opportunities</p>
    </div>
  );
}
