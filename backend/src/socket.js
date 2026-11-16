import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";

const sendSchema = z.object({
  conversationId: z.number().int().positive(),
  content: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message is too long"),
});

export function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" },
  });

  // runs once per connection: reject sockets without a valid JWT
  io.use((socket, next) => {
    try {
      const { userId } = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      socket.data.userId = userId;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`); // every tab of this user joins the same room

    socket.on("message:send", async (payload, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};

      const parsed = sendSchema.safeParse(payload);
      if (!parsed.success) return reply({ ok: false, error: parsed.error.issues[0].message });
      const { conversationId, content } = parsed.data;

      try {
        const members = await prisma.conversationMember.findMany({
          where: { conversationId },
          select: { userId: true },
        });
        if (!members.some((m) => m.userId === userId)) {
          return reply({ ok: false, error: "Conversation not found" });
        }

        const now = new Date();
        const [message] = await prisma.$transaction([
          prisma.message.create({ data: { conversationId, senderId: userId, content } }),
          prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: now } }),
          prisma.conversationMember.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { lastReadAt: now },
          }),
        ]);

        // push to every member's room, including the sender's other tabs
        for (const m of members) io.to(`user:${m.userId}`).emit("message:new", message);
        reply({ ok: true, message });
      } catch (err) {
        console.error(err);
        reply({ ok: false, error: "Could not send message" });
      }
    });
  });

  return io;
}