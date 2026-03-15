import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router()

//registration route
router.post('/register',authController.register)

//login route
router.post('/login',authController.login)

//logout route
router.post('/logout',authMiddleware,authController.logout)

export default router