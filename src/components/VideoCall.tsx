import React, { useRef, useState, useEffect } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const SOCKET_SERVER_URL = "https://ltc-backend-tqh5.onrender.com";

const VideoCall: React.FC = () => {
  const [myId, setMyId] = useState("");
  const [callToId, setCallToId] = useState("");
  const [callerId, setCallerId] = useState("");
  const [registered, setRegistered] = useState(false);
  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const myStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Get user media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        myStream.current = stream;
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Failed to get media:", err);
        alert("Could not access camera or mic. Please ensure they are not in use.");
      });

    // Connect socket
    socketRef.current = io(SOCKET_SERVER_URL);

    // Incoming call
    socketRef.current.on("incomingCall", ({ from, signalData }) => {
      setCallerId(from);
      if (window.confirm(`${from} is calling you. Accept?`)) {
        const peer = new SimplePeer({
          initiator: false,
          trickle: false,
          stream: myStream.current!,
        });

        peer.on("signal", (data) => {
          socketRef.current?.emit("answerCall", { to: from, signal: data });
        });

        peer.on("stream", (stream) => {
          if (userVideo.current) {
            userVideo.current.srcObject = stream;
          }
        });

        peer.signal(signalData);
        peerRef.current = peer;
      }
    });

    // Call ended
    socketRef.current.on("callEnded", () => {
      endCall();
    });

    // Cleanup
    return () => {
      socketRef.current?.disconnect();
      myStream.current?.getTracks().forEach((track) => track.stop());
      if (peerRef.current) peerRef.current.destroy();
    };
    // eslint-disable-next-line
  }, []);

  // Accept call
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.on("callAccepted", (signal: SimplePeer.SignalData) => {
      peerRef.current?.signal(signal);
    });
  }, []);

  const register = () => {
    if (!myId) return alert("Enter your ID");
    socketRef.current?.emit("register", myId);
    setRegistered(true);
  };

  const callUser = () => {
    if (!callToId) return alert("Enter the user ID to call");
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: myStream.current!,
    });

    peer.on("signal", (data) => {
      socketRef.current?.emit("callUser", {
        userToCall: callToId,
        from: myId,
        signalData: data,
      });
    });

    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
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
  };

  return (
    <div>
      <h2>Video Call</h2>
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
        />
        <button onClick={callUser} disabled={!registered}>
          Call
        </button>
      </div>
      <div>
        <button onClick={endCall}>End Call</button>
      </div>
      <div>
        <video ref={myVideo} autoPlay muted playsInline style={{ width: 300, margin: 10, border: "2px solid #ccc" }} />
        <video ref={userVideo} autoPlay playsInline style={{ width: 300, margin: 10, border: "2px solid #ccc" }} />
      </div>
    </div>
  );
};

export {VideoCall} ;