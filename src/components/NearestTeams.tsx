import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, MapPin, Clock, Users, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmergencyType, Location, EmergencyTeam } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';

interface NearestTeamsProps {
  emergencyType: EmergencyType;
  userLocation: Location | null;
  onBack: () => void;
  onReportEmergency: () => void;
}

interface UserLocation {
  userId: string;
  userRole: string;
  userTeam: string;
  userName: string;
  lat: number;
  lng: number;
  deviceId: string;
  updatedAt: string;
  distance?: number;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  // Haversine formula
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Add this function above your component
const openCallPageWithId = (callId: string) => {
  console.log('Opening call page with ID:', callId);
  const url = `https://socket-backend-lta.onrender.com/?callId=${encodeURIComponent(callId)}`;
  window.open(url, '_blank');
};

export const NearestTeams: React.FC<NearestTeamsProps> = ({
  emergencyType,
  userLocation,
  onBack,
  onReportEmergency
}) => {
  const [teams, setTeams] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Move fetchUserLocations outside useEffect so it can be reused
  const fetchUserLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://ltc-backend-tqh5.onrender.com/api/admin/user-locations");
      const data: UserLocation[] = await res.json();

      // Filter by userRole matching emergencyType
      const filtered = data.filter(
        (u) => u.userRole && u.userRole.toLowerCase() === emergencyType
      );

      // Calculate distance from userLocation
      const withDistance = filtered.map((u) => ({
        ...u,
        distance:
          userLocation
            ? calculateDistance(userLocation.lat, userLocation.lng, u.lat, u.lng)
            : Infinity,
      }));

      // Sort by distance
      withDistance.sort((a, b) => a.distance - b.distance);

      setTeams(withDistance);
    } catch {
      setTeams([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userLocation) return;

    fetchUserLocations(); // Initial fetch

    const interval = setInterval(() => {
      fetchUserLocations();
    }, 10000); // Fetch every 10 seconds

    return () => clearInterval(interval);
  }, [emergencyType, userLocation]);

  // Replace handleCallTeam with this:
  const handleCallTeam = (team: UserLocation) => {
    toast({
      title: `Opening video call`,
      description: `Connecting you to ${team.userName || team.userTeam}...`,
      className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
    });
    // Use the userId string as-is for callId
    openCallPageWithId(team.userId);
  };

  const getEmergencyTypeColor = (type: EmergencyType) => {
    switch (type) {
      case 'police': return 'text-liberia-blue';
      case 'fire': return 'text-liberia-red';
      case 'medical': return 'text-green-600';
      case 'disaster': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="py-4 md:py-6">
      <div className="flex items-center mb-4 md:mb-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-white hover:bg-white/10 mr-3 md:mr-4 p-2"
        >
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white capitalize">
            Nearest {emergencyType} Teams
          </h2>
          <p className="text-white/70 text-sm md:text-base">Teams available in your area</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 md:py-12">
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-sm md:text-base">Finding nearest teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 md:p-8 text-center">
          <Users className="h-12 w-12 md:h-16 md:w-16 text-white/50 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No teams available</h3>
          <p className="text-white/70 mb-4 md:mb-6 text-sm md:text-base">
            No {emergencyType} teams are currently available in your area. 
            You can still submit a report for assistance.
          </p>
          <Button 
            onClick={onReportEmergency}
            className="bg-liberia-red hover:bg-liberia-red/90 text-white"
          >
            Submit Emergency Report
          </Button>
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {teams.map((team) => (
            <Card key={team.userId} className="bg-white/10 backdrop-blur-md border-white/20 p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500`}></div>
                  <h3 className="text-base md:text-lg font-semibold text-white">
                    {team.userName || team.userTeam || "Unknown Team"}
                  </h3>
                </div>
                <Badge 
                  variant="default"
                  className={`text-xs bg-green-600`}
                >
                  {team.userRole}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4 text-xs md:text-sm text-white/80">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{team.distance.toFixed(2)} km away</span>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{Math.round(team.distance * 2)} min Away</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button 
                  onClick={() => handleCallTeam(team)}
                  className="flex-1 bg-white text-black hover:bg-gray-100 text-sm"
                >
                  <Video className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Video Call
                </Button>
                <Button 
                  onClick={onReportEmergency}
                  variant="outline"
                  className="flex-1 bg-white text-black hover:bg-gray-100 text-sm md:text-base"
                >
                  Send Report
                </Button>
              </div>
            </Card>
          ))}

          <div className="pt-2 md:pt-4">
            <Button 
              onClick={onReportEmergency}
              className="w-full bg-white text-black hover:bg-gray-100 py-2 md:py-3 text-sm md:text-base"
            >
              Submit Detailed Emergency Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
