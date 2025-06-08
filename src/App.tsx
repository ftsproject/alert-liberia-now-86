import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AISurvivalTips from "./pages/AISurvivalTips";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

const DEVICE_ID_KEY = "deviceId";
const PERMANENT_TOKEN_KEY = "permanentToken";

const App = () => {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const deviceId = localStorage.getItem(DEVICE_ID_KEY);
    const permanentToken = localStorage.getItem(PERMANENT_TOKEN_KEY);

    const registerDevice = async (deviceId: string, permanentToken: string) => {
      try {
        await fetch("https://sturdy-broccoli-x647p9gqjxrhvqrp-5000.app.github.dev/api/auth/register-device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, permanentToken }),
        });
      } catch (e) {
        // Optionally handle error
      }
    };

    const generateDevice = async () => {
      try {
        const res = await fetch("https://sturdy-broccoli-x647p9gqjxrhvqrp-5000.app.github.dev/api/auth/generate-device", {
          method: "POST",
        });
        const data = await res.json();
        if (data.deviceId && data.permanentToken) {
          localStorage.setItem(DEVICE_ID_KEY, data.deviceId);
          localStorage.setItem(PERMANENT_TOKEN_KEY, data.permanentToken);
          await registerDevice(data.deviceId, data.permanentToken);
        }
      } catch (e) {
        // Optionally handle error
      }
    };

    if (!deviceId || !permanentToken) {
      generateDevice();
    } else {
      // Welcome back toast
      toast({
        title: "Welcome back!",
        description: "Hope all is okay with you.",
        variant: "default",
      });
    }
  }, [toast]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/AISurvivalTips" element={<AISurvivalTips />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        {deferredPrompt && (
          <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50">
            <button
              onClick={handleInstallClick}
              className="bg-liberia-blue text-white px-6 py-3 rounded-full shadow-lg font-bold"
            >
              Download Alert Liberia App
            </button>
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
