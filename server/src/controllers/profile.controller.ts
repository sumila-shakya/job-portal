import { Request, Response, NextFunction } from "express";
import { myProfileServices } from "../services/profile.service";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { JProfileUpdates } from "../@types/interface";
import { updateJSProfileSchema, updateJSProfileType } from "../utils/validator";

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
    },

    async updateProfile(req: Request, res:Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            const validatedData: updateJSProfileType = updateJSProfileSchema.parse(req.body)
            const updates: JProfileUpdates = {...validatedData}

            if(req.file) {
                //file uploaded to /uploads by multer
                //upload the file to cloudinary
                const uploadResult = await uploadOnCloudinary(req.file.path)
                if(!uploadResult) {
                    throw new ApiError(500,"File upload failed")
                }
                updates.resumeUrl = uploadResult.secure_url
            }

            if(Object.keys(updates).length === 0) {
                throw new ApiError(400, "No data provided for updates")
            }

            const updatedProfile = await myProfileServices.updateProfile(updates, userId)
            const data = {
                userId,
                profile: updatedProfile
            }

            res
            .status(200)
            .json(new ApiResponse(200,data,"Profile updated successfully"))

        } catch(error) {
            next(error)
        }
    }
}