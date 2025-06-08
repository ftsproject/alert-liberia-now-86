
import React from 'react';
import { Home, FileText, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  currentView: 'home' | 'news' | 'my-reports';
  onViewChange: (view: 'home' | 'news' | 'my-reports') => void;
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
      id: 'my-reports' as const,
      icon: FileText,
      label: 'My Reports',
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
      <div className="container mx-auto px-2">
        <div className="flex justify-around py-1 md:py-1.5">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onViewChange(item.id)}
                className={`flex-col h-auto py-0.5 md:py-0.75 px-1 md:px-1 space-y-0.25 transition-colors ${
                  isActive 
                    ? `${item.color} bg-white/10`
                    : 'text-white/60'
                }`}
              >
                <IconComponent
                  className={`h-4 w-4 md:h-5 md:w-5 transition-transform ${
                    isActive ? `${item.color}` : ''
                  } ${isActive ? 'scale-110' : ''}`}
                />
                <span className={`text-xs font-medium ${isActive ? item.color : ''}`}>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
