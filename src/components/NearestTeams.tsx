import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, MapPin, Clock, Users, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmergencyType, Location, EmergencyTeam } from '@/pages/Index';
import { VideoCall } from '@/components/VideoCall';
import { useToast } from '@/hooks/use-toast';

interface NearestTeamsProps {
  emergencyType: EmergencyType;
  userLocation: Location | null;
  onBack: () => void;
  onReportEmergency: () => void;
}

export const NearestTeams: React.FC<NearestTeamsProps> = ({
  emergencyType,
  userLocation,
  onBack,
  onReportEmergency
}) => {
  const [teams, setTeams] = useState<EmergencyTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<{ team: EmergencyTeam; isVideo: boolean } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call to fetch nearest teams
    const fetchNearestTeams = async () => {
      setLoading(true);
      
      // Mock data - in real app this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTeams: EmergencyTeam[] = [
        {
          id: '1',
          name: 'Central Fire Station',
          type: 'fire',
          contact: '+231-555-0001',
          status: 'available',
          distance: 1.2,
          location: { lat: 6.3014, lng: -10.7969 }
        },
        {
          id: '2',
          name: 'Police Unit 5',
          type: 'police',
          contact: '+231-555-0002',
          status: 'available',
          distance: 0.8,
          location: { lat: 6.3024, lng: -10.7959 }
        },
        {
          id: '3',
          name: 'Mobile Medical Team A',
          type: 'medical',
          contact: '+231-555-0003',
          status: 'busy',
          distance: 2.1,
          location: { lat: 6.3004, lng: -10.7979 }
        },
        {
          id: '4',
          name: 'Disaster Response Unit',
          type: 'disaster',
          contact: '+231-555-0004',
          status: 'available',
          distance: 1.8,
          location: { lat: 6.3034, lng: -10.7949 }
        }
      ];

      // Filter teams by emergency type and sort by distance
      const filteredTeams = mockTeams
        .filter(team => team.type === emergencyType)
        .sort((a, b) => a.distance - b.distance);
      
      setTeams(filteredTeams);
      setLoading(false);
    };

    if (userLocation) {
      fetchNearestTeams();
    }
  }, [emergencyType, userLocation]);

  const handleCallTeam = (team: EmergencyTeam, isVideo: boolean = false) => {
    toast({
      title: `Starting ${isVideo ? 'video' : 'audio'} call`,
      description: `Connecting you to ${team.name}...`,
    });
    
    setActiveCall({ team, isVideo });
  };

  const handleEndCall = () => {
    setActiveCall(null);
    toast({
      title: "Call ended",
      description: "Call has been disconnected.",
    });
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

  if (activeCall) {
    return (
      <VideoCall
        teamName={activeCall.team.name}
        isVideoCall={activeCall.isVideo}
        onEndCall={handleEndCall}
      />
    );
  }

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
            <Card key={team.id} className="bg-white/10 backdrop-blur-md border-white/20 p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${team.status === 'available' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h3 className="text-base md:text-lg font-semibold text-white">{team.name}</h3>
                </div>
                <Badge 
                  variant={team.status === 'available' ? 'default' : 'destructive'}
                  className={`text-xs ${team.status === 'available' ? 'bg-green-600' : ''}`}
                >
                  {team.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4 text-xs md:text-sm text-white/80">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{team.distance} km away</span>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span>~{Math.round(team.distance * 2)} min ETA</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button 
                  onClick={() => handleCallTeam(team, false)}
                  disabled={team.status === 'busy'}
                  className="flex-1 bg-white text-black hover:bg-gray-100 text-sm"
                >
                  <Phone className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Audio Call
                </Button>
                <Button 
                  onClick={() => handleCallTeam(team, true)}
                  disabled={team.status === 'busy'}
                  className="flex-1 bg-white text-black hover:bg-gray-100 text-sm"
                >
                  <Video className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Video Call
                </Button>
                <Button 
                  onClick={onReportEmergency}
                  variant="outline"
                  className="flex-1 border-white/30 text-white hover:bg-white/10 text-sm"
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
