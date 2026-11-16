import { io } from "socket.io-client";

const API = "http://localhost:5000/api";
const URL = "http://localhost:5000";
const suffix = Date.now().toString(36);

const json = (token) => ({
  "Content-Type": "application/json",
  ...(token && { Authorization: `Bearer ${token}` }),
});

async function register(name) {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: json(),
    body: JSON.stringify({
      username: `${name}_${suffix}`,
      email: `${name}_${suffix}@example.com`,
      password: "password123",
    }),
  });
  if (!res.ok) throw new Error(`register failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const connect = (token) =>
  new Promise((resolve, reject) => {
    const s = io(URL, { auth: { token } });
    s.on("connect", () => resolve(s));
    s.on("connect_error", reject);
  });

const check = (label, ok) => console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);

const a = await register("chata");
const b = await register("chatb");

// 1. a bad token must be rejected
await connect("not-a-token").then(
  () => check("socket with a bad token is rejected", false),
  (err) => check("socket with a bad token is rejected", err.message === "unauthorized")
);

// 2. open the chat (twice: must be the same conversation)
const open = () =>
  fetch(`${API}/conversations`, {
    method: "POST",
    headers: json(a.token),
    body: JSON.stringify({ username: b.user.username }),
  }).then((r) => r.json());
const { conversationId } = await open();
check("opening the chat twice returns the same id", (await open()).conversationId === conversationId);

// 3. a sends, b receives in real time
const sa = await connect(a.token);
const sb = await connect(b.token);
const received = new Promise((resolve) => sb.on("message:new", resolve));
const sent = await sa.emitWithAck("message:send", { conversationId, content: "hello from a" });
const got = await Promise.race([received, new Promise((r) => setTimeout(() => r(null), 2000))]);
check("sender gets an ok acknowledgement", sent.ok === true);
check("recipient receives the message in real time", got?.content === "hello from a");

// 4. a user outside the chat must not be able to write into it
const c = await register("chatc");
const sc = await connect(c.token);
const intruder = await sc.emitWithAck("message:send", { conversationId, content: "let me in" });
check("a non-member cannot send", intruder.ok === false);

// 5. empty messages are rejected
const empty = await sa.emitWithAck("message:send", { conversationId, content: "   " });
check("an empty message is rejected", empty.ok === false);

// 6. unread count and history over REST
const list = await fetch(`${API}/conversations`, { headers: json(b.token) }).then((r) => r.json());
check("recipient sees 1 unread", list.conversations[0]?.unread === 1);
await fetch(`${API}/conversations/${conversationId}/read`, { method: "POST", headers: json(b.token) });
const after = await fetch(`${API}/conversations`, { headers: json(b.token) }).then((r) => r.json());
check("unread is 0 after marking read", after.conversations[0]?.unread === 0);
const history = await fetch(`${API}/conversations/${conversationId}/messages`, {
  headers: json(b.token),
}).then((r) => r.json());
check("history returns the message", history.messages[0]?.content === "hello from a");

[sa, sb, sc].forEach((s) => s.disconnect());
process.exit(0);