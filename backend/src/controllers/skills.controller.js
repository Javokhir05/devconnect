import { prisma } from "../lib/prisma.js";

// suggestions for the skills input, most-used skills first
export async function searchSkills(req, res) {
  const q = String(req.query.q || "").trim().slice(0, 30);
  if (!q) return res.json({ skills: [] });

  const skills = await prisma.skill.findMany({
    where: { name: { startsWith: q, mode: "insensitive" } },
    orderBy: { users: { _count: "desc" } },
    take: 8,
    select: { name: true },
  });
  res.json({ skills: skills.map((s) => s.name) });
}

export async function popularSkills(req, res) {
  const skills = await prisma.skill.findMany({
    where: { users: { some: {} } },
    orderBy: { users: { _count: "desc" } },
    take: 10,
    select: { name: true },
  });
  res.json({ skills: skills.map((s) => s.name) });
}