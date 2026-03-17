import { JobSeekersProfile, CompanyProfile } from "../models/mongodb.models";
import { users } from "../models/mysql.models";
import { db } from "../config/mysql.config";
import { eq } from "drizzle-orm";
import { ApiError } from "../utils/apiError";
import { JProfileUpdates } from "../@types/interface";
import { updateComProfileType } from "../utils/validator";

export const myProfileServices = {
    async getMyProfile(userId: number) {
        const [user] = await db
        .select({
            userId: users.userId,
            name: users.name,
            role: users.role
        })
        .from(users)
        .where(eq(users.userId,userId))

        if(!user) {
            throw new ApiError(404,"Not found")
        }

        const profile = await JobSeekersProfile.findOne(
            {jobSeekerId: userId},
            {_id:0, isHidden:0, jobSeekerId: 0, __v:0}
        )

        return {
            ...user,
            profile: profile ?? {}
        }
    },

    async updateProfile(updates: JProfileUpdates, userId: number) {
        const updatedProfile = await JobSeekersProfile
        .findOneAndUpdate(
            {jobSeekerId: userId},
            {$set: updates},
            {new: true}
        ).select({_id:0, isHidden:0, jobSeekerId: 0, __v:0})

        if(!updatedProfile) {
            throw new ApiError(404,"User Not Found")
        }

        return updatedProfile
    }
}

export const companyProfileServices = {
    async updateProfile(updates: updateComProfileType, userId: number) {
        const updatedProfile = await CompanyProfile
        .findOneAndUpdate(
            {companyId: userId},
            {$set: updates},
            {new: true}
        ).select({_id:0, isHidden:0, companyId: 0, __v:0})

        if(!updatedProfile) {
            throw new ApiError(404,"User Not Found")
        }

        return updatedProfile
    },

    async getProfile(userId: number) {
        const [user] = await db
        .select({
            userId: users.userId,
            name: users.name,
            role: users.role
        })
        .from(users)
        .where(eq(users.userId,userId))

        if(!user) {
            throw new ApiError(404,"Not found")
        }

        const profile = await CompanyProfile.findOne(
            {companyId: userId},
            {_id:0, isHidden:0, jobSeekerId: 0, __v:0}
        )

        return {
            ...user,
            profile: profile ?? {}
        }
        
    }
}

export const viewProfileServices = {
    async viewJSProfile(jobSeekerId: number) {
        const [user] = await db
        .select({
            userId: users.userId,
            name: users.name,
            role: users.role
        })
        .from(users)
        .where(eq(users.userId,jobSeekerId))

        if(!user || user.role != 'job_seeker') {
            throw new ApiError(404,"Not found")
        }

        const profile = await JobSeekersProfile.findOne(
            {jobSeekerId: jobSeekerId},
            {_id:0, isHidden:0, jobSeekerId: 0, __v:0, createdAt:0, updatedAt:0}
        )

        return {
            ...user,
            profile: profile ?? {}
        }
    },

    async viewCompanyProfile(companyId: number) {
        const [user] = await db
        .select({
            userId: users.userId,
            name: users.name,
            role: users.role
        })
        .from(users)
        .where(eq(users.userId,companyId))

        if(!user || user.role != 'company') {
            throw new ApiError(404,"Not found")
        }

        const profile = await CompanyProfile.findOne(
            {companyId: companyId},
            {_id:0, isHidden:0, companyId: 0, __v:0, createdAt:0, updatedAt:0}
        )

        return {
            ...user,
            profile: profile ?? {}
        }
    }
}