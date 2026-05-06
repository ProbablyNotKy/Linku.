import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import SplashScreen from "@/components/SplashScreen";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Scholarships from "@/pages/Home";
import Admin from "@/pages/Admin";
import Onboarding from "@/pages/Onboarding";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Subscription from "@/pages/Subscription";
import Dashboard from "@/pages/Dashboard";
import PaymentStatus from "@/pages/PaymentStatus";

function Router() {
  return (
    <div className="flex-grow flex flex-col">
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/scholarships" component={Scholarships} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/admin" component={Admin} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/payment-status" component={PaymentStatus} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(() => {
    try {
      return !!sessionStorage.getItem("linku_splash");
    } catch {
      return true;
    }
  });

  const handleSplashComplete = () => {
    try {
      sessionStorage.setItem("linku_splash", "1");
    } catch {}
    setSplashDone(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            {!splashDone && (
              <SplashScreen onComplete={handleSplashComplete} />
            )}
            <div className="min-h-screen flex flex-col bg-[#0B0F19]">
              <Router />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
