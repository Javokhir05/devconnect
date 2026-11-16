import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

// the socket lives on the same server as the API, just without the /api path
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = new URL(API_URL).origin;

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const activeRef = useRef(null); // id of the conversation currently open
  const listRef = useRef([]);

  useEffect(() => {
    listRef.current = conversations;
  }, [conversations]);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/conversations");
      setConversations(res.data.conversations);
    } catch {
      // keep the old list
    }
  }, []);

  // connect when logged in, disconnect on logout
  useEffect(() => {
    if (!userId) {
      setSocket(null);
      setConnected(false);
      setConversations([]);
      return;
    }

    // auth is a function, so a reconnect always sends the current token
    const s = io(SOCKET_URL, { auth: (cb) => cb({ token: localStorage.getItem("token") }) });
    setSocket(s);

    s.on("connect", () => {
      setConnected(true);
      refresh(); // also catches messages that arrived while offline
    });
    s.on("disconnect", () => setConnected(false));

    s.on("message:new", (message) => {
      // a chat we don't know yet (someone just started it): reload the list
      if (!listRef.current.some((c) => c.id === message.conversationId)) {
        refresh();
        return;
      }
      setConversations((prev) => {
        const c = prev.find((x) => x.id === message.conversationId);
        if (!c) return prev;
        const fromOther = message.senderId !== userId;
        const isOpen = activeRef.current === c.id;
        const updated = {
          ...c,
          lastMessage: message,
          unread: fromOther && !isOpen ? c.unread + 1 : c.unread,
        };
        return [updated, ...prev.filter((x) => x.id !== c.id)];
      });
    });

    return () => {
      s.disconnect();
    };
  }, [userId, refresh]);

  const openConversation = useCallback((id) => {
    activeRef.current = id;
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    api.post(`/conversations/${id}/read`).catch(() => {});
  }, []);

  const closeConversation = useCallback(() => {
    activeRef.current = null;
  }, []);

  const send = useCallback(
    async (conversationId, content) => {
      if (!socket?.connected) throw new Error("Not connected. Trying to reconnect...");
      const res = await socket.timeout(8000).emitWithAck("message:send", { conversationId, content });
      if (!res.ok) throw new Error(res.error);
      return res.message;
    },
    [socket]
  );

  const startChat = useCallback(
    async (username) => {
      const res = await api.post("/conversations", { username });
      refresh();
      return res.data.conversationId;
    },
    [refresh]
  );

  const unreadTotal = conversations.reduce((n, c) => n + c.unread, 0);

  return (
    <ChatContext.Provider
      value={{
        socket, connected, conversations, unreadTotal,
        openConversation, closeConversation, send, startChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);