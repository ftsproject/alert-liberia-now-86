import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmergencyType } from '@/pages/Index';
import { useSocket } from '@/hooks/use-socket.tsx';

interface Report {
  _id: string | { $oid: string };
  type: EmergencyType;
  description: string;
  phone: string;
  image?: string;
  video?: string;
  location: {
    lat: number | { $numberDouble: string };
    lng: number | { $numberDouble: string };
    address: string;
  };
  status: string;
  timestamp: string; // <-- Now a string (ISO date)
  deviceId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MyReportsProps {
  onBack: () => void;
}

const MyReports: React.FC<MyReportsProps> = ({ onBack }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket(); // <-- Get socket instance

  useEffect(() => {
    const deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      setReports([]);
      setLoading(false);
      return;
    }

    // Initial fetch (optional, or you can request all via socket)
    const fetchDeviceReports = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://ltc-backend-tqh5.onrender.com/api/reports/device/${deviceId}`
        );
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();
        const sorted = data.sort(
          (a: Report, b: Report) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setReports(sorted);
      } catch (err) {
        setReports([]);
      }
      setLoading(false);
    };

    fetchDeviceReports();

    // --- Listen for new_report events ---
    const handleNewReport = (report: Report) => {
      if (report.deviceId === deviceId) {
        setReports(prev => [report, ...prev]);
        setLoading(false); // <-- stop loading after receiving new report
      }
    };
    socket.on('new_report', handleNewReport);

    return () => {
      socket.off('new_report', handleNewReport);
    };
  }, [socket]);

  const getEmergencyTypeColor = (type: EmergencyType) => {
    switch (type) {
      case 'police':
        return 'bg-liberia-blue';
      case 'fire':
        return 'bg-liberia-red';
      case 'medical':
        return 'bg-green-600';
      case 'disaster':
        return 'bg-orange-600';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return "Unknown time";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Unknown time";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 30) {
      return 'Just now';
    } else if (diffSec < 60) {
      return `${diffSec}s ago`;
    } else if (diffMin < 60) {
      return `${diffMin}m ago`;
    } else if (diffHour < 24) {
      return `${diffHour}h ago`;
    } else {
      if (date.getFullYear() !== now.getFullYear()) {
        return date.toLocaleDateString(undefined, {
          month: 'long',
          day: '2-digit',
          year: 'numeric',
        });
      }
      return date.toLocaleDateString(undefined, {
        month: 'long',
        day: '2-digit',
      });
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
          <h2 className="text-xl md:text-2xl font-bold text-white">My Reports</h2>
          <p className="text-white/70 text-sm md:text-base">Track your submitted emergency reports</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 md:py-12">
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-sm md:text-base">Loading your reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 md:p-8 text-center">
          <AlertTriangle className="h-12 w-12 md:h-16 md:w-16 text-white/50 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No Reports Yet</h3>
          <p className="text-white/70 text-sm md:text-base">
            You haven't submitted any emergency reports yet. 
            When you do, they'll appear here for you to track.
          </p>
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {reports.map((report) => (
            <Card key={typeof report._id === "string" ? report._id : report._id.$oid} className="bg-white/10 backdrop-blur-md border-white/20 p-4 md:p-6">
              <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
                <Badge className={`${getEmergencyTypeColor(report.type)} text-white text-xs`}>
                  {report.type}
                </Badge>
                <span className="text-xs text-white/70">{report.status}</span>
              </div>
              <p className="text-white/80 text-sm md:text-base mb-3 md:mb-4">{report.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm text-white/70">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{report.location.address}</span>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{formatTimeAgo(report.timestamp)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReports;
