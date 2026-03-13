import { Request, Response, NextFunction } from "express";
import { registrationSchema,registrationType } from "../utils/validator";
import { authService } from "../services/auth.service";
import { ApiResponse } from "../utils/apiResponse";

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
                maxAge: 7*24*60*60*1000
            }

            res
            .status(201)
            .cookie('refreshToken',newUser.refreshToken,options)
            .json(new ApiResponse(201,"User registered successfully",data))

        } catch(error) {
            next(error)
        }
    },

    
}