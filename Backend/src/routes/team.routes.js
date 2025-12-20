// Backend/src/routes/team.routes.js

import express from "express";
import { createTeam, joinTeam,getTeams,leaveTeam } from "../controllers/team.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js"; // Tu middleware existente

const router = express.Router();

router.post("/create", verifyToken, createTeam);
router.post("/join", verifyToken, joinTeam);
router.get("/", getTeams);
router.post("/leave/:teamId", verifyToken, leaveTeam);

export default router;