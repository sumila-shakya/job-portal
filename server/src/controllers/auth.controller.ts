import { Request, Response, NextFunction } from "express";
import { registrationSchema, registrationType, loginSchema, loginType } from "../utils/validator";
import { authService } from "../services/auth.service";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

export const authController = {
    //registration function
    async register(req: Request, res: Response, next:NextFunction) {
        try {
            //validate user data
            const validatedData: registrationType = registrationSchema.parse(req.body)

            //insert into database
            const newUser = await authService.register(validatedData)

            const {refreshToken:_,...data} = newUser

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

            const {refreshToken:_,...data} = user

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

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId
            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            await authService.logout(userId)

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

    async getAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId
            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            const data = await authService.getAccount(userId)

            res
            .status(200)
            .json(new ApiResponse(200,data))
        } catch(error) {
            next(error)
        }
    }
}