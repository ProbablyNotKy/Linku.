import { Link, useLocation } from "wouter";
import { Settings, LogIn, LogOut, User } from "lucide-react";
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-2">
            {!isLoading && user && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline" data-testid="text-user-email">{user.email}</span>
              </div>
            )}
          </div>
          <Link href="/" className="text-center flex-1">
            <h1 
              className="text-4xl sm:text-5xl font-bold tracking-tight"
              style={{ color: "#4f46e5" }}
              data-testid="text-brand-title"
            >
              Ascendia
            </h1>
            <p 
              className="mt-2 text-lg text-gray-600 dark:text-gray-400"
              data-testid="text-brand-subtitle"
            >
              Malaysia's Premier Opportunity Navigator
            </p>
          </Link>
          <div className="flex-1 flex justify-end items-center gap-2">
            <ThemeToggle />
            {isAdmin && (
              <Link 
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
                  size="sm" 
                  onClick={handleSignOut}
                  data-testid="button-signout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              ) : (
                <Link href="/login">
                  <Button variant="default" size="sm" data-testid="button-signin">
                    <LogIn className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Sign In</span>
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
