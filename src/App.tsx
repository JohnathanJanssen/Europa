import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { JupiterChat } from "@/components/JupiterChat";
import Settings from "./pages/Settings";
import Tools from "./pages/Tools";
import { Router } from "react-router-dom";
import { SpotlightDock } from './components/ui/SpotlightDock';
import { SpotlightProvider } from './state/spotlight';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SpotlightProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<JupiterChat />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/tools" element={<Tools />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
            <SpotlightDock />
          </div>
        </SpotlightProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;