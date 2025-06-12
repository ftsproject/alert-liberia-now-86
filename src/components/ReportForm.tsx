import React, { useState } from 'react';
import { ArrowLeft, Camera, Mic, FileText, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EmergencyType, Location } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/use-socket.tsx';

interface ReportFormProps {
  emergencyType: EmergencyType;
  userLocation: Location | null;
  onBack: () => void;
  onSubmit: (info: {
    description: string;
    location: { lat: number; lng: number; address?: string };
    contact: string;
  }) => void;
}

// Add this helper function at the top (outside your component)
function resetViewportScale() {
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    // Reset the scale to 1.0
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=0.8, maximum-scale=0.8, user-scalable=0'
    );
    // Allow user to zoom again after a short delay
    setTimeout(() => {
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=0.8, maximum-scale=0.8, user-scalable=0'
      );
    }, 300);
  }
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
  const [listening, setListening] = useState(false);
  const { toast } = useToast();
  const socket = useSocket(); // <-- Get socket instance

  // Convert file to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a description of the emergency.",
        variant: "destructive",
        className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
      });
      return;
    }
    if (!userLocation) {
      toast({
        title: "Location required",
        description: "Location information is required to submit a report.",
        variant: "destructive",
        className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
      });
      return;
    }

    setSubmitting(true);

    // Convert media file to base64 if present
    let image = "";
    let video = "";
    if (mediaFiles.length > 0) {
      const file = mediaFiles[0];
      const base64 = await fileToBase64(file);
      if (file.type.startsWith("image/")) {
        image = base64;
      } else if (file.type.startsWith("video/")) {
        video = base64;
      }
    }

    // Get deviceId and permanentToken from localStorage
    const deviceId = localStorage.getItem("deviceId") || "";
    const permanentToken = localStorage.getItem("permanentToken") || "";

    // Prepare payload
    const payload = {
      type: emergencyType,
      description,
      phone: contactInfo,
      image,
      video,
      location: {
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: userLocation.address || "",
      },
      timestamp: new Date().toISOString(),
      deviceId,
      permanentToken,
    };

    // Use socket.emit and handle response
    socket.emit('submitReport', payload, (response: { success: boolean; error?: string }) => {
      setSubmitting(false); // <-- stop spinner
      if (response.success) {
        toast({
          title: "Report submitted",
          description: "Your emergency report has been sent to the response team.",
          className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
        });
        onSubmit({
          description,
          location: {
            lat: userLocation.lat,
            lng: userLocation.lng,
            address: userLocation.address || "",
          },
          contact: contactInfo,
        });
      } else {
        toast({
          title: "Submission failed",
          description: response.error || "Could not submit your report. Please try again.",
          variant: "destructive",
          className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
        });
      }
    });
  };

  // Only allow one media file (image or video, or none)
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => f.size > 0);
      if (files.length > 1) {
        toast({
          title: "Only one media file allowed",
          description: "Please select only one photo or video.",
          variant: "destructive",
          className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
        });
        // Reset the file input
        e.target.value = "";
        setMediaFiles([]);
        return;
      }
      setMediaFiles(files);
      if (files.length === 1) {
        toast({
          title: "Media attached",
          description: `${files[0].name} attached to your report.`,
          className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
        });
      }
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast({
        title: "Voice input not supported",
        description: "Your browser does not support speech recognition.",
        variant: "destructive",
        className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
      });
      return;
    }
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription(prev => prev ? prev + " " + transcript : transcript);
      toast({
        title: "Voice input added",
        description: "Transcribed speech added to description.",
        className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
      });
    };

    recognition.onerror = () => {
      setListening(false);
      toast({
        title: "Voice input error",
        description: "Could not recognize your speech. Please try again.",
        variant: "destructive",
        className: "sm:max-w-xs md:max-w-sm rounded-xl shadow-lg"
      });
    };

    recognition.start();
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
            <div className="flex items-center gap-2">
              <Label htmlFor="description" className="text-white font-medium text-sm md:text-base">
                Emergency Description *
              </Label>
              <Button
                type="button"
                size="icon"
                variant={listening ? "secondary" : "outline"}
                className={`ml-auto ${listening ? "animate-pulse bg-green-600 text-white" : "bg-white/10 text-white"}`}
                aria-label="Voice to text"
                onClick={handleVoiceInput}
                title="Voice to text"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              id="description"
              placeholder="Describe the emergency situation in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={resetViewportScale}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50 min-h-[100px] md:min-h-[120px] text-sm md:text-base"
              required
            />
            {listening && (
              <div className="text-green-400 text-xs mt-1">Listening... Speak now.</div>
            )}
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
              onBlur={resetViewportScale}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-sm md:text-base"
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-3">
            <Label className="text-white font-medium text-sm md:text-base">
              Attach Media (Photo or Video, Optional)
            </Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-2 border-dashed border-white/60 text-white bg-white/10 hover:bg-white/20 h-20 md:h-24 flex flex-col items-center justify-center transition"
                onClick={() => document.getElementById('media-upload')?.click()}
              >
                <Camera className="h-6 w-6 md:h-8 md:w-8 mb-2" />
                <span className="font-semibold text-xs md:text-sm">Add Photo/Video</span>
                <span className="text-[10px] md:text-xs text-white/60 mt-1">Max 1 file</span>
              </Button>
            </div>
            
            <input
              id="media-upload"
              type="file"
              accept="
                image/jpeg,
                image/png,
                image/gif,
                image/webp,
                image/avif,
                image/heic,
                image/heif,
                image/bmp,
                image/tiff,
                image/x-icon,
                image/svg+xml,
                video/mp4,
                video/quicktime,
                video/x-msvideo,
                video/x-matroska,
                video/webm,
                video/3gpp,
                video/3gpp2,
                video/ogg,
                video/mpeg,
                video/avi,
                video/mov
              "
              onChange={handleMediaUpload}
              className="hidden"
            />

            {mediaFiles.length > 0 && (
              <div className="text-white/80 text-xs md:text-sm mt-2">
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
