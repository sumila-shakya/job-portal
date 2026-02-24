import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { ZodError } from "zod";

export const errorHandler = (
    err:any, 
    req:Request, 
    res:Response, 
    next:NextFunction
)=> {
    let error  = err
    if(error instanceof ZodError) {
        error = new ApiError(400, "validation failed", error.issues)
    }

    else if(!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500
        const message = error.message || "Internal server error"
        error = new ApiError(statusCode,message)
    }

    const response = {
        success: error.success,
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors
    }

    return res.status(error.statusCode).json(response)
}