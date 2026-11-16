import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  startConversation, listConversations, getMessages, markRead,
} from "../controllers/chat.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", listConversations);
router.post("/", startConversation);
router.get("/:id/messages", getMessages);
router.post("/:id/read", markRead);

export default router;