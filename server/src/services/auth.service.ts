import { db } from "../config/mysql.config";
import { users, refreshTokens } from "../models/mysql.models";
import { registrationType } from "../utils/validator";
import { eq } from "drizzle-orm";
import { ApiError } from "../utils/apiError";
import bcrypt from 'bcrypt'
import { CompanyProfile, JobSeekersProfile } from "../models/mongodb.models";
import { jwtUtils } from "../utils/jwt";

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
        const payload = {
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
    }
}