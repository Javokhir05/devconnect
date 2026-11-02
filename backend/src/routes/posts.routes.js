import { Router } from "express";
import { createPost, getFeed, getPost, updatePost, deletePost } from "../controllers/posts.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.get("/", getFeed);
router.get("/:id", getPost);
router.post("/", requireAuth, createPost);
router.patch("/:id", requireAuth, updatePost);
router.delete("/:id", requireAuth, deletePost);

export default router;
