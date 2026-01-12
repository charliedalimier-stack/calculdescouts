import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ModeProvider } from "@/contexts/ModeContext";
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
import Matrix from "./pages/Matrix";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ProjectProvider>
      <ModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/products" element={<Products />} />
              <Route path="/ingredients" element={<Ingredients />} />
              <Route path="/packaging" element={<Packaging />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/cashflow" element={<CashFlow />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/sensitivity" element={<Sensitivity />} />
              <Route path="/breakeven" element={<Breakeven />} />
              <Route path="/matrix" element={<Matrix />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ModeProvider>
    </ProjectProvider>
  </QueryClientProvider>
);

export default App;
