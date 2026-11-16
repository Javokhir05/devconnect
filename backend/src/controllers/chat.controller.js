import { prisma } from "../lib/prisma.js";

const userSelect = { id: true, username: true, name: true, avatar: true };

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid conversation id" });
    return null;
  }
  return id;
}

// open (or create) the chat with another user
export async function startConversation(req, res) {
  const username = String(req.body?.username || "").trim();
  const other = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!other) return res.status(404).json({ error: "User not found" });
  if (other.id === req.userId) {
    return res.status(400).json({ error: "You cannot message yourself" });
  }

  const [a, b] = [req.userId, other.id].sort((x, y) => x - y);
  const conversation = await prisma.conversation.upsert({
    where: { dmKey: `${a}:${b}` },
    update: {},
    create: { dmKey: `${a}:${b}`, members: { create: [{ userId: a }, { userId: b }] } },
    select: { id: true },
  });
  res.status(201).json({ conversationId: conversation.id });
}

export async function listConversations(req, res) {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId: req.userId },
    orderBy: { conversation: { lastMessageAt: "desc" } },
    take: 50,
    include: {
      conversation: {
        include: {
          members: {
            where: { userId: { not: req.userId } },
            include: { user: { select: userSelect } },
          },
          messages: { orderBy: { id: "desc" }, take: 1 },
        },
      },
    },
  });

  const conversations = await Promise.all(
    memberships.map(async (m) => {
      const unread = await prisma.message.count({
        where: {
          conversationId: m.conversationId,
          senderId: { not: req.userId },
          createdAt: { gt: m.lastReadAt },
        },
      });
      const { members, messages } = m.conversation;
      return { id: m.conversationId, user: members[0].user, lastMessage: messages[0] ?? null, unread };
    })
  );
  res.json({ conversations });
}

export async function getMessages(req, res) {
  const conversationId = parseId(req, res);
  if (!conversationId) return;

  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: req.userId } },
  });
  if (!member) return res.status(404).json({ error: "Conversation not found" });

  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const cursor = Number(req.query.cursor) || null;

  const [other, messages] = await Promise.all([
    prisma.conversationMember.findFirst({
      where: { conversationId, userId: { not: req.userId } },
      include: { user: { select: userSelect } },
    }),
    prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { id: "desc" },
    }),
  ]);

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;
  res.json({
    user: other?.user ?? null,
    messages: items, // newest first
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

export async function markRead(req, res) {
  const conversationId = parseId(req, res);
  if (!conversationId) return;

  const result = await prisma.conversationMember.updateMany({
    where: { conversationId, userId: req.userId },
    data: { lastReadAt: new Date() },
  });
  if (result.count === 0) return res.status(404).json({ error: "Conversation not found" });
  res.status(204).end();
}