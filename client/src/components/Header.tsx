import { Link, useLocation } from "wouter";
import { Settings, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, signOut, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/">
            <span
              className="text-2xl font-black tracking-tight text-white hover:opacity-80 transition-opacity cursor-pointer"
              data-testid="text-brand-title"
            >
              Linku<span className="text-blue-500">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/scholarships"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Scholarships
            </Link>
            <Link
              href="/subscription"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              About
            </Link>
            {!isLoading && user && (
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-white transition-colors"
                data-testid="link-dashboard"
              >
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm text-gray-400 hover:text-white transition-colors"
                data-testid="link-admin"
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {!isLoading && (
              user ? (
                <>
                  <span
                    className="hidden sm:block text-sm text-gray-500 max-w-[160px] truncate"
                    data-testid="text-user-email"
                  >
                    {user.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    data-testid="button-signout-desktop"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid="button-signin-desktop"
                      className="hidden sm:flex text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="button-signin-mobile"
                      className="sm:hidden text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <LogIn className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      size="sm"
                      data-testid="button-signup"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
