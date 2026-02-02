import { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Sparkles, 
  Search, 
  MessageSquare, 
  Target,
  Users,
  Award,
  ArrowRight,
  CheckCircle,
  Zap,
  BookOpen,
  Globe
} from "lucide-react";

export default function Landing() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Ascendia - AI-Powered Scholarship Matching for Malaysian Students";
    const description = "Find your perfect scholarship match with Ascendia. AI-powered recommendations tailored for Malaysian students seeking educational funding opportunities.";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }
    
    const ogTags = [
      { property: "og:title", content: "Ascendia - AI-Powered Scholarship Matching" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: window.location.origin },
    ];
    
    ogTags.forEach(({ property, content }) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    });
  }, []);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Scholarship Matching
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
              Find Your Perfect
              <span className="block text-indigo-200">Scholarship Match</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              Discover scholarships tailored for Malaysian students. Our AI analyzes your profile and matches you with opportunities you actually qualify for.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/scholarships">
                <Button 
                  size="lg" 
                  className="bg-white text-indigo-700 font-semibold px-8"
                  data-testid="button-browse-scholarships"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Browse Scholarships
                </Button>
              </Link>
              
              {!user ? (
                <Link href="/signup">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/50 text-white font-semibold px-8"
                    data-testid="button-get-started"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href="/onboarding">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/50 text-white font-semibold px-8"
                    data-testid="button-create-profile"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create AI Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" data-testid="text-howitworks-title">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to find scholarships that match your profile perfectly
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Create Your Profile</h3>
              <p className="text-muted-foreground">
                Tell us about your academic background, interests, and eligibility criteria through our simple onboarding process.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">AI Magic Matching</h3>
              <p className="text-muted-foreground">
                Our AI analyzes your profile and finds scholarships that match your qualifications, interests, and goals.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Apply with Confidence</h3>
              <p className="text-muted-foreground">
                Use our Socratic Mentor AI to prepare compelling applications and track your scholarship journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" data-testid="text-features-title">
              Why Choose Ascendia?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for Malaysian students seeking educational funding
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Smart Eligibility Matching</h3>
                <p className="text-muted-foreground text-sm">
                  Filters based on CGPA, SPM results, household income, state restrictions, and Bumiputera status.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">AI-Powered Recommendations</h3>
                <p className="text-muted-foreground text-sm">
                  Our AI understands your goals and interests to rank scholarships by relevance and fit.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Socratic Mentor Chat</h3>
                <p className="text-muted-foreground text-sm">
                  Get AI-guided help crafting compelling essays using the proven STAR method.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Local & International</h3>
                <p className="text-muted-foreground text-sm">
                  Discover opportunities for studying in Malaysia and abroad from government and private sponsors.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Real-Time Updates</h3>
                <p className="text-muted-foreground text-sm">
                  Stay informed about new scholarships, deadline reminders, and application status changes.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">English Proficiency Mapping</h3>
                <p className="text-muted-foreground text-sm">
                  Universal CEFR scale maps MUET, IELTS, and SPM scores for cross-test matching.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2" data-testid="stat-scholarships">
                50+
              </div>
              <p className="text-muted-foreground">Active Scholarships</p>
            </div>
            
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2" data-testid="stat-value">
                RM50M+
              </div>
              <p className="text-muted-foreground">Total Value Available</p>
            </div>
            
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-green-600 dark:text-green-400 mb-2" data-testid="stat-sponsors">
                20+
              </div>
              <p className="text-muted-foreground">Scholarship Providers</p>
            </div>
            
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2" data-testid="stat-match">
                95%
              </div>
              <p className="text-muted-foreground">Match Accuracy</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-6 text-indigo-200" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-6" data-testid="text-cta-title">
            Ready to Find Your Scholarship?
          </h2>
          <p className="text-lg text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join thousands of Malaysian students who have discovered life-changing educational opportunities through Ascendia.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/scholarships">
              <Button 
                size="lg" 
                className="bg-white text-indigo-700 font-semibold px-8"
                data-testid="button-cta-browse"
              >
                <Search className="w-5 h-5 mr-2" />
                Browse Scholarships
              </Button>
            </Link>
            
            {!user && (
              <Link href="/signup">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/50 text-white font-semibold px-8"
                  data-testid="button-cta-signup"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Create Free Account
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              <span className="font-bold text-lg text-foreground">Ascendia</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/scholarships" className="transition-colors" data-testid="link-footer-scholarships">
                Scholarships
              </Link>
              <Link href="/onboarding" className="transition-colors" data-testid="link-footer-profile">
                Create Profile
              </Link>
              <Link href="/login" className="transition-colors" data-testid="link-footer-login">
                Login
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground" data-testid="text-copyright">
              &copy; {new Date().getFullYear()} Ascendia. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
