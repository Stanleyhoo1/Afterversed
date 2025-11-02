import { memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Survey from "./pages/Survey";
import Complete from "./pages/Complete";
import LoadingDemo from "./pages/LoadingDemo";
import TaskOverview from "./pages/TaskOverview";
import Procedure from "./pages/Procedure";
import FinancialProcedure from "./pages/FinancialProcedure";
import FuneralArrangement from "./pages/FuneralArrangement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = memo(() => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/complete" element={<Complete />} />
          <Route path="/loading" element={<LoadingDemo />} />
          <Route path="/overview" element={<TaskOverview />} />
          <Route path="/procedure" element={<Procedure />} />
          <Route path="/financial-procedure" element={<FinancialProcedure />} />
          <Route path="/funeral-arrangement" element={<FuneralArrangement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
));

App.displayName = 'App';

export default App;
