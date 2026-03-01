import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import ThemeToggle from "@/components/ThemeToggle";

import Onboarding from "./pages/Onboarding";
import Assessment from "./pages/Assessment";
import CoachingPlan from "./pages/CoachingPlan";
import PracticeChat from "./pages/PracticeChat";
import CouplesSetup from "./pages/CouplesSetup";
import CouplesChat from "./pages/CouplesChat";
import CouplesReport from "./pages/CouplesReport";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

import ProtectedRoute from "./components/ProtectedRoute";
import AuthButtons from "./components/AuthButtons";

const queryClient = new QueryClient();

const ProtectedAssessment = ProtectedRoute(Assessment);
const ProtectedCoachingPlan = ProtectedRoute(CoachingPlan);
const ProtectedPracticeChat = ProtectedRoute(PracticeChat);
const ProtectedCouplesSetup = ProtectedRoute(CouplesSetup);
const ProtectedCouplesChat = ProtectedRoute(CouplesChat);
const ProtectedCouplesReport = ProtectedRoute(CouplesReport);

const App = () => {
  // 🔎 Debug — runs once on mount
  useEffect(() => {
    console.log("ORIGIN:", window.location.origin);
    console.log("FULL URL:", window.location.href);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <ThemeToggle />

          <BrowserRouter>
            {/* Auth Buttons */}
            <div
              style={{
                position: "fixed",
                top: 12,
                right: 12,
                zIndex: 50,
              }}
            >
              <AuthButtons />
            </div>

            <Routes>
              {/* Public */}
              <Route path="/" element={<Onboarding />} />

              {/* Protected */}
              <Route path="/assessment" element={<ProtectedAssessment />} />
              <Route path="/coach" element={<ProtectedCoachingPlan />} />
              <Route path="/practice" element={<ProtectedPracticeChat />} />
              <Route path="/couples" element={<ProtectedCouplesSetup />} />
              <Route path="/couples/chat/:code" element={<ProtectedCouplesChat />} />
              <Route path="/couples/report/:code" element={<ProtectedCouplesReport />} />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            <BottomNav />
          </BrowserRouter>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
