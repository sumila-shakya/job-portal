import { Request, Response, NextFunction } from "express";
import { registrationSchema, registrationType, loginSchema, loginType } from "../utils/validator";
import { authService } from "../services/auth.service";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { jwtUtils } from "../utils/jwt";

export const authController = {
    //registration function
    async register(req: Request, res: Response, next:NextFunction) {
        try {
            //validate user data
            const validatedData: registrationType = registrationSchema.parse(req.body)

            //insert into database
            const newUser = await authService.register(validatedData)

            const {refreshToken,...data} = newUser

            //cookie options
            const options = {
                httpOnly: true,
                maxAge: 7*24*60*60*1000,
                sameSite: "strict" as const
            }

            res
            .status(201)
            .cookie('refreshToken',newUser.refreshToken,options)
            .json(new ApiResponse(201, data, "User registered successfully"))

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

            //cookie option
            const options = {
                httpOnly: true,
                maxAge: 7*24*60*60*1000,
                sameSite: "strict" as const
            }

            res
            .status(200)
            .cookie('refreshToken',user.refreshToken,options)
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

            //cookie option
            const options = {
                httpOnly: true,
                maxAge: 7*24*60*60*1000,
                sameSite: "strict" as const
            }

            res
            .status(200)
            .cookie('refreshToken',refreshToken,options)
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
    }
}