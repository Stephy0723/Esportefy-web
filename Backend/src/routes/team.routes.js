// Backend/src/routes/team.routes.js

import express from "express";
import { upload } from "../controllers/team.controller.js";
import { createTeam, joinTeam, getTeams, leaveTeam, requestJoinTeam, handleJoinRequest, updateTeam, deleteTeam, addMemberDirect, removeMemberFromRoster, updateTeamLogo } from "../controllers/team.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js"; // Tu middleware existente

const router = express.Router();

router.post('/create', verifyToken, upload.single('logo'), createTeam);
router.post("/join", verifyToken, joinTeam);
router.post("/:teamId/roster", verifyToken, addMemberDirect);
router.patch("/:teamId/roster/remove", verifyToken, removeMemberFromRoster);
router.post("/:teamId/requests", verifyToken, requestJoinTeam);
router.patch("/:teamId/requests/:requestId", verifyToken, handleJoinRequest);
router.get("/", getTeams);
router.post("/leave/:teamId", verifyToken, leaveTeam);
router.patch("/:teamId", verifyToken, updateTeam);
router.patch("/:teamId/logo", verifyToken, upload.single('logo'), updateTeamLogo);
router.delete("/:teamId", verifyToken, deleteTeam);

export default router;
