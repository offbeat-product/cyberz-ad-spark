import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import CreateBasic from "./pages/CreateBasic";
import CreateFrames from "./pages/CreateFrames";
import CreateExport from "./pages/CreateExport";
import AdminMedia from "./pages/AdminMedia";
import NotFound from "./pages/NotFound";
import { CreateFlowProvider } from "./contexts/CreateFlowContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CreateFlowProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/create" element={<CreateBasic />} />
              <Route path="/create/frames" element={<CreateFrames />} />
              <Route path="/create/export" element={<CreateExport />} />
              <Route path="/admin/media" element={<AdminMedia />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CreateFlowProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
