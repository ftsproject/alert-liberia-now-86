import { useContext, createContext } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://ltc-backend-tqh5.onrender.com"; // Change to your backend URL

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });
  }
  return socket;
}

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketInstance = getSocket();
  return (
    <SocketContext.Provider value={socketInstance}>
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
}