import { JobSeekersProfile, CompanyProfile } from "../models/mongodb.models";
import { users } from "../models/mysql.models";
import { db } from "../config/mysql.config";
import { eq } from "drizzle-orm";
import { ApiError } from "../utils/apiError";

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

        const profile = user.role === 'job_seeker' ?
        await JobSeekersProfile.findOne(
            {jobSeekerId: userId},
            {_id:0, isHidden:0, jobSeekerId: 0, __v:0}
        )
        :
        await CompanyProfile.findOne(
            {companyId: userId},
            {_id:0, isHidden:0, jobSeekerId: 0, __v:0}
        )

        return {
            ...user,
            profile: profile ?? {}
        }
    },


}