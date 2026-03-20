import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/role.middleware";
import { jobController } from "../controllers/job.controller";
import { checkActiveUser } from "../middlewares/active.middleware";

const router = Router()

//authenticate the user
router.use(authMiddleware)
router.use(checkActiveUser)

/* ------------------------------- Company Profile Routes ------------------------------- */
//post new job
router.post('/',authorizeRole('company'),jobController.postJob)
//get all the listed jobs
router.get('/myJobs',authorizeRole('company'),jobController.getMyJobs)
//get the job details
router.get('/:jobId',authorizeRole('company'),jobController.getJobDetails)

export default router