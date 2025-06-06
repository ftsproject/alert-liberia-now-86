import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmergencyType } from '@/pages/Index';

interface Report {
  id: string;
  type: EmergencyType;
  title: string;
  description: string;
  location: string;
  timestamp: Date;
}

interface MyReportsProps {
  onBack: () => void;
}

const LOCAL_STORAGE_KEY = "alert-liberia-reports";

function loadReportsFromStorage(): Report[] {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    // Convert timestamp back to Date
    return arr.map((r: any) => ({
      ...r,
      timestamp: new Date(r.timestamp),
    }));
  } catch {
    return [];
  }
}

export const saveReportToStorage = (report: Report) => {
  const reports = loadReportsFromStorage();
  reports.unshift(report); // add new report to the top
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
};

export const MyReports: React.FC<MyReportsProps> = ({ onBack }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setReports(loadReportsFromStorage());
      setLoading(false);
    }, 300);
  }, []);

  // Listen for new reports added from other tabs/windows
  useEffect(() => {
    const onStorage = () => setReports(loadReportsFromStorage());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
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
      // If not this year, show "Month Day, Year"
      if (date.getFullYear() !== now.getFullYear()) {
        return date.toLocaleDateString(undefined, {
          month: 'long',
          day: '2-digit',
          year: 'numeric',
        });
      }
      // If this year, show "Month Day"
      return date.toLocaleDateString(undefined, {
        month: 'long',
        day: '2-digit',
      });
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const date = new Date(timestamp);
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
            <Card key={report.id} className="bg-white/10 backdrop-blur-md border-white/20 p-4 md:p-6">
              <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
                <Badge className={`${getEmergencyTypeColor(report.type)} text-white text-xs`}>
                  {report.type}
                </Badge>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-2">{report.title}</h3>
              <p className="text-white/80 text-sm md:text-base mb-3 md:mb-4">{report.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm text-white/70">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{report.location}</span>
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
