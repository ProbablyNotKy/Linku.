import { Link } from "wouter";
import { Check, X, Crown, Sparkles, ArrowLeft, Zap, MessageSquare, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
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
  const { user } = useAuth();
  const { subscription, isPremium, isLoading } = useSubscription();

  const expiryDate = subscription?.expires_at 
    ? new Date(subscription.expires_at).toLocaleDateString('en-MY', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null;

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
                  <span className="text-4xl font-bold text-foreground">RM 29.90</span>
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
                  <Button className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600" data-testid="button-upgrade">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
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
            Questions? Contact us at support@ascendia.my
          </p>
        </div>
      </div>
    </main>
  );
}
