import { Request, Response, NextFunction } from "express";
import { myProfileServices, companyProfileServices, viewProfileServices } from "../services/profile.service";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { JProfileUpdates } from "../@types/interface";
import { updateJSProfileSchema, updateJSProfileType, updateComProfileSchema, updateComProfileType } from "../utils/validator";
import fs from 'fs'

export const myProfileController = {
    async getMyProfile(req: Request, res:Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            const data = await myProfileServices.getMyProfile(userId)

            res
            .status(200)
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
            const body = {...req.body}
            if(typeof body.education === 'string') body.education = JSON.parse(body.education)
            if(typeof body.skills === 'string') body.skills = JSON.parse(body.skills)
            if(typeof body.address === 'string') body.address = JSON.parse(body.address)
            

            const validatedData: updateJSProfileType = updateJSProfileSchema.parse(body)
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
            if(req.file) fs.unlinkSync(req.file?.path)
            next(error)
        }
    }
}

export const companyProfileController = {
    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            const updates: updateComProfileType = updateComProfileSchema.parse(req.body)
            if(Object.keys(updates).length === 0) {
                throw new ApiError(400, "No data provided for updates")
            }

            const updatedProfile = await companyProfileServices.updateProfile(updates, userId)
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
    },

    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }
            const data = await companyProfileServices.getProfile(userId)

            res
            .status(200)
            .json(new ApiResponse(200,data))
        } catch(error) {
            next(error)
        }
    }
}

export const viewProfileController = {
    async viewJSProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            const jobSeekerId: number = parseInt(req.params.userId as string)
            if(!jobSeekerId) {
                throw new ApiError(400,"The user id must be provided")
            }

            const data = await viewProfileServices.viewJSProfile(jobSeekerId)

            res
            .status(200)
            .json(new ApiResponse(200,data))
        } catch(error) {
            next(error)
        }
    },

    async viewCompanyProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            const companyId: number = parseInt(req.params.userId as string)
            if(!companyId) {
                throw new ApiError(400,"The user id must be provided")
            }

            const data = await viewProfileServices.viewCompanyProfile(companyId)

            res
            .status(200)
            .json(new ApiResponse(200,data))
        } catch(error) {
            next(error)
        }
    }
}