import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';

interface VideoCallProps {
  teamName: string;
  onEndCall: () => void;
}

const socket = io('https://sturdy-broccoli-x647p9gqjxrhvqrp-5000.app.github.dev');

export const VideoCall: React.FC<VideoCallProps> = ({ teamName, onEndCall }) => {
  // Always get deviceId from localStorage
  const getDeviceId = () => localStorage.getItem('deviceId') || '';

  // Use deviceId from localStorage as myId (socketId)
  const [myId] = useState<string>(getDeviceId());
  // callToId and callerId are userId (string, not array)
  const [callToId, setCallToId] = useState('');
  const [peer, setPeer] = useState<any>(null);
  const [callerId, setCallerId] = useState('');
  const myStreamRef = useRef<MediaStream | null>(null);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [captions, setCaptions] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  // Register deviceId as soon as the component mounts
  useEffect(() => {
    if (myId) {
      socket.emit('register', myId);
      console.log(`Registered Id: ${myId}`);
    }
  }, [myId]);

  useEffect(() => {
    initializeMedia();
    initializeSpeechRecognition();

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        myStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error('Failed to get media:', err);
        alert("Could not access camera or mic.");
      });

    socket.on('incomingCall', ({ from, signalData }) => {
      const accept = window.confirm(`${from} is calling you. Accept?`);
      if (accept) {
        const answerPeer = new SimplePeer({
          initiator: false,
          trickle: false,
          stream: myStreamRef.current!
        });

        answerPeer.on('signal', data => {
          socket.emit('answerCall', { to: from, signal: data });
        });

        answerPeer.on('stream', stream => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        });

        answerPeer.signal(signalData);
        setPeer(answerPeer);
        setCallerId(from);
      }
    });

    socket.on('callAccepted', (signal: any) => {
      peer?.signal(signal);
    });

    socket.on('callEnded', () => {
      endCall();
    });

    return () => {
      socket.off('incomingCall');
      socket.off('callAccepted');
      socket.off('callEnded');
    };
  }, [peer]);

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
      recognitionRef.current.lang = 'en-LR';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const translatedText = translateKoloquaToEnglish(transcript);
        setCaptions(transcript);
        setTranslatedText(translatedText);
      };

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.start();
    }
  };

  const translateKoloquaToEnglish = (koloquaText: string): string => {
    const koloquaToEnglish: { [key: string]: string } = {
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
      'somebody hurt': 'someone is hurt',
      'small small': 'slowly',
      'chop': 'eat/food',
      'ya': 'please',
      'no vex': 'don’t be angry',
      'fine boy': 'handsome boy',
      'fine geh': 'beautiful girl',
      'palava': 'problem',
      'wahala': 'trouble',
      'abi': 'right?/isn’t it?',
      'e don tay': 'it’s been a while',
      'carry go': 'take it away',
      'dash me': 'give me (for free)',
      'make we go': 'let’s go',
      'I dey come': 'I am coming',
      'I no sabi': 'I don’t know',
      'I sabi': 'I know',
      'I beg': 'please',
      'no wahala': 'no problem',
      'I dey': 'I am here',
      'I wan chop': 'I want to eat',
      'I go come': 'I will come',
      'I dey go': 'I am going',
      'I dey vex': 'I am angry',
      'I dey happy': 'I am happy'
    };

    let translated = koloquaText.toLowerCase();
    Object.entries(koloquaToEnglish).forEach(([koloqua, english]) => {
      const regex = new RegExp(`\\b${koloqua}\\b`, 'gi');
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

  // Call userId (not deviceId)
  const callUser = () => {
    if (!myId) {
      alert("No deviceId found in localStorage. Cannot make a call.");
      return;
    }
    if (!callToId) return alert("Enter the user ID to call");

    // Register before calling (in case not registered yet)
    socket.emit('register', myId);

    const callPeer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: myStreamRef.current!
    });

    callPeer.on('signal', data => {
      socket.emit('callUser', {
        userToCall: callToId, // userId
        from: myId,           // deviceId as socketId
        signalData: data
      });
    });

    callPeer.on('stream', stream => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    setPeer(callPeer);
    setCallerId(callToId);
  };

  const endCall = () => {
    if (peer) {
      peer.destroy();
      setPeer(null);
    }
    if (remoteVideoRef.current?.srcObject) {
      // @ts-ignore
      remoteVideoRef.current.srcObject.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      // @ts-ignore
      remoteVideoRef.current.srcObject = null;
    }
    socket.emit('endCall', { to: callerId });
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
          <h2 className="text-lg font-semibold">Emergency Video Call</h2>
          <p className="text-sm text-white/80">{teamName}</p>
        </div>
        <Badge className="bg-green-500">Connected</Badge>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
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
                <span className="text-yellow-400">Koloqua:</span> {captions}
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
        <div className="flex flex-col items-center space-y-4">
          <div className="flex justify-center space-x-6">
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

          {/* WebRTC Manual Controls */}
          <div className="flex flex-wrap gap-2 mt-4">
            <input
              type="text"
              placeholder="Call User ID"
              value={callToId}
              onChange={e => setCallToId(e.target.value)}
              className="px-2 py-1 rounded"
            />
            <button onClick={callUser} className="bg-green-600 text-white px-3 py-1 rounded">Call</button>
            <button onClick={endCall} className="bg-red-600 text-white px-3 py-1 rounded">End Call</button>
          </div>
        </div>
        <p className="text-center text-white/60 text-sm mt-4">
          Tap controls to toggle video/audio
        </p>
      </div>
    </div>
  );
};
