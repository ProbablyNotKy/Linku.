import { useState } from "react";
import { Link } from "wouter";
import { Check, X, Crown, Sparkles, ArrowLeft, Zap, MessageSquare, HeadphonesIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { createPaymentBill } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface PlanFeature {
  name: string;
  free: boolean;
  premium: boolean;
  highlight?: boolean;
}

const features: PlanFeature[] = [
  { name: "Browse all scholarships", free: true, premium: true },
  { name: "Search & filter scholarships", free: true, premium: true },
  { name: "View scholarship details", free: true, premium: true },
  { name: "Create student profile", free: true, premium: true },
  { name: "AI-powered scholarship matching", free: false, premium: true, highlight: true },
  { name: "Socratic Mentor for essays", free: false, premium: true, highlight: true },
  { name: "Personalized recommendations", free: false, premium: true },
  { name: "Priority customer support", free: false, premium: true },
];

export default function Subscription() {
  const { user, session } = useAuth();
  const { subscription, isPremium, isLoading } = useSubscription();
  const { toast } = useToast();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
  });

  const expiryDate = subscription?.expires_at 
    ? new Date(subscription.expires_at).toLocaleDateString('en-MY', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null;

  const handleUpgradeClick = () => {
    if (!user || !session) {
      window.location.href = "/login";
      return;
    }
    setFormData(prev => ({ ...prev, email: user.email || prev.email }));
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!session?.access_token) {
      toast({ title: "Please sign in first", variant: "destructive" });
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setPaymentLoading(true);
    try {
      const result = await createPaymentBill(
        {
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
        },
        session.access_token
      );

      window.location.href = result.payment_url;
    } catch (err) {
      console.error("Payment error:", err);
      toast({
        title: "Payment Error",
        description: err instanceof Error ? err.message : "Failed to create payment. Please try again.",
        variant: "destructive",
      });
      setPaymentLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/scholarships">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scholarships
            </Button>
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-pricing-title">
              Choose Your Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Unlock AI-powered features to find the perfect scholarship match and get expert guidance on your applications.
            </p>
          </div>

          {user && isPremium && (
            <div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 text-center" data-testid="status-current-plan">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-foreground">You're a Premium Member!</span>
              </div>
              {expiryDate && (
                <p className="text-sm text-muted-foreground">Your subscription is valid until {expiryDate}</p>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="relative" data-testid="card-plan-free">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Free
                </CardTitle>
                <CardDescription>Perfect for exploring scholarships</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold text-foreground">RM 0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      {feature.free ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span className={feature.free ? "text-foreground" : "text-muted-foreground/50"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {!user ? (
                  <Link href="/signup">
                    <Button variant="outline" className="w-full mt-6" data-testid="button-signup-free">
                      Sign Up Free
                    </Button>
                  </Link>
                ) : !isPremium ? (
                  <Button variant="outline" className="w-full mt-6" disabled data-testid="button-current-plan">
                    Current Plan
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card className="relative border-indigo-200 dark:border-indigo-800 shadow-lg" data-testid="card-plan-premium">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600">
                Recommended
              </Badge>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Crown className="w-6 h-6 text-amber-500" />
                  Premium
                </CardTitle>
                <CardDescription>Unlock the full power of AI matching</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold text-foreground">RM 10</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      {feature.premium ? (
                        <Check className={`w-5 h-5 flex-shrink-0 ${feature.highlight ? 'text-indigo-500' : 'text-green-500'}`} />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span className={`${feature.premium ? "text-foreground" : "text-muted-foreground/50"} ${feature.highlight ? 'font-medium' : ''}`}>
                        {feature.name}
                        {feature.highlight && (
                          <Badge variant="secondary" className="ml-2 text-xs">AI Powered</Badge>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {!user ? (
                  <Link href="/signup">
                    <Button className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600" data-testid="button-signup-premium">
                      <Crown className="w-4 h-4 mr-2" />
                      Sign Up & Upgrade
                    </Button>
                  </Link>
                ) : isPremium ? (
                  <Button className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600" disabled data-testid="button-current-plan-premium">
                    <Crown className="w-4 h-4 mr-2" />
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600" 
                    onClick={handleUpgradeClick}
                    data-testid="button-upgrade"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now - RM 10/month
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="bg-card rounded-xl border p-8">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              Why Go Premium?
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">AI Matching</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes your profile to find scholarships you're most likely to get.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Socratic Mentor</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized guidance on your scholarship essays and applications.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                  <HeadphonesIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Priority Support</h3>
                <p className="text-sm text-muted-foreground">
                  Get faster responses and dedicated help when you need it.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Secure payment powered by ToyyibPay. Questions? Contact us at support@linku.my
          </p>
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription>
              Complete your details below to proceed with payment of RM 10.00/month.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-name">Full Name</Label>
              <Input
                id="payment-name"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-payment-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-email">Email</Label>
              <Input
                id="payment-email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                data-testid="input-payment-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-phone">Phone Number</Label>
              <Input
                id="payment-phone"
                type="tel"
                placeholder="01X-XXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                data-testid="input-payment-phone"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium text-foreground">Premium</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-foreground">1 Month</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm border-t pt-1 mt-1">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="font-bold text-foreground text-base text-green-600 dark:text-green-400">RM 10.00</span>
              </div>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
              onClick={handlePayment}
              disabled={paymentLoading}
              data-testid="button-proceed-payment"
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating payment...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You'll be redirected to ToyyibPay to complete your payment securely.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
