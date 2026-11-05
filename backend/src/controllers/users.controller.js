import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { includeFor, shape } from "./posts.controller.js";


const publicSelect = {
  id: true, username: true, name: true, bio: true, location: true,
  avatar: true, githubUrl: true, portfolioUrl: true, createdAt: true,
};

// Skills schema

const skillName = z
  .string()
  .trim()
  .min(2, "Each skill must be at least 2 characters")
  .max(30, "Each skill can be at most 30 characters")
  .regex(
    /^[\p{L}\p{N}.][\p{L}\p{N} .+#_-]*$/u,
    "Skills can only contain letters, numbers, spaces and . + # _ -"
  )
  .refine((s) => !/(.)\1{3,}/.test(s), "That doesn't look like a real skill");

const skillsSchema = z.object({
  skills: z.array(skillName).max(20, "Maximum 20 skills"),
});

// how skills are read: sorted by name, flattened to plain strings
const skillSelect = {
  select: { skill: { select: { name: true } } },
  orderBy: { skill: { name: "asc" } },
};
const names = (rows) => rows.map((r) => r.skill.name);

const text = (max) => z.string().trim().max(max).transform((v) => v || null).optional();
// http/https only, so a stored "javascript:" link can never become a clickable XSS link
const link = z.url({ protocol: /^https?$/ }).or(z.literal("")).transform((v) => v || null).optional();

const profileSchema = z.object({
  name: text(60),
  bio: text(300),
  location: text(60),
  githubUrl: link,
  portfolioUrl: link,
});

// GET /users/search?q=...&limit=...&cursor=...
export async function searchUsers(req, res) {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = Number(req.query.cursor) || null;

  const users = await prisma.user.findMany({
    where: q
      ? { OR: [
          { username: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ] }
      : {},
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { id: "desc" },
    select: {
      ...publicSelect,
      _count: { select: { followers: true } },
      skills: { ...skillSelect, take: 5 },
      followers: req.userId
        ? { where: { followerId: req.userId }, select: { followerId: true } }
        : false,
    },
  });

  const hasMore = users.length > limit;
  const items = (hasMore ? users.slice(0, limit) : users).map(
    ({ followers = [], skills = [], ...u }) => ({
      ...u,
      skills: names(skills),
      isFollowing: followers.length > 0,
    })
  );
  res.json({ users: items, nextCursor: hasMore ? items[items.length - 1].id : null });
}


// GET /users/:username
export async function getProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: {
      ...publicSelect,
      _count: { select: { posts: true, followers: true, following: true } },
      skills: skillSelect,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  let isFollowing = false;
  if (req.userId) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.userId, followingId: user.id } },
    });
    isFollowing = Boolean(follow);
  }
  res.json({ user: { ...user, skills: names(user.skills) }, isFollowing });
}

export async function getUserPosts(req, res) {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: { id: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = Number(req.query.cursor) || null;
  const posts = await prisma.post.findMany({
  where: { authorId: user.id },
  take: limit + 1,
  ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  orderBy: { id: "desc" },
  include: includeFor(req.userId),
});

const hasMore = posts.length > limit;
const items = (hasMore ? posts.slice(0, limit) : posts).map(shape);
res.json({ posts: items, nextCursor: hasMore ? items[items.length - 1].id : null });
}

export async function updateMe(req, res) {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.issues.map((i) => i.message) });
  }
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: parsed.data,
    select: publicSelect,
  });
  res.json({ user });
}

async function findTarget(req, res) {
  const target = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: { id: true },
  });
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return null;
  }
  if (target.id === req.userId) {
    res.status(400).json({ error: "You cannot follow yourself" });
    return null;
  }
  return target;
}

export async function followUser(req, res) {
  const target = await findTarget(req, res);
  if (!target) return;

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: req.userId, followingId: target.id } },
    create: { followerId: req.userId, followingId: target.id },
    update: {},
  });
  const followers = await prisma.follow.count({ where: { followingId: target.id } });
  res.json({ following: true, followers });
}

export async function unfollowUser(req, res) {
  const target = await findTarget(req, res);
  if (!target) return;

  await prisma.follow.deleteMany({ where: { followerId: req.userId, followingId: target.id } });
  const followers = await prisma.follow.count({ where: { followingId: target.id } });
  res.json({ following: false, followers });
}

export async function setSkills(req, res) {
  const parsed = skillsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.issues.map((i) => i.message) });
  }

  await prisma.$transaction(async (tx) => {
    const ids = new Set();
    for (const name of parsed.data.skills) {
      let skill = await tx.skill.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });
      if (!skill) skill = await tx.skill.create({ data: { name } });
      ids.add(skill.id);
    }
    await tx.userSkill.deleteMany({ where: { userId: req.userId } });
    await tx.userSkill.createMany({
      data: [...ids].map((skillId) => ({ userId: req.userId, skillId })),
    });
  });

  const rows = await prisma.userSkill.findMany({ where: { userId: req.userId }, ...skillSelect });
  res.json({ skills: names(rows) });
}