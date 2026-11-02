import { Router } from "express";
import { createPost, getFeed, getPost, updatePost, deletePost } from "../controllers/posts.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { likePost, unlikePost, getComments, createComment } from "../controllers/interactions.controller.js";


const router = Router();
router.get("/", getFeed);
router.get("/:id", getPost);
router.post("/", requireAuth, createPost);
router.patch("/:id", requireAuth, updatePost);
router.delete("/:id", requireAuth, deletePost);

router.put("/:id/like", requireAuth, likePost);
router.delete("/:id/like", requireAuth, unlikePost);
router.get("/:id/comments", getComments);
router.post("/:id/comments", requireAuth, createComment);

export default router;
