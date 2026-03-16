import { Router } from "express";
import { myProfileController } from "../controllers/profile.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { authorizeRole } from "../middlewares/role.middleware";

const router = Router()

//authenticate user
router.use(authMiddleware)

//get job seeker own profile
router.get('/me',authorizeRole('job_seeker'),myProfileController.getMyProfile)

//update job seeker profile
router.patch('/me',authorizeRole('job_seeker'),upload.single('resume'),myProfileController.updateProfile)

export default router