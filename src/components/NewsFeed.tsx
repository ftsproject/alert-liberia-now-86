import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axios from 'axios';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  authorId: string;
  authorName?: string;
  authorRole?: string;
  authorTeam?: string;
}

interface ApiNewsItem {
  _id: string;
  title: string;
  body: string;
  createdAt: string;
  author: string;
}

interface ApiUser {
  _id: string;
  name: string;
  role?: string;
  team?: string;
}

interface NewsFeedProps {
  onBack: () => void;
  onSelectNews?: (news: NewsItem) => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ onBack, onSelectNews }) => {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchNewsAndAuthors = async () => {
      try {
        const res = await axios.get<ApiNewsItem[]>('https://ltc-backend-tqh5.onrender.com/api/news');
        const newsData = res.data;

        // Get unique author IDs
        const authorIds = Array.from(new Set(newsData.map(item => item.author)));

        // Fetch all authors in parallel
        const authorResponses = await Promise.all(
          authorIds.map(id =>
            axios.get<ApiUser>(`https://ltc-backend-tqh5.onrender.com/api/auth/users/${id}`)
              .then(res => ({ id, user: res.data }))
              .catch(() => ({ id, user: { _id: id, name: "Unknown" } }))
          )
        );

        // Map authorId to user info
        const authorMap: Record<string, ApiUser> = {};
        authorResponses.forEach(({ id, user }) => {
          authorMap[id] = user;
        });

        // Map news with author info
        const mapped = newsData.map((item) => {
          const author = authorMap[item.author] || { name: "Unknown" };
          return {
            id: item._id,
            title: item.title,
            content: item.body,
            timestamp: item.createdAt,
            authorId: item.author,
            authorName: author.name,
            authorRole: 'role' in author && author.role ? author.role : "",
            authorTeam: 'team' in author && author.team ? author.team : "",
          };
        });
        setNews(mapped);
      } catch (e) {
        // Don't clear news on error, just keep the old news
      }
    };

    fetchNewsAndAuthors();
    interval = setInterval(fetchNewsAndAuthors, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const renderAuthor = (item: NewsItem) => {
    return item.authorName || "Unknown";
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
          <h2 className="text-xl md:text-2xl font-bold text-white">News Feed</h2>
          <p className="text-white/70 text-sm md:text-base">Stay updated with the latest news</p>
        </div>
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <Card
            key={item.id}
            className="bg-white/10 backdrop-blur-md border-white/20 p-6 cursor-pointer hover:bg-white/20 transition"
            onClick={() => onSelectNews && onSelectNews(item)}
          >
            <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-white/80 text-sm mb-4" style={{ whiteSpace: 'pre-line' }}>
              {item.content.length > 100
                ? item.content.slice(0, 100) + '...'
                : item.content}
            </p>
            <div className="flex items-center justify-between text-white/60 text-xs mt-4">
              <span>{renderAuthor(item)}</span>
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(item.timestamp)}</span>
              </span>
            </div>
          </Card>
        ))}

        {news.length === 0 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">No news available</h3>
            <p className="text-white/70">Check back later for emergency updates and announcements.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
