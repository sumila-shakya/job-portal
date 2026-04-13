import { JobSeekersProfile, CompanyProfile } from "../models/mongodb.models";
import { users } from "../models/mysql.models";
import { db } from "../config/mysql.config";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../utils/apiError";
import { JProfileUpdates } from "../@types/interface";
import { updateComProfileType } from "../utils/validator";

export const myProfileServices = {
    //job seeker service function to get their profile
    async getMyProfile(userId: number) {
        //check for the user
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

        //get the profile data
        const profile = await JobSeekersProfile.findOne(
            {jobSeekerId: userId},
            {_id:0, isHidden:0, jobSeekerId: 0, __v:0}
        )
        .lean()

        return {
            ...user,
            profile: profile ?? {}
        }
    },

    //job seeker service function to update profile
    async updateProfile(updates: JProfileUpdates, userId: number) {
        //update the profile
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
    //company service function to update the company profile
    async updateProfile(updates: updateComProfileType, userId: number) {
        //update the company profile
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

    //company service function to get the company profile
    async getProfile(userId: number) {
        //get the company account data
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

        //get the company profile
        const profile = await CompanyProfile.findOne(
            {companyId: userId},
            {_id:0, isHidden:0, jobSeekerId: 0, __v:0}
        )
        .lean()

        return {
            ...user,
            profile: profile ?? {}
        }
        
    }
}

export const viewProfileServices = {
    //public function to view the job seeker profile
    async viewJSProfile(jobSeekerId: number) {
        const [[user],profile] = await Promise.all([
            //get the mysql data
            db
            .select({
                userId: users.userId,
                name: users.name,
                role: users.role
            })
            .from(users)
            .where(and(
                eq(users.userId,jobSeekerId),
                eq(users.isActive,true)
            )),

            //get the mongodb data
            JobSeekersProfile.findOne(
                {
                    jobSeekerId: jobSeekerId,
                    isHidden: false
                },
                {_id:0, isHidden:0, jobSeekerId: 0, __v:0, createdAt:0, updatedAt:0}
            )
            .lean()

        ])

        if(!user || user.role != 'job_seeker') {
            throw new ApiError(404,"Not found")
        }

        return {
            ...user,
            profile: profile ?? {}
        }
    },

    //public function to get the company profile
    async viewCompanyProfile(companyId: number) {
        const [[user],profile] = await Promise.all([
            //get the mysql data
            db
            .select({
                userId: users.userId,
                name: users.name,
                role: users.role
            })
            .from(users)
            .where(and(
                eq(users.userId,companyId),
                eq(users.isActive,true)
            )),

            //get the mongodb data
            CompanyProfile.findOne(
                {
                    companyId: companyId,
                    isHidden: false
                },
                {_id:0, isHidden:0, companyId: 0, __v:0, createdAt:0, updatedAt:0}
            )
            .lean()
        ])

        if(!user || user.role != 'company') {
            throw new ApiError(404,"Not found")
        }

        return {
            ...user,
            profile: profile ?? {}
        }
    }
}