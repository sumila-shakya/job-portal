import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { jobSchema, jobType, jobQuerySchema, jobQueryType } from "../utils/validator";
import { jobServices } from "../services/job.service";
import { ApiResponse } from "../utils/apiResponse";

export const jobController = {
    //posting a job function
    async postJob(req: Request, res: Response, next: NextFunction) {
        try{
            //get company id
            const companyId = req.user?.userId;

            if(!companyId) {
                throw new ApiError(401,"Access Denied")
            }

            //validate the user data
            const validatedData: jobType = jobSchema.parse(req.body)

            //job service function
            const data = await jobServices.postJob(validatedData, companyId)

            res
            .status(201)
            .json(new ApiResponse(201, data, "Job posted successfully"))
        } catch(error) {
            next(error)
        }
    },

    //company function to get the jobs posted by them
    async getMyJobs(req: Request, res: Response, next: NextFunction) {
        try {
            //get the company id
            const companyId = req.user?.userId;

            if(!companyId) {
                throw new ApiError(401,"Access Denied")
            }
            
            //job service function
            const allJobs = await jobServices.getMyJobs(companyId)

            res
            .status(200)
            .json(new ApiResponse(200,allJobs))
        } catch(error) {
            next(error)
        }
    },

    //company function to get the job details
    async getJobDetails(req: Request, res: Response, next: NextFunction) {
        try {
            //get the job id
            const companyId = req.user?.userId;

            if(!companyId) {
                throw new ApiError(401,"Access Denied")
            }

            //get the job id from the path parameters
            const reqJobId: number = parseInt(req.params.jobId as string)

            //check if the job id is a number
            if(Number.isNaN(reqJobId)) {
                throw new ApiError(400,"The valid job id must be provided")
            }

            //job service function
            const jobDetails = await jobServices.getJobDetails(companyId, reqJobId)
            
            res
            .status(200)
            .json(new ApiResponse(200, jobDetails))
        } catch(error) {
            next(error)
        }
    },

    //public function to view the jobs with filtering and searching
    async viewJobs(req: Request, res: Response, next: NextFunction) {
        try {
            //validate the query parameter
            const query: jobQueryType = jobQuerySchema.parse(req.query)

            //job service function
            const data = await jobServices.viewJobs(query)

            res
            .status(200)
            .json(new ApiResponse(200,data))
        } catch(error) {
            next(error)
        }
    },

    //delete job function
    async deleteJob(req: Request, res: Response, next: NextFunction) {
        try {
            //get the company id
            const companyId = req.user?.userId;

            if(!companyId) {
                throw new ApiError(401,"Access Denied")
            }

            //get the job id to delete from the path parameter
            const toDelJobId: number = parseInt(req.params.jobId as string) 

            //check if the job id is a number
            if(Number.isNaN(toDelJobId)) {
                throw new ApiError(400,"The valid job id must be provided")
            }

            //job service function
            await jobServices.deleteJob(toDelJobId, companyId)

            res
            .status(200)
            .json(new ApiResponse(200, {}, "Job deleted successfully"))
        } catch(error) {
            next(error)
        }
    }
}