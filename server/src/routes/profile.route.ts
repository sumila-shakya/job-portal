import { Router } from "express";
import { myProfileController, companyProfileController, viewProfileController } from "../controllers/profile.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { authorizeRole } from "../middlewares/role.middleware";
import { checkActiveUser } from "../middlewares/active.middleware";

const router = Router()

//authenticate user
router.use(authMiddleware)
//check for active user
router.use(checkActiveUser)

/* ------------------------------- Job Seeker Profile Routes ------------------------------- */
//get job seeker own profile
router.get('/me',authorizeRole('job_seeker'),myProfileController.getMyProfile)

//update job seeker profile
router.patch('/me',authorizeRole('job_seeker'),upload.single('resume'),myProfileController.updateProfile)


/* ------------------------------- Company Profile Routes ------------------------------- */
//update company profile
router.patch('/company/me',authorizeRole('company'),companyProfileController.updateProfile)

//get company own profile
router.get('/company/me',authorizeRole('company'),companyProfileController.getProfile)


/* ------------------------------- Public Routes ------------------------------- */
//view job seeker public profile
router.get('/:userId',viewProfileController.viewJSProfile)

//view company public profile
router.get('/company/:userId',viewProfileController.viewCompanyProfile)

export default router