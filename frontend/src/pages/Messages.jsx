import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Code, MessageSquare, Send } from "lucide-react";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import Avatar from "../components/Avatar";
import PostContent from "../components/PostContent";
import { messageTime, timeAgo } from "../utils/time";
import { field } from "../utils/ui";

function ConversationList({ activeId }) {
  const { conversations } = useChat();
  const { user: me } = useAuth();

  if (conversations.length === 0) {
    return (
      <p className="p-4 text-sm text-slate-500">
        No conversations yet. Open a profile and click the message button.
      </p>
    );
  }

  return (
    <ul>
      {conversations.map((c) => {
        const active = String(c.id) === String(activeId);
        const last = c.lastMessage;
        const preview = last
          ? `${last.senderId === me.id ? "you: " : ""}${last.content.replace(/```/g, "").replace(/\s+/g, " ").trim()}`
          : "no messages yet";
        return (
          <li key={c.id}>
            <Link
              to={`/messages/${c.id}`}
              className={`flex items-center gap-3 border-b border-white/10 px-3 py-3 ${
                active ? "bg-accent-500/10" : "hover:bg-white/5"
              }`}
            >
              <Avatar user={c.user} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-white">
                    {c.user.name || c.user.username}
                  </span>
                  {last && (
                    <span className="shrink-0 text-xs text-slate-500">{timeAgo(last.createdAt)}</span>
                  )}
                </div>
                <p className={`truncate text-xs ${c.unread ? "text-slate-200" : "text-slate-500"}`}>
                  {preview}
                </p>
              </div>
              {c.unread > 0 && (
                <span
                  aria-label={`${c.unread} unread`}
                  className="rounded bg-accent-500 px-1.5 text-xs font-medium text-white"
                >
                  {c.unread > 99 ? "99+" : c.unread}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Thread({ id }) {
  const { user: me } = useAuth();
  const { socket, connected, send, openConversation, closeConversation } = useChat();
  const conversationId = Number(id);

  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]); // oldest first
  const [nextCursor, setNextCursor] = useState(null);
  const [state, setState] = useState("loading"); // loading | ok | missing
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);
  const stickRef = useRef(true); // keep the view pinned to the newest message
  const restoreRef = useRef(null); // keeps the scroll position when older messages load
  const wasOffline = useRef(false);

  // load the latest page, and mark the chat as open (read)
  useEffect(() => {
    let cancelled = false;
    openConversation(conversationId);
    api
      .get(`/conversations/${id}/messages`)
      .then((res) => {
        if (cancelled) return;
        setOther(res.data.user);
        setMessages([...res.data.messages].reverse());
        setNextCursor(res.data.nextCursor);
        stickRef.current = true;
        setState("ok");
      })
      .catch(() => !cancelled && setState("missing"));
    return () => {
      cancelled = true;
      closeConversation();
    };
  }, [id, conversationId, openConversation, closeConversation]);

  // live messages
  useEffect(() => {
    if (!socket) return;
    const onNew = (message) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      if (message.senderId !== me.id) api.post(`/conversations/${id}/read`).catch(() => {});
    };
    socket.on("message:new", onNew);
    return () => socket.off("message:new", onNew);
  }, [socket, id, conversationId, me.id]);

  // after a real reconnect, fetch anything we missed while offline
  useEffect(() => {
    if (!connected) {
      wasOffline.current = true;
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    api
      .get(`/conversations/${id}/messages`)
      .then((res) =>
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const fresh = res.data.messages.filter((m) => !known.has(m.id));
          return fresh.length ? [...prev, ...fresh].sort((a, b) => a.id - b.id) : prev;
        })
      )
      .catch(() => {});
  }, [connected, id]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (restoreRef.current !== null) {
      el.scrollTop = el.scrollHeight - restoreRef.current;
      restoreRef.current = null;
    } else if (stickRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, state]);

  const onScroll = () => {
    const el = scrollRef.current;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadEarlier = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get(`/conversations/${id}/messages`, { params: { cursor: nextCursor } });
      const el = scrollRef.current;
      restoreRef.current = el.scrollHeight - el.scrollTop;
      setMessages((prev) => [...[...res.data.messages].reverse(), ...prev]);
      setNextCursor(res.data.nextCursor);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const submit = async (e) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError("");
    try {
      const message = await send(conversationId, content);
      stickRef.current = true;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const insertCode = () =>
    setText((t) => (t && !t.endsWith("\n") ? t + "\n" : t) + "```\n\n```");

  if (state === "loading") return <p className="p-4 text-slate-400">Loading conversation...</p>;
  if (state === "missing") return <p className="p-4 text-slate-400">Conversation not found.</p>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-white/10 px-3 py-2">
        <Link
          to="/messages"
          aria-label="Back to conversations"
          className="rounded p-1 text-slate-400 hover:text-white md:hidden"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        {other && (
          <>
            <Avatar user={other} size="sm" />
            <Link to={`/u/${other.username}`} className="min-w-0">
              <span className="block truncate text-sm font-medium text-white hover:underline">
                {other.name || other.username}
              </span>
              <span className="block truncate text-xs text-slate-500">@{other.username}</span>
            </Link>
          </>
        )}
      </header>

      {!connected && (
        <p role="status" className="bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
          reconnecting...
        </p>
      )}

      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {nextCursor && (
          <button
            onClick={loadEarlier}
            disabled={loadingMore}
            className="mx-auto block text-xs text-accent-400 hover:underline disabled:opacity-50"
          >
            {loadingMore ? "loading..." : "load earlier messages"}
          </button>
        )}
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === me.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`min-w-0 max-w-[85%] break-words rounded-lg border px-3 py-2 text-sm ${
                  mine ? "border-accent-500/40 bg-accent-500/10" : "border-white/10 bg-white/5"
                }`}
              >
                <PostContent text={m.content} />
                <p className="mt-1 text-right text-[10px] text-slate-500">{messageTime(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={submit} className="border-t border-white/10 p-3">
        {error && (
          <p role="alert" className="mb-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            maxLength={2000}
            aria-label="Message"
            placeholder="Type a message (Enter to send, Shift+Enter for a new line)"
            className={`${field} max-h-32 flex-1 resize-none text-sm`}
          />
          <button
            type="button"
            onClick={insertCode}
            aria-label="Insert code block"
            title="Insert code block"
            className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5"
          >
            <Code size={16} aria-hidden="true" />
          </button>
          <button
            disabled={sending || !text.trim() || !connected}
            aria-label="Send message"
            title="Send message"
            className="rounded-lg bg-accent-500 p-2 text-white hover:bg-accent-400 disabled:opacity-50"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Messages() {
  const { id } = useParams();

  return (
    <div className="mx-auto grid h-[calc(100dvh-10.5rem)] max-w-5xl grid-rows-1 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] md:h-[calc(100dvh-3rem)] md:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className={`${id ? "hidden" : "block"} min-h-0 overflow-y-auto border-white/10 md:block md:border-r`}>
        <h2 className="border-b border-white/10 p-3 text-sm text-accent-400">$ messages</h2>
        <ConversationList activeId={id} />
      </aside>

      <section className={`${id ? "block" : "hidden"} min-h-0 md:block`}>
        {id ? (
          <Thread key={id} id={id} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
            <MessageSquare size={32} aria-hidden="true" />
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
      </section>
    </div>
  );
}