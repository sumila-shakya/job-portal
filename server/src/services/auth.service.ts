import { db } from "../config/mysql.config";
import { users, refreshTokens } from "../models/mysql.models";
import { registrationType, loginType } from "../utils/validator";
import { and, eq } from "drizzle-orm";
import { ApiError } from "../utils/apiError";
import bcrypt from 'bcrypt'
import { CompanyProfile, JobSeekersProfile } from "../models/mongodb.models";
import { jwtUtils } from "../utils/jwt";
import { Payload } from "../@types/interface";

export const authService = {
    //registration service
    async register(data: registrationType) {
        const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email,data.email))

        //check for existing user
        if(existingUser.length > 0) {
            throw new ApiError(409,"User already exists")
        }

        //hash password
        const hashedpassword:string = await bcrypt.hash(data.password,10)

        //insert the new user
        const [newUser] = await db
        .insert(users)
        .values({
            name: data.name,
            email: data.email,
            role: data.role,
            password: hashedpassword
        })
        
        //create skeleton user profile
        const profileCreator = {
            job_seeker: (userId: number) => JobSeekersProfile.create({jobSeekerId: userId}),
            company: (userId: number) => CompanyProfile.create({companyId: userId}),
            admin: (userId: number) => Promise.resolve(null)
        }
        try {
            await profileCreator[data.role](newUser.insertId)
        } catch(error) {
            await db.delete(users).where(eq(users.userId,newUser.insertId))
            throw new ApiError(500,"Failed to register")
        }

        //generate access and refesh token
        const payload: Payload = {
            userId: newUser.insertId,
            role: data.role
        }

        const accessToken = jwtUtils.generateAccessToken(payload)
        const refreshToken = jwtUtils.generateRefreshToken(payload)
        const expiryDate = jwtUtils.getExpiryDate()

        //insert refresh token into the database
        await db
        .insert(refreshTokens)
        .values({
            userId: newUser.insertId,
            refreshToken: refreshToken,
            expiresAt: expiryDate
        }) 

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
        const [existingUser] = await db
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

        const payload: Payload = {
            userId: existingUser.userId,
            role: existingUser.role
        }

        const accessToken = jwtUtils.generateAccessToken(payload)
        const refreshToken = jwtUtils.generateRefreshToken(payload)
        const expiryDate = jwtUtils.getExpiryDate()

        //deleting existing token
        await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId,existingUser.userId))

        //insert refresh token into the database
        await db
        .insert(refreshTokens)
        .values({
            userId: existingUser.userId,
            refreshToken: refreshToken,
            expiresAt: expiryDate
        }) 

        return {
            userId: existingUser.userId,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            accessToken: accessToken,
            refreshToken: refreshToken
        }
    },

    async logout(userId: number) {
        await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId,userId))
    },

    async getAccount(userId: number) {
        const [user] = await db
        .select()
        .from(users)
        .where(eq(users.userId,userId))

        //check for the user
        if(!user) {
            throw new ApiError(404,"Not found")
        }

        const {password:_, ...data} = user
        return data
    },

    async refreshToken(token:string, user: Payload) {
        const [tokenRecord] = await db
        .select()
        .from(refreshTokens)
        .where(and(
            eq(refreshTokens.userId, user.userId),
            eq(refreshTokens.refreshToken,token)
        ))

        if(!tokenRecord) {
            throw new ApiError(401,"Access Denied")
        }

        if(tokenRecord.expiresAt < new Date()) {
            await db
            .delete(refreshTokens)
            .where(eq(refreshTokens.userId,user.userId))
            throw new ApiError(401,"Expired refresh token. Please log in again")
        }

        //refresh token rotation
        const accessToken = jwtUtils.generateAccessToken(user)
        const refreshToken = jwtUtils.generateRefreshToken(user)
        const expiryDate = jwtUtils.getExpiryDate()

        //deleting existing token
        await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId,user.userId))

        //insert refresh token into the database
        await db
        .insert(refreshTokens)
        .values({
            userId: user.userId,
            refreshToken: refreshToken,
            expiresAt: expiryDate
        }) 
        
        return {accessToken, refreshToken}
    }
}