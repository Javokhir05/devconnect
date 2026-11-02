import { Router } from "express";
import { deleteComment } from "../controllers/interactions.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.delete("/:id", requireAuth, deleteComment);

export default router;