import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20" data-testid="error-state">
      <div className="bg-red-50 dark:bg-red-900/20 rounded-full p-4 mb-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Ralat berlaku
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {message || "Tidak dapat memuat data. Sila cuba lagi."}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          style={{ backgroundColor: "#4f46e5" }}
          data-testid="button-retry"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Cuba Lagi
        </Button>
      )}
    </div>
  );
}
