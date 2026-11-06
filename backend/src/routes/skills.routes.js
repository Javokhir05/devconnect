import { Router } from "express";
import { searchSkills } from "../controllers/skills.controller.js";
import { popularSkills } from "../controllers/skills.controller.js";


const router = Router();
router.get("/", searchSkills);
router.get("/popular", popularSkills);

export default router;