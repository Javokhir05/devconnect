import { Router } from "express";
import { searchSkills } from "../controllers/skills.controller.js";

const router = Router();
router.get("/", searchSkills);

export default router;