
import React from 'react';
import { Shield, Flame, Ambulance, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmergencyType } from '@/pages/Index';

interface EmergencyTypeSelectorProps {
  onSelect: (type: EmergencyType) => void;
}

const emergencyTypes = [
  {
    type: 'police' as EmergencyType,
    icon: Shield,
    title: 'Police',
    description: 'Crime, missing persons, violence, traffic incidents',
    color: 'bg-liberia-blue hover:bg-liberia-blue/90',
    textColor: 'text-white'
  },
  {
    type: 'fire' as EmergencyType,
    icon: Flame,
    title: 'Fire',
    description: 'Fire, gas leak, electrical hazards',
    color: 'bg-liberia-red hover:bg-liberia-red/90',
    textColor: 'text-white'
  },
  {
    type: 'medical' as EmergencyType,
    icon: Ambulance,
    title: 'Medical',
    description: 'Medical emergency, injury, illness',
    color: 'bg-green-600 hover:bg-green-700',
    textColor: 'text-white'
  },
  {
    type: 'disaster' as EmergencyType,
    icon: AlertTriangle,
    title: 'Disaster',
    description: 'Natural disaster, flooding, infrastructure',
    color: 'bg-orange-600 hover:bg-orange-700',
    textColor: 'text-white'
  }
];

export const EmergencyTypeSelector: React.FC<EmergencyTypeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="py-4 md:py-8">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-4">What type of emergency?</h2>
        <p className="text-white/80 text-base md:text-lg px-4">Select the category that best describes your situation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
        {emergencyTypes.map((emergency) => {
          const IconComponent = emergency.icon;
          return (
            <Card
              key={emergency.type}
              className={`${emergency.color} ${emergency.textColor} cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-0 p-4 md:p-8 active:scale-95`}
              onClick={() => onSelect(emergency.type)}
            >
              <div className="text-center">
                <IconComponent className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-2 md:mb-4" />
                <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-3">{emergency.title}</h3>
                <p className="text-xs md:text-sm opacity-90 leading-relaxed">{emergency.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 md:mt-12 text-center px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 max-w-2xl mx-auto">
          <h3 className="text-white font-semibold mb-2 text-sm md:text-base">Emergency Tips</h3>
          <p className="text-white/80 text-xs md:text-sm">
            In life-threatening situations, call emergency services immediately. 
            This app helps connect you with the nearest available response teams and provides additional support.
          </p>
        </div>
      </div>
    </div>
  );
};
