import { Router } from "express";
import {
  searchUsers, getProfile, getUserPosts, updateMe, followUser, unfollowUser, setSkills
} from "../controllers/users.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();
router.get("/",optionalAuth, searchUsers);
router.patch("/me", requireAuth, updateMe);
router.put("/me/skills", requireAuth, setSkills);
router.get("/:username", optionalAuth, getProfile);
router.get("/:username/posts", optionalAuth, getUserPosts);
router.put("/:username/follow", requireAuth, followUser);
router.delete("/:username/follow", requireAuth, unfollowUser);

export default router;