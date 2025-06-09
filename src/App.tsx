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
  const [showiOSBanner, setShowiOSBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    // Detect if app is running in standalone mode (PWA installed)
    const checkStandalone = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsStandalone(true);
        return;
      }
      if ((window.navigator as any).standalone === true) {
        setIsStandalone(true);
        return;
      }
      setIsStandalone(false);
    };

    checkStandalone();
    window.addEventListener('resize', checkStandalone);
    window.addEventListener('appinstalled', checkStandalone);

    return () => {
      window.removeEventListener('resize', checkStandalone);
      window.removeEventListener('appinstalled', checkStandalone);
    };
  }, []);

  useEffect(() => {
    const deviceId = localStorage.getItem(DEVICE_ID_KEY);
    const permanentToken = localStorage.getItem(PERMANENT_TOKEN_KEY);

    const registerDevice = async (deviceId: string, permanentToken: string) => {
      try {
        await fetch("https://ltc-backend-tqh5.onrender.com/api/auth/register-device", {
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
        const res = await fetch("https://ltc-backend-tqh5.onrender.com/api/auth/generate-device", {
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
      generateDevice().finally(() => setIsAppLoading(false));
    } else {
      toast({
        title: "Welcome back!",
        description: "Hope all is okay with you.",
        variant: "default",
        duration: 3000,
        className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
      });
      setIsAppLoading(false);
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

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
    if (isIOS && isSafari && !isStandalone) {
      setShowiOSBanner(true);
    } else {
      setShowiOSBanner(false);
    }
  }, [isStandalone]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  // --- LOADING SCREEN WITH LOGO ---
  if (isAppLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <img
          src="/AL.png"
          alt="Alert Liberia Logo"
          className="w-24 h-24 animate-bounce"
          style={{ objectFit: "contain" }}
        />
      </div>
    );
  }

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
        {/* Android/Chrome PWA Banner */}
        {deferredPrompt && !isStandalone && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 flex justify-center z-50">
            <button
              onClick={handleInstallClick}
              className="bg-liberia-blue text-white px-6 py-3 rounded-full shadow-lg font-bold"
            >
              Download App
            </button>
          </div>
        )}
        {/* iOS/Safari Custom Banner */}
        {showiOSBanner && !isStandalone && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 flex justify-center z-50">
            <div className="bg-liberia-blue text-white px-6 py-3 rounded-full shadow-lg font-bold text-center">
              Download App
            </div>
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
