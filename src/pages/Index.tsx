import React, { useState, useEffect } from 'react';
import { EmergencyTypeSelector } from '@/components/EmergencyTypeSelector';
import { NearestTeams } from '@/components/NearestTeams';
import { ReportForm } from '@/components/ReportForm';
import { NewsFeed } from '@/components/NewsFeed';
import MyReports from '@/components/MyReports';
import { Navigation } from '@/components/Navigation';
import { Shield, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { NewsDetail } from '@/components/NewsDetail';
import { InferenceClient } from "@huggingface/inference";
import { useNavigate } from "react-router-dom";
import ChatWithAI from './ChatWithAI'; // Add this import
import { MessageCircle } from 'lucide-react'; // For chat icon
import { SocketProvider } from '@/hooks/use-socket.tsx';

export type EmergencyType = 'police' | 'fire' | 'medical' | 'disaster';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface EmergencyTeam {
  id: string;
  name: string;
  type: EmergencyType;
  contact: string;
  status: 'available' | 'busy';
  distance: number;
  location: Location;
}
const client = new InferenceClient("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");

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'news' | 'my-reports'>('home');
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<EmergencyType | null>(null);
  const [showTeams, setShowTeams] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [locationString, setLocationString] = useState<string>("");
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [showAISolution, setShowAISolution] = useState(false);
  const [lastReport, setLastReport] = useState<{
    description: string;
    location: { lat: number; lng: number; address?: string };
    contact: string;
  } | null>(null);
  const [showChat, setShowChat] = useState(false); // Add this state
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const LOCATION_PERMISSION_KEY = "locationPermission";

  // Show prompt on mount if not already granted/denied
  useEffect(() => {
    if (locationPermission === 'pending') {
      setShowLocationPrompt(true);
    }
  }, [locationPermission]);

  // Check saved location permission on mount
  useEffect(() => {
    const savedPermission = localStorage.getItem(LOCATION_PERMISSION_KEY);
    if (savedPermission === "granted") {
      setLocationPermission("granted");
      // Optionally, auto-request location here if you want
      requestLocation();
    } else if (savedPermission === "denied") {
      setLocationPermission("denied");
    } else {
      setLocationPermission("pending");
    }
  }, []);

  // Custom handler for user action
  const handleAllowLocation = () => {
    setShowLocationPrompt(false);
    localStorage.setItem(LOCATION_PERMISSION_KEY, "granted"); // Save choice
    // Now request location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log("Latitude:", lat, "Longitude:", lng); // Log lat and long
          let address = "";
          let name = "";
          let neighbourhood = "";
          try {
            // Use OpenStreetMap Nominatim for free reverse geocoding
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await res.json();
            address = data.display_name || "";
            name = data.name || "";
            neighbourhood = data.address?.neighbourhood || "";
          } catch {
            address = "";
            name = "";
            neighbourhood = "";
          }
          setUserLocation({
            lat,
            lng,
            address,
          });
          // Use name, then neighbourhood, then display_name
          let locationLabel = name
            ? name
            : neighbourhood
            ? neighbourhood
            : address;
          setLocationString(locationLabel);
          setLocationPermission('granted');
        },
        (error) => {
          setLocationPermission('denied');
          setLocationString("");
          toast({
            title: "Location access denied",
            description: "Please enable location services for better emergency response.",
            variant: "destructive",
            className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
          });
        }
      );
    }
  };

  const handleDenyLocation = () => {
    setShowLocationPrompt(false);
    setLocationPermission('denied');
    setLocationString("");
    localStorage.setItem(LOCATION_PERMISSION_KEY, "denied"); // Save choice
    toast({
      title: "Location access denied",
      description: "Please enable location services for better emergency response.",
      variant: "destructive",
      className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
    });
  };

  // Send/Update user location every 5 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const sendLocation = async (lat: number, lng: number, deviceId: string) => {
      try {
        await fetch("https://ltc-backend-tqh5.onrender.com/api/admin/user-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng, deviceId }),
        });
      } catch (e) {
        // Optionally handle error
      }
    };

    if (userLocation && userLocation.lat && userLocation.lng) {
      const deviceId = localStorage.getItem("deviceId");
      if (deviceId) {
        // Send immediately
        sendLocation(userLocation.lat, userLocation.lng, deviceId);
        // Then every 5 seconds
        interval = setInterval(() => {
          sendLocation(userLocation.lat, userLocation.lng, deviceId);
        }, 5000);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [userLocation]);

  // AI summarization using HuggingFace InferenceClient
  useEffect(() => {
    let abort = false;
    const fetchSummary = async () => {
      if (selectedNews) {
        setAiSummary("Summarizing...");
        try {
          const chatCompletion = await client.chatCompletion({
            provider: "auto",
            model: "deepseek-ai/DeepSeek-R1-0528",
            messages: [
              {
                role: "user",
                content: `Summarize this news article and make it simple and should be all text and no format:\n\n${selectedNews.content}`,
              },
            ],
          });

          if (!abort) {
            const answer = chatCompletion.choices[0].message.content
              .replace(/<think>[\s\S]*?<\/think>/gi, '')
              .replace(/<think>[\\s\\S]*?\\n/gi, '')
              .trim();
            setAiSummary(answer || "No summary available.");
          }
        } catch {
          if (!abort) setAiSummary("Failed to summarize.");
        }
      } else {
        setAiSummary("");
      }
    };
    fetchSummary();
    return () => { abort = true; };
  }, [selectedNews]);

  const handleEmergencyTypeSelect = (type: EmergencyType) => {
    setSelectedEmergencyType(type);
    if (userLocation) {
      setShowTeams(true);
    } else {
      toast({
        title: "Location required",
        description: "Please enable location services to find nearby emergency teams.",
        variant: "destructive",
        className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
      });
      requestLocation();
    }
  };

  const handleEmergencyCall = () => {
    // Open phone dialer with 4455
    window.location.href = "tel:4455";
    toast({
      title: "Emergency call initiated",
      description: "Calling emergency services...",
      className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
    });
  };

  const handleBackToHome = () => {
    setShowTeams(false);
    setShowReportForm(false);
    setSelectedEmergencyType(null);
    setCurrentView('home');
  };

  const handleReportEmergency = () => {
    setShowTeams(false);
    setShowReportForm(true);
  };

  const handleReportSubmit = (reportInfo?: {
    description: string;
    location: { lat: number; lng: number; address?: string };
    contact: string;
  }) => {
    toast({
      title: "Report submitted",
      description: "Your emergency report has been sent to the response team.",
      className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
    });
    if (reportInfo) {
      // Use react-router-dom's navigate with state
      navigate("/AISurvivalTips", {
        state: {
          description: reportInfo.description,
          lat: reportInfo.location.lat,
          lng: reportInfo.location.lng,
          address: reportInfo.location.address || "",
          contact: reportInfo.contact,
        },
      });
      setShowReportForm(false);
      setShowTeams(false);
      setCurrentView('home');
    } else {
      handleBackToHome();
    }
  };

  function cleanSummary(text: string) {
    return text
      .replace(/[*#]+/g, "") // Remove all * and # characters
      .replace(/^\s+|\s+$/g, ""); // Trim whitespace
  }

  function requestLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let address = "";
          let name = "";
          let neighbourhood = "";
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await res.json();
            address = data.display_name || "";
            name = data.name || "";
            neighbourhood = data.address?.neighbourhood || "";
          } catch {
            address = "";
            name = "";
            neighbourhood = "";
          }
          setUserLocation({
            lat,
            lng,
            address,
          });
          let locationLabel = name
            ? name
            : neighbourhood
            ? neighbourhood
            : address;
          setLocationString(locationLabel);
          setLocationPermission('granted');
        },
        (error) => {
          setLocationPermission('denied');
          setLocationString("");
          toast({
            title: "Location access denied",
            description: "Please enable location services for better emergency response.",
            variant: "destructive",
            className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
          });
        }
      );
    }
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gradient-to-br from-liberia-blue via-slate-900 to-liberia-blue">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 md:space-x-3">
                <Shield className="h-6 w-6 md:h-8 md:w-8 text-liberia-red" />
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-white">Alert Liberia</h1>
                  <p className="text-xs text-white/70">Emergency Response</p>
                </div>
              </div>
              <Button 
                onClick={handleEmergencyCall}
                className="bg-white text-black hover:bg-gray-100 font-bold px-3 py-1.5 md:px-6 md:py-2 text-sm md:text-base rounded-full animate-pulse"
              >
                Emergency Call
              </Button>
            </div>
          </div>
        </header>

        {/* Location Status */}
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center space-x-2 text-white/80 text-xs md:text-sm overflow-x-auto">
            <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {locationPermission === 'granted' && userLocation && locationString
                ? `Location detected - ${locationString}`
                : locationPermission === 'denied'
                ? 'Location access denied'
                : 'Detecting location...'
              }
            </span>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 pb-20 md:pb-24">
          {currentView === 'home' && !showTeams && !showReportForm && (
            <div className="animate-fade-in">
              <EmergencyTypeSelector onSelect={handleEmergencyTypeSelect} />
            </div>
          )}

          {showTeams && selectedEmergencyType && (
            <div className="animate-slide-up">
              <NearestTeams 
                emergencyType={selectedEmergencyType}
                userLocation={userLocation}
                onBack={handleBackToHome}
                onReportEmergency={handleReportEmergency}
              />
            </div>
          )}

          {showReportForm && selectedEmergencyType && (
            <div className="animate-slide-up">
              <ReportForm 
                emergencyType={selectedEmergencyType}
                userLocation={userLocation}
                onBack={() => setShowReportForm(false)}
                onSubmit={(info) => handleReportSubmit(info)}
              />
            </div>
          )}

          {currentView === 'news' && selectedNews && (
            <div className="animate-fade-in">
              <NewsDetail
                news={selectedNews}
                aiSummary={cleanSummary(aiSummary)}
                onBack={() => setSelectedNews(null)}
              />
            </div>
          )}

          {currentView === 'news' && !selectedNews && (
            <div className="animate-fade-in">
              <NewsFeed
                onBack={() => setCurrentView('home')}
                onSelectNews={setSelectedNews}
              />
            </div>
          )}

          {currentView === 'my-reports' && (
            <div className="animate-fade-in">
              <MyReports onBack={() => setCurrentView('home')} />
            </div>
          )}
        </main>

        {/* Floating Chat Button - move this ABOVE Navigation */}
        <button
          className="fixed bottom-24 right-6 z-40 bg-liberia-blue hover:bg-liberia-red text-white rounded-full shadow-lg p-4 flex items-center justify-center transition-all"
          onClick={() => setShowChat(true)}
          aria-label="Chat with AI"
        >
          <MessageCircle className="w-6 h-6" />
        </button>

        {/* Chat Modal */}
        {showChat && (
          <ChatWithAI onClose={() => setShowChat(false)} />
        )}

        {/* Bottom Navigation */}
        <Navigation 
          currentView={currentView}
          onViewChange={setCurrentView}
        />

        {/* Custom Location Prompt Modal */}
        {showLocationPrompt && locationPermission === 'pending' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full text-center">
              <h2 className="text-lg font-bold mb-2 text-liberia-blue">Allow Location Access?</h2>
              <p className="text-gray-700 mb-4">
                To find nearby emergency teams and provide accurate help, we need your location.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  className="bg-liberia-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-liberia-blue/90"
                  onClick={handleAllowLocation}
                >
                  Allow
                </button>
                <button
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
                  onClick={handleDenyLocation}
                >
                  Deny
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SocketProvider>
  );
};

export default Index;
