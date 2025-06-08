import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewsDetailProps {
  news: {
    title: string;
    content: string;
    timestamp: string;
    authorName?: string;
    authorRole?: string;
    authorTeam?: string;
  };
  onBack: () => void;
  aiSummary: string;
}

export const NewsDetail: React.FC<NewsDetailProps> = ({ news, onBack, aiSummary }) => {
  const formatFullDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white hover:bg-white/10 mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">News Details</h2>
          <p className="text-white/70 text-sm md:text-base">Full article with AI Summary below</p>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">{news.title}</h1>
      <div className="mb-4 text-white/80 whitespace-pre-line">{news.content}</div>
      <div className="mb-4 text-white/60 text-sm">
        <div>
          <strong>Published:</strong> {formatFullDate(news.timestamp)}
        </div>
        <div>
          <strong>Author:</strong> {news.authorName || "Unknown"}
        </div>
        {news.authorRole && (
          <div>
            <strong>Role:</strong> {news.authorRole}
          </div>
        )}
        {news.authorTeam && (
          <div>
            <strong>Team:</strong> {news.authorTeam}
          </div>
        )}
      </div>
      <div className="bg-white/10 border border-white/20 rounded p-4 mt-6">
        <h3 className="text-lg font-semibold text-white mb-2">AI Summary</h3>
        <p className="text-white/80">{aiSummary}</p>
      </div>
    </div>
  );
};