import { db } from "../config/mysql.config";
import { users, refreshTokens, jobs, User, Token, NewUser, NewToken, jobApplications, Job } from "../models/mysql.models";
import { registrationType, loginType } from "../utils/validator";
import { and, eq, notInArray, lt, inArray } from "drizzle-orm";
import { ApiError } from "../utils/apiError";
import bcrypt from 'bcrypt'
import { CompanyProfile, JobDetail, JobSeekersProfile } from "../models/mongodb.models";
import { jwtUtils } from "../utils/jwt";
import { Payload } from "../@types/interface";
import { ROLE } from "../utils/constants";

export const authService = {
    //registration service
    async register(data: registrationType) {
        //check if there is any existing user
        const existingUser: User[] = await db
        .select()
        .from(users)
        .where(eq(users.email,data.email))

        //check for existing user
        if(existingUser.length > 0) {
            throw new ApiError(409,"User already exists")
        }

        //hash password
        const hashedpassword:string = await bcrypt.hash(data.password,10)

        const user: NewUser = {
            name: data.name,
            email: data.email,
            role: data.role,
            password: hashedpassword
        }

        //insert the new user
        const [newUser] = await db
        .insert(users)
        .values(user)
        
        //create skeleton user profile
        const profileCreator = {
            job_seeker: (userId: number) => JobSeekersProfile.create({jobSeekerId: userId}),
            company: (userId: number) => CompanyProfile.create({companyId: userId}),
            admin: (userId: number) => Promise.resolve(null)
        }
        try {
            await profileCreator[data.role](newUser.insertId)
        } catch(error) {
            //delete the mysql data if the mongodb insertion fails
            await db.delete(users).where(eq(users.userId,newUser.insertId))
            throw new ApiError(500,"Failed to register")
        }

        //generate access and refesh token
        const payload: Payload = {
            userId: newUser.insertId,
            role: data.role
        }

        const accessToken: string = jwtUtils.generateAccessToken(payload)
        const refreshToken: string = jwtUtils.generateRefreshToken(payload)
        const expiryDate = jwtUtils.getExpiryDate()

        //insert refresh token into the database
        const token: NewToken = {
            userId: newUser.insertId,
            refreshToken: refreshToken,
            expiresAt: expiryDate
        }

        await db
        .insert(refreshTokens)
        .values(token) 

        return {
            userId: newUser.insertId,
            name: data.name,
            email: data.email,
            role: data.role,
            accessToken: accessToken,
            refreshToken: refreshToken
        }
    },

    async login(data: loginType) {
        const [existingUser]: User[] = await db
        .select()
        .from(users)
        .where(eq(users.email,data.email))

        //check for existing user
        if(!existingUser) {
            throw new ApiError(401,"Invalid credentials")
        }

        //password checkup
        const isValidPassword:boolean = await bcrypt.compare(data.password,existingUser.password)
        if(!isValidPassword) {
            throw new ApiError(401,"Invalid credentials")
        }

        //calculate the grace period
        const GRACE_PERIOD_DAYS = 30
        const gracePeriodCutOff = new Date()
        gracePeriodCutOff.setDate(gracePeriodCutOff.getDate() - GRACE_PERIOD_DAYS)

        //check if the user is deactivated
        if(existingUser.isActive === false) {
            //check if the deactivated time is over the grace period
            if(!existingUser.deactivatedAt || existingUser.deactivatedAt <= gracePeriodCutOff) {
                throw new ApiError(403,"Account no longer exists")
            }

            //reactivate the user account if within 30 days
            await db
            .update(users)
            .set({
                isActive: true,
                deactivatedAt: null
            })
            .where(eq(users.userId, existingUser.userId))

            //change the profile to not hidden
            if(existingUser.role === 'job_seeker') {
                await JobSeekersProfile
                .updateOne(
                    {jobSeekerId: existingUser.userId}, 
                    {$set: {isHidden: false}}
                )
            } else if(existingUser.role === 'company') {
                await CompanyProfile
                .updateOne(
                    {companyId: existingUser.userId}, 
                    {$set: {isHidden: false}}
                )
            }
        }

        const payload: Payload = {
            userId: existingUser.userId,
            role: existingUser.role
        }

        const accessToken: string = jwtUtils.generateAccessToken(payload)
        const refreshToken: string = jwtUtils.generateRefreshToken(payload)
        const expiryDate = jwtUtils.getExpiryDate()

        //deleting existing token
        await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId,existingUser.userId))

        //insert refresh token into the database
        const token: NewToken = {
            userId: existingUser.userId,
            refreshToken: refreshToken,
            expiresAt: expiryDate
        }
        await db
        .insert(refreshTokens)
        .values(token) 

        return {
            userId: existingUser.userId,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            accessToken: accessToken,
            refreshToken: refreshToken,
            ...(!existingUser.isActive && {reactivated: true})      //send response if reactivated
        }
    },

    //logout service function
    async logout(userId: number) {
        //delete the refresh token
        await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId,userId))
    },

    //get the account service function
    async getAccount(userId: number) {
        const [user]: User[] = await db
        .select()
        .from(users)
        .where(eq(users.userId,userId))

        //check for the user
        if(!user) {
            throw new ApiError(404,"Not found")
        }

        //return the data without the password
        const {password:_,deactivatedAt:__, ...data} = user
        return data
    },

    //get new access token service function
    async refreshToken(token:string, user: Payload) {
        //check if the refresh token exists and is owned by the user
        const [tokenRecord]: Token[] = await db
        .select()
        .from(refreshTokens)
        .where(and(
            eq(refreshTokens.userId, user.userId),
            eq(refreshTokens.refreshToken,token)
        ))

        if(!tokenRecord) {
            throw new ApiError(401,"Access Denied")
        }

        //check if the token is expired
        if(tokenRecord.expiresAt < new Date()) {
            //delete the expired token
            await db
            .delete(refreshTokens)
            .where(eq(refreshTokens.userId,user.userId))

            throw new ApiError(401,"Expired refresh token. Please log in again")
        }

        //refresh token rotation
        const accessToken: string = jwtUtils.generateAccessToken(user)
        const refreshToken: string = jwtUtils.generateRefreshToken(user)
        const expiryDate = jwtUtils.getExpiryDate()

        //deleting existing token
        await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId,user.userId))

        //insert refresh token into the database
        const newToken: NewToken = {
            userId: user.userId,
            refreshToken: refreshToken,
            expiresAt: expiryDate
        }
        await db
        .insert(refreshTokens)
        .values(newToken) 
        
        return {accessToken, refreshToken}
    },

    //deactivate user account service function
    async deactivateUser(userId: number, role: typeof ROLE[number]) {
        if(role === 'job_seeker') {
            await Promise.all([
                //soft delete the job seeker account
                db
                .update(users)
                .set({
                    isActive: false, 
                    deactivatedAt: new Date()
                })
                .where(eq(users.userId, userId)),

                //hide the job seeker profile
                JobSeekersProfile
                .updateOne(
                    {jobSeekerId: userId}, 
                    {$set: {isHidden: true}}
                ),

                //withdraw from all the jobs applied by the user
                db
                .update(jobApplications)
                .set({
                    applicationStatus: 'withdrawn'
                })
                .where(and(
                    eq(jobApplications.applicantId, userId),
                    notInArray(jobApplications.applicationStatus,['accepted','rejected','cancelled','withdrawn'])
                ))
            ])
        } else if(role === 'company') {
            const [_,__,jobarr] = await Promise.all([
                //soft delete the company account
                db
                .update(users)
                .set({
                    isActive: false, 
                    deactivatedAt: new Date()
                })
                .where(eq(users.userId, userId)),

                //hide the company profile
                CompanyProfile
                .updateOne(
                    {companyId: userId}, 
                    {$set: {isHidden: true}}
                ),

                //get all the jobs posted by the company that is not deleted
                db.select()
                .from(jobs)
                .where(and(
                    eq(jobs.postedBy, userId),
                    eq(jobs.isDeleted, false)
                ))
            ])

            //get the job ids
            const jobIdArr = jobarr.map(job => job.jobId)

            await Promise.all([
                //soft delete all the jobs posted by the company
                db.update(jobs)
                .set({
                    isClosed: true,
                    isDeleted: true,
                    deletedAt: new Date()
                })
                .where(inArray(jobs.jobId, jobIdArr)),

                //change all the applications to cancelled
                db.update(jobApplications)
                .set({
                    applicationStatus: 'cancelled'
                })
                .where(inArray(jobApplications.jobId, jobIdArr))
            ])
        }

        //force logout
        //delete the refresh token
        await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId,userId))
    }
}

