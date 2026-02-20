// Backend/src/routes/team.routes.js

import express from "express";
import { upload } from "../controllers/team.controller.js";
import { createTeam, joinTeam, getTeams, leaveTeam, requestJoinTeam, handleJoinRequest, updateTeam, deleteTeam, addMemberDirect, removeMemberFromRoster, updateTeamLogo, getTeamByInviteCode } from "../controllers/team.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js"; // Tu middleware existente
import { createRateLimiter } from "../middlewares/rateLimit.js";

const router = express.Router();

const rlJoin = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, keyPrefix: 'team-join' });
const rlCreate = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'team-create' });
const rlManage = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'team-manage' });

router.post('/create', verifyToken, rlCreate, upload.single('logo'), createTeam);
router.post("/join", verifyToken, rlJoin, joinTeam);
router.post("/:teamId/roster", verifyToken, rlManage, addMemberDirect);
router.patch("/:teamId/roster/remove", verifyToken, rlManage, removeMemberFromRoster);
router.post("/:teamId/requests", verifyToken, rlJoin, requestJoinTeam);
router.patch("/:teamId/requests/:requestId", verifyToken, rlManage, handleJoinRequest);
router.get("/", getTeams);
router.get("/invite/:code", getTeamByInviteCode);
router.post("/leave/:teamId", verifyToken, rlManage, leaveTeam);
router.patch("/:teamId", verifyToken, rlManage, updateTeam);
router.patch("/:teamId/logo", verifyToken, rlManage, upload.single('logo'), updateTeamLogo);
router.delete("/:teamId", verifyToken, rlManage, deleteTeam);

export default router;
