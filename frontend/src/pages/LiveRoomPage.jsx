import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLive } from "../contexts/LiveContext";
import { getSocket } from "../services/socket";

export default function LiveRoomPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { fetchAndJoinLive, liveRoom } = useLive();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate(`/login?redirect=/live/${sessionId}`);
      return;
    }
    const socket = getSocket();
    if (!socket || !socket.connected) {
      const check = setInterval(() => {
        const s = getSocket();
        if (s?.connected) {
          clearInterval(check);
          fetchAndJoinLive(sessionId);
        }
      }, 500);
      return () => clearInterval(check);
    }
    fetchAndJoinLive(sessionId);
  }, [sessionId, navigate, fetchAndJoinLive]);

  return null;
}