export const cronUserServices = {
    //cron job to delete the deactivated users after 30 days of grace period
    async deleteUsers() {
        try {
            //calculate the grace time
            const GRACE_PERIOD_DAYS = 30
            const gracePeriodCutOff = new Date()
            gracePeriodCutOff.setDate(gracePeriodCutOff.getDate() - GRACE_PERIOD_DAYS)

            //get all deactivated users
            const deactivatedUsers: User[] = await db
            .select()
            .from(users)
            .where(and(
                eq(users.isActive, false),
                lt(users.deactivatedAt, gracePeriodCutOff)
            ))
            
            if(deactivatedUsers.length === 0) 
                return

            //get the job seekers ids
            const jobSeekerIds: number[] = deactivatedUsers.filter(user => user.role === 'job_seeker').map(user => user.userId)
            //get the company ids
            const companyIds: number[] = deactivatedUsers.filter(user => user.role === 'company').map(user => user.userId)

            if(companyIds.length > 0) {
                //delete thejobs posted by the company
                const toDelJobs: Job[] = await db
                .select()
                .from(jobs)
                .where(inArray(jobs.postedBy, companyIds))

                const jobIds: number[] = toDelJobs.map(job => job.jobId)
                await JobDetail.deleteMany({jobId: {$in: jobIds}})
            }

            //delete the user profile
            await Promise.all([
                JobSeekersProfile.deleteMany({
                    jobSeekerId: {$in: jobSeekerIds}
                }),

                CompanyProfile.deleteMany({
                    companyId: {$in: companyIds}
                })
            ])

            //permanently delete the users
            await db.delete(users)
            .where(inArray(users.userId, [...jobSeekerIds, ...companyIds]))

            console.log("Users deactivated permanently")
        } catch(error) {
            console.error("Failed to deactivate user permanently ", error)
        }
    }
}