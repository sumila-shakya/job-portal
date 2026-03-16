import { Router } from "express";
import { myProfileController } from "../controllers/profile.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router()

//get job seeker own profile
router.get('/me',authMiddleware,myProfileController.getMyProfile)

export default router