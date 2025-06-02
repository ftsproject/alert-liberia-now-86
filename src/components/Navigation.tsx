
import React from 'react';
import { Home, Users, FileText, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  currentView: 'home' | 'teams' | 'report' | 'news';
  onViewChange: (view: 'home' | 'teams' | 'report' | 'news') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    {
      id: 'home' as const,
      icon: Home,
      label: 'Emergency',
      color: 'text-liberia-red'
    },
    {
      id: 'teams' as const,
      icon: Users,
      label: 'Teams',
      color: 'text-liberia-blue'
    },
    {
      id: 'report' as const,
      icon: FileText,
      label: 'Report',
      color: 'text-green-500'
    },
    {
      id: 'news' as const,
      icon: Newspaper,
      label: 'News',
      color: 'text-orange-500'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onViewChange(item.id)}
                className={`flex-col h-auto py-3 px-4 space-y-1 transition-colors ${
                  isActive 
                    ? `${item.color} bg-white/10` 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <IconComponent className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
