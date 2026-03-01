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
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import AuthButtons from "./components/AuthButtons";

export default function App() {
  return (
    <div>
      <AuthButtons />
      {/* rest of your app */}
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <ThemeToggle />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/coach" element={<CoachingPlan />} />
            <Route path="/practice" element={<PracticeChat />} />
            <Route path="/couples" element={<CouplesSetup />} />
            <Route path="/couples/chat/:code" element={<CouplesChat />} />
            <Route path="/couples/report/:code" element={<CouplesReport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
