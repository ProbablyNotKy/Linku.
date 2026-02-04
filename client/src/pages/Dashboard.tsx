import { useEffect, useState } from "react";
import { Link } from "wouter";
import { User, GraduationCap, Crown, Sparkles, Edit, ArrowLeft, Mail, Calendar, BookOpen, DollarSign, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { getUserProfile, UserProfileResponse } from "@/lib/api";
import Header from "@/components/Header";

export default function Dashboard() {
  const { user, profileId, hasProfile } = useAuth();
  const { subscription, isPremium, isLoading: subscriptionLoading } = useSubscription();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  useEffect(() => {
    async function loadProfile() {
      if (!profileId) {
        setProfileLoading(false);
        return;
      }
      try {
        const data = await getUserProfile(profileId);
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [profileId]);

  if (!user) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to view your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/login">
                <Button data-testid="button-signin-dashboard">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const expiryDate = subscription?.expires_at 
    ? new Date(subscription.expires_at).toLocaleDateString('en-MY', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null;

  const memberSince = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-MY', { 
        year: 'numeric', 
        month: 'long' 
      })
    : null;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/scholarships">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scholarships
            </Button>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-dashboard-title">
              My Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your profile and subscription
            </p>
          </div>

          <div className="grid gap-6">
            <Card data-testid="card-account-info">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground" data-testid="text-user-email-dashboard">{user.email}</p>
                  </div>
                </div>
                {memberSince && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium text-foreground">{memberSince}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-subscription">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ) : isPremium ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
                      <Crown className="w-8 h-8 text-amber-500" />
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-2">
                          Premium Member
                          <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">Active</Badge>
                        </p>
                        {expiryDate && (
                          <p className="text-sm text-muted-foreground">Valid until {expiryDate}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm text-foreground">AI Matching Enabled</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-foreground">Socratic Mentor Access</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                      <div>
                        <p className="font-medium text-foreground">Free Plan</p>
                        <p className="text-sm text-muted-foreground">Upgrade to unlock AI features</p>
                      </div>
                      <Link href="/subscription">
                        <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600" data-testid="button-upgrade-dashboard">
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-profile">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Student Profile
                  </CardTitle>
                  <CardDescription>Your academic information for scholarship matching</CardDescription>
                </div>
                {hasProfile && (
                  <Link href="/onboarding">
                    <Button variant="outline" size="sm" data-testid="button-edit-profile">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : profile ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {profile.education_level && (
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Education Level</p>
                          <p className="font-medium text-foreground" data-testid="text-education-level">{profile.education_level}</p>
                        </div>
                      </div>
                    )}
                    {profile.cgpa && (
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">CGPA</p>
                          <p className="font-medium text-foreground">{profile.cgpa.toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                    {profile.household_income && (
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Household Income</p>
                          <p className="font-medium text-foreground">{profile.household_income}</p>
                        </div>
                      </div>
                    )}
                    {profile.state && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">State</p>
                          <p className="font-medium text-foreground">{profile.state}</p>
                        </div>
                      </div>
                    )}
                    {profile.is_bumiputera !== undefined && (
                      <div className="flex items-start gap-3">
                        <Globe className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Bumiputera Status</p>
                          <p className="font-medium text-foreground">{profile.is_bumiputera ? "Yes" : "No"}</p>
                        </div>
                      </div>
                    )}
                    {profile.study_areas && profile.study_areas.length > 0 && (
                      <div className="sm:col-span-2 flex items-start gap-3">
                        <GraduationCap className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Fields of Study</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.study_areas.map((area: string, i: number) => (
                              <Badge key={i} variant="secondary">{area}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No profile created yet</p>
                    <Link href="/onboarding">
                      <Button data-testid="button-create-profile-dashboard">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Profile
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/scholarships">
                <Card className="cursor-pointer hover-elevate h-full" data-testid="card-browse-scholarships">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Browse Scholarships</p>
                      <p className="text-sm text-muted-foreground">Discover new opportunities</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              {hasProfile && (
                <Link href="/scholarships?magic=true">
                  <Card className="cursor-pointer hover-elevate h-full" data-testid="card-ai-matches">
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">AI Matches</p>
                        <p className="text-sm text-muted-foreground">View personalized recommendations</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
