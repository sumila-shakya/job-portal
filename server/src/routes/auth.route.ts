import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkActiveUser } from "../middlewares/active.middleware";

const router = Router()

//registration route
router.post('/register', authController.register)

// verify email route
router.post('/verify-email', authController.verifyEmail)

//login route
router.post('/login', authController.login)

//logout route
router.post('/logout', authMiddleware, checkActiveUser, authController.logout)

//get account route
router.get('/account', authMiddleware, checkActiveUser, authController.getAccount)

//get new access token route
router.post('/refresh', authController.refreshToken)

//deactivate user account route
router.delete('/deactivate', authMiddleware, checkActiveUser, authController.deactivateUser)

// forget password route
router.post('/forget-password', authController.forgetPassword)

// reset password route
router.post('/reset-password', authController.resetPassword)

// re request verification email route
router.post('/resend-verification', authController.resendVerification)


export default router