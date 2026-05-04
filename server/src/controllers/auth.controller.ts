import { Request, Response, NextFunction } from "express";
import { registrationSchema, registrationType, loginSchema, loginType, emailVerificationSchema, emailVerificationType, 
    forgetPasswordSchema, forgetPasswordType, resetPasswordSchema, resetPasswordType, requestVerificationSchema, requestVerificationType } from "../utils/validator";
import { authService } from "../services/auth.service";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { jwtUtils } from "../utils/jwt";
import { COOKIES_OPTIONS } from "../utils/constants";

export const authController = {
    //registration function
    async register(req: Request, res: Response, next:NextFunction) {
        try {
            //validate user data
            const validatedData: registrationType = registrationSchema.parse(req.body)

            //insert into database
            const newUser = await authService.register(validatedData)

            res
            .status(201)
            .json(new ApiResponse(201, newUser, "User registered successfully, Check email to verify"))

        } catch(error) {
            next(error)
        }
    },

    // verify email function
    async verifyEmail(req: Request, res: Response, next: NextFunction) {
        try {
            //validate the token
            const validatedData: emailVerificationType = emailVerificationSchema.parse(req.query)

            // verify the email
            await authService.verifyEmail(validatedData)

            // send 200 success message
            res
            .status(200)
            .json(new ApiResponse(200, {}, "Email verified successfully. Please, login to continue"))

        } catch(error) {
            next(error)
        }
    },

    //login function
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            //validate data
            const validatedData: loginType = loginSchema.parse(req.body)

            //get login data
            const user = await authService.login(validatedData)

            const {refreshToken,...data} = user

            res
            .status(200)
            .cookie('refreshToken',user.refreshToken,COOKIES_OPTIONS)
            .json(new ApiResponse(200, data ,"User logged in successfully"))
        } catch(error) {
            next(error)
        }
    },

    //logout function
    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            //get user id
            const userId = req.user?.userId

            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            //auth service function
            await authService.logout(userId)

            //cookie option
            const options = {
                httpOnly: true,
                sameSite: "strict" as const
            }

            res
            .status(200)
            .clearCookie('refreshToken',options)
            .json(new ApiResponse(200,{},"User logged out successfully"))
        } catch(error) {
            next(error)
        }
    },

    //get user account function
    async getAccount(req: Request, res: Response, next: NextFunction) {
        try {
            //get user id
            const userId = req.user?.userId

            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            //auth service function
            const data = await authService.getAccount(userId)

            res
            .status(200)
            .json(new ApiResponse(200,data))
        } catch(error) {
            next(error)
        }
    },

    //get new access token function
    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            //get refresh token from the cookie
            const token = req.cookies?.refreshToken

            if(!token) {
                throw new ApiError(401,"Refresh token is required")
            }

            //verify refresh token
            const {userId, role} = jwtUtils.verifyRefreshToken(token)

            //get new access and refresh token
            const {accessToken, refreshToken} = await authService.refreshToken(token, {userId,role})

            res
            .status(200)
            .cookie('refreshToken',refreshToken, COOKIES_OPTIONS)
            .json(new ApiResponse(200,{accessToken}))
        } catch(error) {
            next(error)
        }
    },

    //deactivate user function
    async deactivateUser(req: Request, res: Response, next: NextFunction) {
        try {
            //get user credentials
            const userId = req.user?.userId
            const role = req.user?.role

            if(!userId || !role) {
                throw new ApiError(401,"Access Denied")
            }

            //auth service function
            await authService.deactivateUser(userId, role)
            
            //cookie options
            const options = {
                httpOnly: true,
                sameSite: "strict" as const
            }

            res
            .status(200)
            .clearCookie('refreshToken',options)
            .json(new ApiResponse(200, {}, "User deactivated successfully"))
        } catch(error) {
            next(error)
        }
    },

    // forget password function
    async forgetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            // validate the user data
            const userInfo: forgetPasswordType = forgetPasswordSchema.parse(req.body)

            // db query for the user data send by the user
            await authService.forgetPassword(userInfo)

            // send 200 success message despite any error
            res.status(200)
            .json(new ApiResponse(200, {}, "Token has been send to your email. Please, check your email"))
        } catch(error) {
            next(error)
        }
    },

    // reset password function
    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            // get the token from the query field
            const { token } = req.query

            // validate the user data
            const validatedData: resetPasswordType = resetPasswordSchema.parse({token, ...req.body})

            // get the new access token and refresh token after reseting password
            const {refreshToken, accessToken} = await authService.resetPassword(validatedData)

            // send 200 message
            res.status(200)
            .cookie('refreshToken', refreshToken, COOKIES_OPTIONS)
            .json(new ApiResponse(200, {accessToken}, "Successfully password reset, You are logged in"))
        } catch(error) {
            next(error)
        }
    },

    // resend verification function
    async resendVerification(req: Request, res: Response, next: NextFunction) {
        try {
            // validate the user data
            const userInfo: requestVerificationType = requestVerificationSchema.parse(req.body)

            // db query for the user data send by the user
            await authService.resendVerification(userInfo)

            // send 200 success message despite any error
            res.status(200)
            .json(new ApiResponse(200, {}, "Token has been send to your email. Please, check your email"))
        } catch(error) {
            next(error)
        }
    },
}