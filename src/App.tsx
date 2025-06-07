import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

const DEVICE_ID_KEY = "deviceId";
const PERMANENT_TOKEN_KEY = "permanentToken";

const App = () => {
  const { toast } = useToast();

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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
