// Polyfill for process.nextTick in browser
if (typeof window !== "undefined" && typeof process === "object" && !process.nextTick) {
  (process as any).nextTick = function (cb: Function) {
    return setTimeout(cb, 0);
  };
}

import React, { useRef, useState, useEffect } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const SOCKET_SERVER_URL = "https://ltc-backend-tqh5.onrender.com";

// Helper to robustly attach a stream to a video element
function attachStream(videoRef: React.RefObject<HTMLVideoElement>, stream: MediaStream) {
  if (videoRef.current) {
    videoRef.current.srcObject = stream;
  } else {
    setTimeout(() => attachStream(videoRef, stream), 100);
  }
}

const VideoCall: React.FC = () => {
  const [myId, setMyId] = useState("");
  const [callToId, setCallToId] = useState("");
  const [callerId, setCallerId] = useState("");
  const [registered, setRegistered] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const myStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        myStream.current = stream;
        attachStream(myVideo, stream);
      })
      .catch((err) => {
        setError("Could not access camera or mic. Please ensure they are not in use.");
      });

    // Handler for incoming call
    const handleIncomingCall = ({ from, signalData }: any) => {
      if (peerRef.current || inCall) return;
      setCallerId(from);
      if (window.confirm(`${from} is calling you. Accept?`)) {
        const peer = new SimplePeer({
          initiator: false,
          trickle: true,
          stream: myStream.current!,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' }
              // Add TURN here for production
            ]
          }
        });

        // All signals (answer, ICE) go through "signal"
        peer.on("signal", (data) => {
          socketRef.current?.emit("signal", { to: from, signal: data });
        });

        peer.on("stream", (stream) => {
          attachStream(userVideo, stream);
        });

        peer.on("error", (err) => {
          setError("Peer connection error: " + err.message);
          endCall();
        });

        peer.signal(signalData);
        peerRef.current = peer;
        setInCall(true);
      }
    };

    // Handle all incoming signaling data for both initiator and receiver
    const handleSignal = ({ signal }: any) => {
      if (peerRef.current) {
        try {
          peerRef.current.signal(signal);
        } catch (e) {
          // Ignore duplicate or invalid signals
        }
      }
    };

    const handleCallEnded = () => {
      endCall();
    };

    socketRef.current.on("incomingCall", handleIncomingCall);
    socketRef.current.on("signal", handleSignal);
    socketRef.current.on("callEnded", handleCallEnded);

    return () => {
      socketRef.current?.off("incomingCall", handleIncomingCall);
      socketRef.current?.off("signal", handleSignal);
      socketRef.current?.off("callEnded", handleCallEnded);
      myStream.current?.getTracks().forEach((track) => track.stop());
      if (peerRef.current) peerRef.current.destroy();
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line
  }, [inCall]);

  const register = () => {
    if (!myId) return alert("Enter your ID");
    socketRef.current?.emit("register", myId);
    setRegistered(true);
    setError(null);
  };

  const callUser = () => {
    if (!callToId) return alert("Enter the user ID to call");
    if (!myStream.current) return setError("No media stream available.");
    if (peerRef.current || inCall) return;
    setError(null);

    const peer = new SimplePeer({
      initiator: true,
      trickle: true,
      stream: myStream.current,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
          // Add TURN here for production
        ]
      }
    });

    // Only send the initial offer via "callUser"
    let offerSent = false;
    peer.on("signal", (data) => {
      if (!offerSent) {
        socketRef.current?.emit("callUser", {
          userToCall: callToId,
          from: myId,
          signalData: data,
        });
        offerSent = true;
      } else {
        // All other signals (ICE) go through "signal"
        socketRef.current?.emit("signal", {
          to: callToId,
          signal: data,
        });
      }
    });

    peer.on("stream", (stream) => {
      attachStream(userVideo, stream);
    });

    peer.on("error", (err) => {
      setError("Peer connection error: " + err.message);
      endCall();
    });

    peerRef.current = peer;
    setCallerId(callToId);
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (userVideo.current && userVideo.current.srcObject) {
      (userVideo.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      userVideo.current.srcObject = null;
    }
    if (callerId) {
      socketRef.current?.emit("endCall", { to: callerId });
    }
    setCallerId("");
    setInCall(false);
  };

  return (
    <div>
      <h2>Video Call</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div>
        <input
          type="text"
          placeholder="Your ID"
          value={myId}
          onChange={(e) => setMyId(e.target.value)}
          disabled={registered}
        />
        <button onClick={register} disabled={registered}>
          Register
        </button>
      </div>
      <div>
        <input
          type="text"
          placeholder="Call User ID"
          value={callToId}
          onChange={(e) => setCallToId(e.target.value)}
          disabled={!registered || inCall}
        />
        <button onClick={callUser} disabled={!registered || inCall}>
          Call
        </button>
      </div>
      <div>
        <button onClick={endCall} disabled={!inCall}>
          End Call
        </button>
      </div>
      <div>
        <video
          ref={myVideo}
          autoPlay
          muted
          playsInline
          style={{ width: 300, margin: 10, border: "2px solid #ccc" }}
        />
        <video
          ref={userVideo}
          autoPlay
          playsInline
          style={{ width: 300, margin: 10, border: "2px solid #ccc" }}
        />
      </div>
    </div>
  );
};

export { VideoCall };