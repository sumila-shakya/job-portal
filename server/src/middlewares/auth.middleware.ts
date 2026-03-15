import { Request, Response, NextFunction } from "express";
import { jwtUtils } from "../utils/jwt";
import { ApiError } from "../utils/apiError";

export const authMiddleware = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization
        const token = authHeader && authHeader.split(' ')[1]
        if(!token) {
            throw new ApiError(401,"Token is required")
        }
        const decoded = jwtUtils.verifyToken(token)

        req.user = decoded
        next()
    } catch(error) {
        next(error)
    }
}