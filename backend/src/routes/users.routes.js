import { Router } from "express";
import {
  searchUsers, getProfile, getUserPosts, updateMe, followUser, unfollowUser,
} from "../controllers/users.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();
router.get("/", searchUsers);
router.patch("/me", requireAuth, updateMe);
router.get("/:username", optionalAuth, getProfile);
router.get("/:username/posts", optionalAuth, getUserPosts);
router.put("/:username/follow", requireAuth, followUser);
router.delete("/:username/follow", requireAuth, unfollowUser);

export default router;