import { Request, Response, NextFunction } from "express"
import { ApiError } from "../utils/apiError"

//wrapper function
export const authorizeRole = (...allowedRole: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const role = req.user?.role
        if(!role || !allowedRole.includes(role)) {
            return next(new ApiError(403,"Permission Denied"))
        }
        next()
    }
}