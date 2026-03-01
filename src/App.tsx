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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <ThemeToggle />

        <BrowserRouter>
          {/* Optional: show login/logout buttons somewhere visible */}
          {/* Put this in a header later if you want */}
          <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
            <AuthButtons />
          </div>

          <Routes>
            {/* Public landing/onboarding */}
            <Route path="/" element={<Onboarding />} />

            {/* Protected pages */}
            <Route path="/assessment" element={ProtectedRoute(Assessment)({})} />
            <Route path="/coach" element={ProtectedRoute(CoachingPlan)({})} />
            <Route path="/practice" element={ProtectedRoute(PracticeChat)({})} />
            <Route path="/couples" element={ProtectedRoute(CouplesSetup)({})} />
            <Route path="/couples/chat/:code" element={ProtectedRoute(CouplesChat)({})} />
            <Route path="/couples/report/:code" element={ProtectedRoute(CouplesReport)({})} />

            <Route path="*" element={<NotFound />} />
          </Routes>

          <BottomNav />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
