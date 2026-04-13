import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { db } from "../config/mysql.config";
import { users,User } from "../models/mysql.models";
import { and, eq } from "drizzle-orm";

//check for active users
export const checkActiveUser = async(req: Request, res: Response, next: NextFunction) => {
    try{
        const userId = req.user?.userId;
        if(!userId) {
            throw new ApiError(401,"Access Denied")
        }

        const [user]: User[] = await db
        .select()
        .from(users)
        .where(and(
            eq(users.userId,userId),
            eq(users.isActive,true)
        ))

        if(!user) {
            throw new ApiError(403, "Account is not active")
        }
        
        next()
    } catch(error) {
        next(error)
    }
}