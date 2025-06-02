
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, MapPin, Clock, Users } from 'lucide-react';
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

export const NearestTeams: React.FC<NearestTeamsProps> = ({
  emergencyType,
  userLocation,
  onBack,
  onReportEmergency
}) => {
  const [teams, setTeams] = useState<EmergencyTeam[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleCallTeam = (team: EmergencyTeam) => {
    toast({
      title: "Calling emergency team",
      description: `Connecting you to ${team.name}...`,
    });
    // In real app: window.location.href = `tel:${team.contact}`;
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
    <div className="py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-white hover:bg-white/10 mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-white capitalize">
            Nearest {emergencyType} Teams
          </h2>
          <p className="text-white/70">Teams available in your area</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Finding nearest teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 text-center">
          <Users className="h-16 w-16 text-white/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No teams available</h3>
          <p className="text-white/70 mb-6">
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
        <div className="space-y-4">
          {teams.map((team) => (
            <Card key={team.id} className="bg-white/10 backdrop-blur-md border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${team.status === 'available' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                </div>
                <Badge 
                  variant={team.status === 'available' ? 'default' : 'destructive'}
                  className={team.status === 'available' ? 'bg-green-600' : ''}
                >
                  {team.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-white/80">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{team.distance} km away</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>~{Math.round(team.distance * 2)} min ETA</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  onClick={() => handleCallTeam(team)}
                  disabled={team.status === 'busy'}
                  className="flex-1 bg-liberia-red hover:bg-liberia-red/90 text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Team
                </Button>
                <Button 
                  onClick={onReportEmergency}
                  variant="outline"
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                >
                  Send Report
                </Button>
              </div>
            </Card>
          ))}

          <div className="pt-4">
            <Button 
              onClick={onReportEmergency}
              className="w-full bg-liberia-blue hover:bg-liberia-blue/90 text-white py-3"
            >
              Submit Detailed Emergency Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
