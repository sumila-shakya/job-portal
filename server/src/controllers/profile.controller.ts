import { Request, Response, NextFunction } from "express";
import { myProfileServices, companyProfileServices, viewProfileServices } from "../services/profile.service";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { JProfileUpdates } from "../@types/interface";
import { updateJSProfileSchema, updateJSProfileType, updateComProfileSchema, updateComProfileType } from "../utils/validator";
import fs from 'fs'

export const myProfileController = {
    //job seeker function to get their profile
    async getMyProfile(req: Request, res:Response, next: NextFunction) {
        try {
            //get the user id
            const userId = req.user?.userId;

            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            //profile service function
            const data = await myProfileServices.getMyProfile(userId)

            res
            .status(200)
            .json(new ApiResponse(200,data))
        } catch(error) {
            next(error)
        }
    },

    //job seeker function to update their profile
    async updateProfile(req: Request, res:Response, next: NextFunction) {
        try {
            //get the user id
            const userId = req.user?.userId;

            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            //get the update data from the request body
            const body = {...req.body}

            //parse the request body
            if(typeof body.education === 'string') body.education = JSON.parse(body.education)
            if(typeof body.skills === 'string') body.skills = JSON.parse(body.skills)
            if(typeof body.address === 'string') body.address = JSON.parse(body.address)
            
            //validate the user data
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

            //profile service function
            const updatedProfile = await myProfileServices.updateProfile(updates, userId)

            //updated user profile
            const data = {
                userId,
                profile: updatedProfile
            }

            res
            .status(200)
            .json(new ApiResponse(200,data,"Profile updated successfully"))

        } catch(error) {
            //delete the local resume file for unsuccessful upload to cloudinary
            if(req.file) fs.unlinkSync(req.file?.path)
            next(error)
        }
    }
}

export const companyProfileController = {
    //company function to update the profile
    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            //get the user id
            const userId = req.user?.userId;

            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            //validate the user data
            const updates: updateComProfileType = updateComProfileSchema.parse(req.body)

            if(Object.keys(updates).length === 0) {
                throw new ApiError(400, "No data provided for updates")
            }

            //profile service function
            const updatedProfile = await companyProfileServices.updateProfile(updates, userId)

            //update company profile
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

    //company function to get their profile
    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            //get the user id
            const userId = req.user?.userId;

            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            //profile service function
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
    //public function to view the job seeker profile
    async viewJSProfile(req: Request, res: Response, next: NextFunction) {
        try {
            //get the user id
            const userId = req.user?.userId;

            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            //get the job seeker id from the path parameters
            const jobSeekerId: number = parseInt(req.params.userId as string)

            //check if the job seeker id is a number
            if(Number.isNaN(jobSeekerId)) {
                throw new ApiError(400,"The valid user id must be provided")
            }

            //profile service function
            const data = await viewProfileServices.viewJSProfile(jobSeekerId)

            res
            .status(200)
            .json(new ApiResponse(200,data))
        } catch(error) {
            next(error)
        }
    },

    //public function to view the company profile
    async viewCompanyProfile(req: Request, res: Response, next: NextFunction) {
        try {
            //get the user id
            const userId = req.user?.userId;

            if(!userId) {
                throw new ApiError(401,"Access Denied")
            }

            //get the company id from the path parameter
            const companyId: number = parseInt(req.params.userId as string)

            //check if the company id is a number
            if(Number.isNaN(companyId)) {
                throw new ApiError(400,"The valid company id must be provided")
            }

            //profile service function
            const data = await viewProfileServices.viewCompanyProfile(companyId)

            res
            .status(200)
            .json(new ApiResponse(200,data))
        } catch(error) {
            next(error)
        }
    }
}