import React from 'react';
import { Home, FileText, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Modern OS detection utility
function getOSClass() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'nav-android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'nav-ios';
  return 'nav-desktop';
}

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
      id: 'news' as const,
      icon: Newspaper,
      label: 'News',
      color: 'text-orange-500'
    },
    {
      id: 'my-reports' as const,
      icon: FileText,
      label: 'My Reports',
      color: 'text-green-500'
    },
  ];

  const osClass = getOSClass();

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20 h-20 sm:h-120 md:h-20 lg:h-20 ${osClass}`}>
      <div className="container mx-auto px-2 h-full">
        <div className="flex justify-around items-center h-full py-0">
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
                } hover:bg-transparent`}
              >
                <IconComponent
                  className={`h-5 w-5 md:h-6 md:w-6 transition-transform ${
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
