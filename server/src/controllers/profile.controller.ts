import { Request, Response, NextFunction } from "express";
import { myProfileServices } from "../services/profile.service";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
export const myProfileController = {
    async getMyProfile(req: Request, res:Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            const data = await myProfileServices.getMyProfile(userId)

            res.status(200)
            .json(new ApiResponse(200,data))
        } catch(error) {
            next(error)
        }
    }
}