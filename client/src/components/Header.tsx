import { Link, useLocation } from "wouter";
import { Settings, LogIn, LogOut, User, LayoutDashboard, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const { user, signOut, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            {!isLoading && user && (
              <div className="flex items-center gap-1 sm:gap-3">
                <Link 
                  href="/dashboard"
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  data-testid="link-dashboard"
                >
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline" data-testid="text-user-email">{user.email}</span>
                </Link>
              </div>
            )}
          </div>
          <Link href="/" className="text-center flex-shrink-0">
            <h1 
              className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: "#4f46e5" }}
              data-testid="text-brand-title"
            >
              Ascendia
            </h1>
            <p 
              className="hidden sm:block mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400"
              data-testid="text-brand-subtitle"
            >
              Malaysia's Premier Opportunity Navigator
            </p>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {isAdmin && (
              <Link 
                href="/admin"
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                data-testid="link-admin"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            {!isLoading && (
              user ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut}
                  data-testid="button-signout-mobile"
                  className="sm:hidden"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              ) : (
                <Link href="/login">
                  <Button variant="default" size="icon" data-testid="button-signin-mobile" className="sm:hidden">
                    <LogIn className="w-4 h-4" />
                  </Button>
                </Link>
              )
            )}
            {!isLoading && (
              user ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  data-testid="button-signout-desktop"
                  className="hidden sm:flex"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Link href="/login">
                  <Button variant="default" size="sm" data-testid="button-signin-desktop" className="hidden sm:flex">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
