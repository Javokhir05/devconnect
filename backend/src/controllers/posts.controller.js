import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const postSchema = z.object({
  content: z.string().trim().min(1, "Post cannot be empty").max(1000, "Post is too long (max 1000 characters)"),
});

// only expose safe author fields, plus like/comment counts
const postInclude = {
  author: { select: { id: true, username: true, name: true, avatar: true } },
  _count: { select: { likes: true, comments: true } },
};

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid post id" });
    return null;
  }
  return id;
}

export async function createPost(req, res) {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.issues.map((i) => i.message) });
  }
  const post = await prisma.post.create({
    data: { content: parsed.data.content, authorId: req.userId },
    include: postInclude,
  });
  res.status(201).json({ post });
}

// cursor pagination: GET /api/posts?limit=20&cursor=<lastPostId>
export async function getFeed(req, res) {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = Number(req.query.cursor) || null;

  const posts = await prisma.post.findMany({
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { id: "desc" },
    include: postInclude,
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  res.json({ posts: items, nextCursor: hasMore ? items[items.length - 1].id : null });
}

export async function getPost(req, res) {
  const id = parseId(req, res);
  if (!id) return;
  const post = await prisma.post.findUnique({ where: { id }, include: postInclude });
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json({ post });
}

export async function updatePost(req, res) {
  const id = parseId(req, res);
  if (!id) return;
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.issues.map((i) => i.message) });
  }

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Post not found" });
  if (existing.authorId !== req.userId) {
    return res.status(403).json({ error: "You can only edit your own posts" });
  }

  const post = await prisma.post.update({
    where: { id },
    data: { content: parsed.data.content },
    include: postInclude,
  });
  res.json({ post });
}

export async function deletePost(req, res) {
  const id = parseId(req, res);
  if (!id) return;

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Post not found" });
  if (existing.authorId !== req.userId) {
    return res.status(403).json({ error: "You can only delete your own posts" });
  }

  await prisma.post.delete({ where: { id } });
  res.status(204).end();
}