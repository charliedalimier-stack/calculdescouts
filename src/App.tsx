import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Products from "./pages/Products";
import Ingredients from "./pages/Ingredients";
import Packaging from "./pages/Packaging";
import Recipes from "./pages/Recipes";
import Pricing from "./pages/Pricing";
import Sales from "./pages/Sales";
import CashFlow from "./pages/CashFlow";
import Analysis from "./pages/Analysis";
import Sensitivity from "./pages/Sensitivity";
import Breakeven from "./pages/Breakeven";
import StressTest from "./pages/StressTest";
import Matrix from "./pages/Matrix";
import Stocks from "./pages/Stocks";
import TVA from "./pages/TVA";
import PlanFinancier from "./pages/PlanFinancier";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";

import Reports from "./pages/Reports";
import Investments from "./pages/Investments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProjectProvider>
        <ModeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/plan-financier" element={<ProtectedRoute><PlanFinancier /></ProtectedRoute>} />
                <Route path="/budget-vs-reel" element={<Navigate to="/plan-financier" replace />} />
                <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                <Route path="/ingredients" element={<ProtectedRoute><Ingredients /></ProtectedRoute>} />
                <Route path="/packaging" element={<ProtectedRoute><Packaging /></ProtectedRoute>} />
                <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
                <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
                <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                <Route path="/cashflow" element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
                <Route path="/analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
                <Route path="/sensitivity" element={<ProtectedRoute><Sensitivity /></ProtectedRoute>} />
                <Route path="/breakeven" element={<ProtectedRoute><Breakeven /></ProtectedRoute>} />
                <Route path="/stress-test" element={<ProtectedRoute><StressTest /></ProtectedRoute>} />
                <Route path="/matrix" element={<ProtectedRoute><Matrix /></ProtectedRoute>} />
                <Route path="/stocks" element={<ProtectedRoute><Stocks /></ProtectedRoute>} />
                <Route path="/tva" element={<ProtectedRoute><TVA /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ModeProvider>
      </ProjectProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
