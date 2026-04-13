import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkActiveUser } from "../middlewares/active.middleware";

const router = Router()

//registration route
router.post('/register', authController.register)

//login route
router.post('/login', authController.login)

//logout route
router.post('/logout', authMiddleware, checkActiveUser, authController.logout)

//get account route
router.get('/account', authMiddleware, checkActiveUser, authController.getAccount)

//get new access token route
router.post('/refresh', authController.refreshToken)

//deactivate user account
router.delete('/deactivate', authMiddleware, checkActiveUser, authController.deactivateUser)

export default router