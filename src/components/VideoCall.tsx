
import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VideoCallProps {
  teamName: string;
  isVideoCall: boolean;
  onEndCall: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({ teamName, isVideoCall, onEndCall }) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [captions, setCaptions] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize video stream
    initializeMedia();
    
    // Initialize speech recognition for Krio to English translation
    initializeSpeechRecognition();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-LR'; // Liberian English
      
      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        // Simulate Krio to English translation
        const translatedText = translateKrioToEnglish(transcript);
        setCaptions(transcript);
        setTranslatedText(translatedText);
      };

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      // Start listening
      recognitionRef.current.start();
    }
  };

  const translateKrioToEnglish = (krioText: string): string => {
    // Basic Krio to English translation mappings
    const krioToEnglish: { [key: string]: string } = {
      'wetin': 'what',
      'na': 'is/are',
      'dem': 'they/them',
      'go': 'will/going to',
      'don': 'have/has',
      'dae': 'there/is',
      'wan': 'one/want',
      'lek': 'like',
      'kam': 'come',
      'mek': 'make/let',
      'tell am': 'tell him/her',
      'how yu dae': 'how are you',
      'wetin happen': 'what happened',
      'emergency dae': 'there is an emergency',
      'help we': 'help us',
      'fire dae burn': 'there is a fire',
      'somebody hurt': 'someone is hurt'
    };

    let translated = krioText.toLowerCase();
    
    Object.entries(krioToEnglish).forEach(([krio, english]) => {
      const regex = new RegExp(`\\b${krio}\\b`, 'gi');
      translated = translated.replace(regex, english);
    });

    return translated.charAt(0).toUpperCase() + translated.slice(1);
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
      }
    }
  };

  const cleanup = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleEndCall = () => {
    cleanup();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-liberia-blue text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Emergency Call</h2>
          <p className="text-sm text-white/80">{teamName}</p>
        </div>
        <Badge className="bg-green-500">
          Connected
        </Badge>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {isVideoCall && (
          <>
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </>
        )}
        
        {!isVideoCall && (
          <div className="flex items-center justify-center h-full bg-liberia-blue">
            <div className="text-center text-white">
              <Phone className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Audio Call</h3>
              <p className="text-white/80">{teamName}</p>
            </div>
          </div>
        )}

        {/* Captions Panel */}
        <Card className="absolute bottom-20 left-4 right-4 bg-black/80 backdrop-blur-md border-white/20 text-white p-4">
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Live Captions</span>
            {isListening && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          
          {captions && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-yellow-400">Krio:</span> {captions}
              </div>
              {translatedText && (
                <div className="text-sm">
                  <span className="text-green-400">English:</span> {translatedText}
                </div>
              )}
            </div>
          )}
          
          {!captions && (
            <p className="text-white/60 text-sm">Listening for speech...</p>
          )}
        </Card>
      </div>

      {/* Controls */}
      <div className="bg-black/90 p-6">
        <div className="flex justify-center space-x-6">
          {isVideoCall && (
            <Button
              onClick={toggleVideo}
              variant="outline"
              size="lg"
              className={`w-14 h-14 rounded-full border-2 ${
                isVideoEnabled 
                  ? 'bg-white text-black border-white hover:bg-gray-100' 
                  : 'bg-red-600 text-white border-red-600 hover:bg-red-700'
              }`}
            >
              {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>
          )}
          
          <Button
            onClick={toggleAudio}
            variant="outline"
            size="lg"
            className={`w-14 h-14 rounded-full border-2 ${
              isAudioEnabled 
                ? 'bg-white text-black border-white hover:bg-gray-100' 
                : 'bg-red-600 text-white border-red-600 hover:bg-red-700'
            }`}
          >
            {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>
          
          <Button
            onClick={handleEndCall}
            variant="outline"
            size="lg"
            className="w-14 h-14 rounded-full bg-red-600 text-white border-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
        
        <p className="text-center text-white/60 text-sm mt-4">
          Tap controls to toggle video/audio
        </p>
      </div>
    </div>
  );
};
