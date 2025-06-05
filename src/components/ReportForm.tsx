
import React, { useState } from 'react';
import { ArrowLeft, Camera, Mic, FileText, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EmergencyType, Location } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';

interface ReportFormProps {
  emergencyType: EmergencyType;
  userLocation: Location | null;
  onBack: () => void;
  onSubmit: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  emergencyType,
  userLocation,
  onBack,
  onSubmit
}) => {
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a description of the emergency.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Emergency report submitted:', {
      type: emergencyType,
      description,
      location: userLocation,
      contact: contactInfo,
      mediaCount: mediaFiles.length,
      timestamp: new Date().toISOString()
    });

    setSubmitting(false);
    onSubmit();
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...files]);
      toast({
        title: "Media attached",
        description: `${files.length} file(s) attached to your report.`,
      });
    }
  };

  const getEmergencyTypeIcon = () => {
    switch (emergencyType) {
      case 'police': return '🚔';
      case 'fire': return '🔥';
      case 'medical': return '🚑';
      case 'disaster': return '⚠️';
      default: return '📞';
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
          <h2 className="text-xl md:text-2xl font-bold text-white capitalize">
            {getEmergencyTypeIcon()} Report {emergencyType} Emergency
          </h2>
          <p className="text-white/70 text-sm md:text-base">Provide details to help response teams</p>
        </div>
      </div>

      <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Location Info */}
          <div className="bg-white/5 rounded-lg p-3 md:p-4">
            <div className="flex items-center space-x-2 text-white/80 mb-2">
              <MapPin className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-xs md:text-sm font-medium">Location Information</span>
            </div>
            {userLocation ? (
              <p className="text-white text-xs md:text-sm">
                Coordinates: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
              </p>
            ) : (
              <p className="text-red-300 text-xs md:text-sm">Location not available</p>
            )}
            <div className="flex items-center space-x-2 text-white/60 mt-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs">{new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white font-medium text-sm md:text-base">
              Emergency Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the emergency situation in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50 min-h-[100px] md:min-h-[120px] text-sm md:text-base"
              required
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <Label htmlFor="contact" className="text-white font-medium text-sm md:text-base">
              Contact Information
            </Label>
            <Input
              id="contact"
              type="tel"
              placeholder="Phone number (optional)"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-sm md:text-base"
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-3">
            <Label className="text-white font-medium text-sm md:text-base">
              Attach Media (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 h-auto py-3 md:py-4 text-xs md:text-sm"
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                <Camera className="h-4 w-4 md:h-5 md:w-5 mb-1" />
                <span>Photo</span>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 h-auto py-3 md:py-4 text-xs md:text-sm"
                onClick={() => document.getElementById('audio-upload')?.click()}
              >
                <Mic className="h-4 w-4 md:h-5 md:w-5 mb-1" />
                <span>Audio</span>
              </Button>
            </div>
            
            <input
              id="photo-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
            
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />

            {mediaFiles.length > 0 && (
              <div className="text-white/80 text-xs md:text-sm">
                <FileText className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
                {mediaFiles.length} file(s) attached
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting || !description.trim()}
            className="w-full bg-liberia-red hover:bg-liberia-red/90 text-white py-2 md:py-3 text-base md:text-lg font-semibold"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2"></div>
                Submitting Report...
              </>
            ) : (
              'Submit Emergency Report'
            )}
          </Button>

          <p className="text-white/60 text-xs text-center">
            Your report will be sent to the nearest emergency response team. 
            In life-threatening situations, call emergency services directly.
          </p>
        </form>
      </Card>
    </div>
  );
};
