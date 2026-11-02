import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const commentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(500, "Comment is too long (max 500 characters)"),
});

function parseId(value, res, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: `Invalid ${label} id` });
    return null;
  }
  return id;
}

async function postExists(postId) {
  return prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
}

export async function likePost(req, res) {
  const postId = parseId(req.params.id, res, "post");
  if (!postId) return;
  if (!(await postExists(postId))) return res.status(404).json({ error: "Post not found" });

  await prisma.like.upsert({
    where: { userId_postId: { userId: req.userId, postId } },
    create: { userId: req.userId, postId },
    update: {},
  });
  const likes = await prisma.like.count({ where: { postId } });
  res.json({ liked: true, likes });
}

export async function unlikePost(req, res) {
  const postId = parseId(req.params.id, res, "post");
  if (!postId) return;
  if (!(await postExists(postId))) return res.status(404).json({ error: "Post not found" });

  await prisma.like.deleteMany({ where: { userId: req.userId, postId } });
  const likes = await prisma.like.count({ where: { postId } });
  res.json({ liked: false, likes });
}

const commentInclude = {
  user: { select: { id: true, username: true, name: true, avatar: true } },
};

export async function getComments(req, res) {
  const postId = parseId(req.params.id, res, "post");
  if (!postId) return;
  if (!(await postExists(postId))) return res.status(404).json({ error: "Post not found" });

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { id: "asc" },
    take: 100,
    include: commentInclude,
  });
  res.json({ comments });
}

export async function createComment(req, res) {
  const postId = parseId(req.params.id, res, "post");
  if (!postId) return;
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.issues.map((i) => i.message) });
  }
  if (!(await postExists(postId))) return res.status(404).json({ error: "Post not found" });

  const comment = await prisma.comment.create({
    data: { content: parsed.data.content, postId, userId: req.userId },
    include: commentInclude,
  });
  res.status(201).json({ comment });
}

export async function deleteComment(req, res) {
  const id = parseId(req.params.id, res, "comment");
  if (!id) return;

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  if (comment.userId !== req.userId) {
    return res.status(403).json({ error: "You can only delete your own comments" });
  }

  await prisma.comment.delete({ where: { id } });
  res.status(204).end();
}
