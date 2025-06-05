
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
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
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface MyReportsProps {
  onBack: () => void;
}

export const MyReports: React.FC<MyReportsProps> = ({ onBack }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading reports from storage or API
    const loadReports = async () => {
      setLoading(true);
      
      // Mock data - in real app this would come from local storage or API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockReports: Report[] = [
        {
          id: '1',
          type: 'medical',
          title: 'Medical Emergency',
          description: 'Person collapsed at Central Market',
          location: 'Central Market, Monrovia',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: 'resolved',
          priority: 'high'
        },
        {
          id: '2',
          type: 'fire',
          title: 'House Fire',
          description: 'Smoke coming from residential building',
          location: 'Sinkor District, Monrovia',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          status: 'resolved',
          priority: 'critical'
        },
        {
          id: '3',
          type: 'police',
          title: 'Traffic Accident',
          description: 'Car accident blocking main road',
          location: 'Broad Street, Monrovia',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          status: 'in-progress',
          priority: 'medium'
        }
      ];
      
      setReports(mockReports);
      setLoading(false);
    };

    loadReports();
  }, []);

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in-progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600';
      case 'in-progress':
        return 'bg-blue-600';
      case 'resolved':
        return 'bg-green-600';
    }
  };

  const getPriorityColor = (priority: Report['priority']) => {
    switch (priority) {
      case 'low':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'high':
        return 'text-orange-400';
      case 'critical':
        return 'text-red-400';
    }
  };

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

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
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
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <Badge className={`${getEmergencyTypeColor(report.type)} text-white text-xs`}>
                    {report.type}
                  </Badge>
                  <Badge 
                    className={`${getStatusColor(report.status)} text-white text-xs`}
                  >
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(report.status)}
                      <span>{report.status.replace('-', ' ')}</span>
                    </div>
                  </Badge>
                </div>
                <div className={`flex items-center space-x-1 ${getPriorityColor(report.priority)}`}>
                  <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs font-medium capitalize">{report.priority}</span>
                </div>
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
