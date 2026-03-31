import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkActiveUser } from "../middlewares/active.middleware";
import { authorizeRole } from "../middlewares/role.middleware";
import { applicationController } from "../controllers/application.controller";

const router = Router()

router.use(authMiddleware)
router.use(checkActiveUser)

//withdraw application
router.patch('/:applicationId/withdraw',authorizeRole('job_seeker'),applicationController.withdrawJob)

//view all the applied job
router.get('/me',authorizeRole('job_seeker'),applicationController.viewAppliedJobs)

export default router