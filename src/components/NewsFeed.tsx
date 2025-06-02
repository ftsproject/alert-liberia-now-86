
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: 'alert' | 'info' | 'resolved';
  location?: string;
  timestamp: string;
  urgent: boolean;
}

interface NewsFeedProps {
  onBack: () => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ onBack }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch news
    const fetchNews = async () => {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Flash Flood Warning - Monrovia Area',
          content: 'Heavy rainfall expected in the next 6 hours. Residents in low-lying areas should move to higher ground. Emergency shelters are open at local schools.',
          type: 'alert',
          location: 'Monrovia, Montserrado County',
          timestamp: '2024-06-02T10:30:00Z',
          urgent: true
        },
        {
          id: '2',
          title: 'Traffic Accident Cleared - Tubman Boulevard',
          content: 'The multi-vehicle accident on Tubman Boulevard has been cleared. Traffic is now flowing normally in both directions.',
          type: 'resolved',
          location: 'Tubman Boulevard',
          timestamp: '2024-06-02T09:15:00Z',
          urgent: false
        },
        {
          id: '3',
          title: 'Fire Safety Awareness Week',
          content: 'The Liberia National Fire Service is conducting fire safety inspections and training sessions throughout the week. Free smoke detectors available at fire stations.',
          type: 'info',
          location: 'Nationwide',
          timestamp: '2024-06-01T14:00:00Z',
          urgent: false
        },
        {
          id: '4',
          title: 'Power Outage Restored - Paynesville',
          content: 'Power has been fully restored to all areas of Paynesville after the electrical fault. Thank you for your patience.',
          type: 'resolved',
          location: 'Paynesville',
          timestamp: '2024-06-01T11:45:00Z',
          urgent: false
        },
        {
          id: '5',
          title: 'Emergency Contact Numbers Updated',
          content: 'Please note that emergency contact numbers have been updated. Save the new numbers: Police: 911, Fire: 922, Medical: 933.',
          type: 'info',
          timestamp: '2024-05-31T16:20:00Z',
          urgent: true
        }
      ];
      
      setNews(mockNews);
      setLoading(false);
    };

    fetchNews();
  }, []);

  const getNewsIcon = (type: string) => {
    switch (type) {
      case 'alert': return AlertTriangle;
      case 'resolved': return CheckCircle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getNewsColor = (type: string) => {
    switch (type) {
      case 'alert': return 'text-red-400';
      case 'resolved': return 'text-green-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getNewsBadgeVariant = (type: string) => {
    switch (type) {
      case 'alert': return 'destructive';
      case 'resolved': return 'default';
      case 'info': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
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
          <h2 className="text-2xl font-bold text-white">Safety News & Alerts</h2>
          <p className="text-white/70">Latest emergency updates and announcements</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading news...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((item) => {
            const IconComponent = getNewsIcon(item.type);
            return (
              <Card 
                key={item.id} 
                className={`bg-white/10 backdrop-blur-md border-white/20 p-6 ${item.urgent ? 'ring-2 ring-liberia-red' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <IconComponent className={`h-5 w-5 ${getNewsColor(item.type)}`} />
                    <Badge 
                      variant={getNewsBadgeVariant(item.type)}
                      className={item.type === 'resolved' ? 'bg-green-600' : ''}
                    >
                      {item.type.toUpperCase()}
                    </Badge>
                    {item.urgent && (
                      <Badge variant="destructive" className="animate-pulse">
                        URGENT
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-white/60 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(item.timestamp)}</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-3">{item.content}</p>

                {item.location && (
                  <div className="flex items-center space-x-1 text-white/60 text-xs">
                    <MapPin className="h-3 w-3" />
                    <span>{item.location}</span>
                  </div>
                )}
              </Card>
            );
          })}

          {news.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 text-center">
              <Info className="h-16 w-16 text-white/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No news available</h3>
              <p className="text-white/70">Check back later for emergency updates and announcements.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
