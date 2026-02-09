import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle, XCircle, Clock, ArrowLeft, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/use-subscription";

type PaymentStatusType = "success" | "pending" | "failed" | "unknown";

function getStatusFromUrl(): { status: PaymentStatusType; billcode: string; orderId: string } {
  const params = new URLSearchParams(window.location.search);
  const statusId = params.get("status_id") || "";
  const billcode = params.get("billcode") || "";
  const orderId = params.get("order_id") || "";

  let status: PaymentStatusType = "unknown";
  if (statusId === "1") status = "success";
  else if (statusId === "2") status = "pending";
  else if (statusId === "3") status = "failed";

  return { status, billcode, orderId };
}

export default function PaymentStatus() {
  const [paymentInfo] = useState(getStatusFromUrl);
  const { refresh } = useSubscription();

  useEffect(() => {
    if (paymentInfo.status === "success") {
      const timer = setTimeout(() => {
        refresh();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentInfo.status, refresh]);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full" data-testid="card-payment-status">
          <CardHeader className="text-center">
            {paymentInfo.status === "success" && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-green-700 dark:text-green-400" data-testid="text-payment-title">
                  Payment Successful!
                </CardTitle>
              </>
            )}
            {paymentInfo.status === "pending" && (
              <>
                <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-amber-700 dark:text-amber-400" data-testid="text-payment-title">
                  Payment Pending
                </CardTitle>
              </>
            )}
            {paymentInfo.status === "failed" && (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-red-700 dark:text-red-400" data-testid="text-payment-title">
                  Payment Failed
                </CardTitle>
              </>
            )}
            {paymentInfo.status === "unknown" && (
              <>
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-2xl" data-testid="text-payment-title">
                  Payment Status Unknown
                </CardTitle>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {paymentInfo.status === "success" && (
              <>
                <p className="text-muted-foreground">
                  Your Premium subscription has been activated. You now have access to AI Matching, Socratic Mentor, and all premium features.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href="/scholarships">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600" data-testid="button-go-scholarships">
                      <Crown className="w-4 h-4 mr-2" />
                      Start Matching
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full sm:w-auto" data-testid="button-go-dashboard">
                      View Dashboard
                    </Button>
                  </Link>
                </div>
              </>
            )}
            {paymentInfo.status === "pending" && (
              <>
                <p className="text-muted-foreground">
                  Your payment is being processed. This may take a few minutes. Your subscription will be activated once the payment is confirmed.
                </p>
                <Link href="/scholarships">
                  <Button variant="outline" className="w-full sm:w-auto" data-testid="button-back-pending">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Scholarships
                  </Button>
                </Link>
              </>
            )}
            {paymentInfo.status === "failed" && (
              <>
                <p className="text-muted-foreground">
                  Your payment was not completed. No charges were made to your account. Please try again.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href="/subscription">
                    <Button className="w-full sm:w-auto" data-testid="button-try-again">
                      Try Again
                    </Button>
                  </Link>
                  <Link href="/scholarships">
                    <Button variant="outline" className="w-full sm:w-auto" data-testid="button-back-failed">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Scholarships
                    </Button>
                  </Link>
                </div>
              </>
            )}
            {paymentInfo.status === "unknown" && (
              <>
                <p className="text-muted-foreground">
                  We couldn't determine the payment status. Please check your dashboard or contact support.
                </p>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full sm:w-auto" data-testid="button-check-dashboard">
                    Check Dashboard
                  </Button>
                </Link>
              </>
            )}

            {paymentInfo.billcode && (
              <p className="text-xs text-muted-foreground mt-4">
                Reference: {paymentInfo.billcode}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
