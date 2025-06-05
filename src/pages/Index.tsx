
import React, { useState, useEffect } from 'react';
import { EmergencyTypeSelector } from '@/components/EmergencyTypeSelector';
import { NearestTeams } from '@/components/NearestTeams';
import { ReportForm } from '@/components/ReportForm';
import { NewsFeed } from '@/components/NewsFeed';
import { Navigation } from '@/components/Navigation';
import { Shield, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'teams' | 'report' | 'news'>('home');
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<EmergencyType | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const { toast } = useToast();

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermission('granted');
          toast({
            title: "Location detected",
            description: "We can now show you the nearest emergency teams.",
          });
        },
        (error) => {
          console.error('Location error:', error);
          setLocationPermission('denied');
          toast({
            title: "Location access denied",
            description: "Please enable location services for better emergency response.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const handleEmergencyTypeSelect = (type: EmergencyType) => {
    setSelectedEmergencyType(type);
    if (userLocation) {
      setCurrentView('teams');
    } else {
      toast({
        title: "Location required",
        description: "Please enable location services to find nearby emergency teams.",
        variant: "destructive"
      });
      requestLocation();
    }
  };

  const handleEmergencyCall = () => {
    // In a real app, this would call the actual emergency number
    toast({
      title: "Emergency call initiated",
      description: "Calling emergency services...",
    });
  };

  return (
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
        <div className="flex items-center justify-center space-x-2 text-white/80 text-xs md:text-sm">
          <MapPin className="h-3 w-3 md:h-4 md:w-4" />
          <span>
            {locationPermission === 'granted' && userLocation 
              ? `Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
              : locationPermission === 'denied'
              ? 'Location access denied'
              : 'Detecting location...'
            }
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-20 md:pb-24">
        {currentView === 'home' && (
          <div className="animate-fade-in">
            <EmergencyTypeSelector onSelect={handleEmergencyTypeSelect} />
          </div>
        )}

        {currentView === 'teams' && selectedEmergencyType && (
          <div className="animate-slide-up">
            <NearestTeams 
              emergencyType={selectedEmergencyType}
              userLocation={userLocation}
              onBack={() => setCurrentView('home')}
              onReportEmergency={() => setCurrentView('report')}
            />
          </div>
        )}

        {currentView === 'report' && selectedEmergencyType && (
          <div className="animate-slide-up">
            <ReportForm 
              emergencyType={selectedEmergencyType}
              userLocation={userLocation}
              onBack={() => setCurrentView('teams')}
              onSubmit={() => {
                toast({
                  title: "Report submitted",
                  description: "Your emergency report has been sent to the response team.",
                });
                setCurrentView('home');
              }}
            />
          </div>
        )}

        {currentView === 'news' && (
          <div className="animate-fade-in">
            <NewsFeed onBack={() => setCurrentView('home')} />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
    </div>
  );
};

export default Index;
