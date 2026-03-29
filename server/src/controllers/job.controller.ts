import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { jobSchema, jobType, jobQuerySchema, jobQueryType } from "../utils/validator";
import { jobServices } from "../services/job.service";
import { ApiResponse } from "../utils/apiResponse";

export const jobController = {
    async postJob(req: Request, res: Response, next: NextFunction) {
        try{
            const companyId = req.user?.userId;
            if(!companyId) {
                throw new ApiError(401,"Access Denied")
            }

            const validatedData: jobType = jobSchema.parse(req.body)
            const data = await jobServices.postJob(validatedData, companyId)

            res
            .status(201)
            .json(new ApiResponse(201, data, "Job posted successfully"))
        } catch(error) {
            next(error)
        }
    },

    async getMyJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const companyId = req.user?.userId;
            if(!companyId) {
                throw new ApiError(401,"Access Denied")
            }
            
            const allJobs = await jobServices.getMyJobs(companyId)

            res
            .status(200)
            .json(new ApiResponse(200,allJobs))
        } catch(error) {
            next(error)
        }
    },

    async getJobDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const companyId = req.user?.userId;
            if(!companyId) {
                throw new ApiError(401,"Access Denied")
            }
            const reqJobId: number = parseInt(req.params.jobId as string)
            if(Number.isNaN(reqJobId)) {
                throw new ApiError(400,"The valid job id must be provided")
            }

            const jobDetails = await jobServices.getJobDetails(companyId, reqJobId)
            
            res
            .status(200)
            .json(new ApiResponse(200, jobDetails))
        } catch(error) {
            next(error)
        }
    },

    async viewJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const query: jobQueryType = jobQuerySchema.parse(req.query)

            const data = await jobServices.viewJobs(query)

            res
            .status(200)
            .json(new ApiResponse(200,data))
        } catch(error) {
            next(error)
        }
    },

    async deleteJob(req: Request, res: Response, next: NextFunction) {
        try {
            const companyId = req.user?.userId;
            if(!companyId) {
                throw new ApiError(401,"Access Denied")
            }
            const toDelJobId: number = parseInt(req.params.jobId as string) 
            if(Number.isNaN(toDelJobId)) {
                throw new ApiError(400,"The valid job id must be provided")
            }

            await jobServices.deleteJob(toDelJobId, companyId)

            res
            .status(200)
            .json(new ApiResponse(200, {}, "Job deleted successfully"))
        } catch(error) {
            next(error)
        }
    }
}