import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers and underscores only"),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const signToken = (user) =>
  jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// never send the password hash back to the client
const publicUser = ({ password, ...rest }) => rest;

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.issues.map((i) => i.message) });
  }
  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return res.status(409).json({ error: "Email or username already in use" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
  });

  res.status(201).json({ user: publicUser(user), token: signToken(user) });
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.issues.map((i) => i.message) });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  res.json({ user: publicUser(user), token: signToken(user) });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
}