import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { applicationServices } from "../services/application.service";
import { appliedJobSchema, appliedJobsType, updateStatusSchema, updateStatusType, viewApplicantSchema, viewApplicantType } from "../utils/validator";

export const applicationController = {
    //apply for the job function
    async applyJob(req: Request, res: Response, next: NextFunction) {
        try {
            //get applicant id
            const applicantId = req.user?.userId;

            if(!applicantId) {
                throw new ApiError(401,"Access Denied")
            }

            //get the job id from the path parameters
            const jobId: number = parseInt(req.params.jobId as string)

            //check if the job id is a number
            if(Number.isNaN(jobId)) {
                throw new ApiError(400,"The valid job id must be provided")
            }

            //application service function
            const data = await applicationServices.applyJob(applicantId, jobId)

            res
            .status(201)
            .json(new ApiResponse(201, data, "Successfully applied to the job"))
        } catch(error) {
            next(error)
        }
    },

    //withdraw application function
    async withdrawJob(req: Request, res: Response, next: NextFunction) {
        try {
            //get applicant id
            const applicantId = req.user?.userId;

            if(!applicantId) {
                throw new ApiError(401,"Access Denied")
            }

            //get the application id from the path parameters
            const applicationId: number = parseInt(req.params.applicationId as string)

            //check if the application id is a number
            if(Number.isNaN(applicationId)) {
                throw new ApiError(400,"The valid application id must be provided")
            }

            //application service function
            await applicationServices.withdrawJob(applicantId, applicationId)

            res.status(200)
            .json(new ApiResponse(200,{},"Application is successfully withdrawn"))
        } catch(error) {
            next(error)
        }
    },

    //job seeker function to view all the applied jobs
    async viewAppliedJobs(req: Request, res: Response, next: NextFunction) {
        try {
            //get the applicant id
            const applicantId = req.user?.userId;

            if(!applicantId) {
                throw new ApiError(401,"Access Denied")
            }

            //validate the query parameters
            const paginationData: appliedJobsType = appliedJobSchema.parse(req.query)

            //application service function
            const data = await applicationServices.viewAppliedJobs(applicantId, paginationData)

            res.status(200)
            .json(new ApiResponse(200, data))
        } catch(error) {
            next(error)
        }
    },

    //update the application status function
    async updateApplicationStatus(req: Request, res: Response, next:NextFunction) {
        try {
            //get the company id
            const companyId = req.user?.userId;

            if(!companyId) {
                throw new ApiError(401,"Access Denied")
            }

            //get the application id from the path parameter
            const applicationId: number = parseInt(req.params.applicationId as string)

            //check if the application id is a number
            if(Number.isNaN(applicationId)) {
                throw new ApiError(400,"The valid application id must be provided")
            }

            //validate the user data
            const validatedData: updateStatusType = updateStatusSchema.parse(req.body)

            //application service function
            const updatedResult = await applicationServices.updateApplicationStatus(applicationId, companyId, validatedData)

            res
            .status(200)
            .json(new ApiResponse(200,updatedResult,"application updated successfully"))
        } catch(error) {
            next(error)
        }
    },

    //company function for viewing all the applicants for a job
    async viewApplicants(req: Request, res: Response, next: NextFunction) {
        try {
            //get the company id
            const companyId = req.user?.userId;

            if(!companyId) {
                throw new ApiError(401,"Access Denied")
            }

            //get the job id from the path parameter
            const jobId: number = parseInt(req.params.jobId as string)

            //check if the job id is a number
            if(Number.isNaN(jobId)) {
                throw new ApiError(400,"The valid job id must be provided")
            }

            //validate the user data
            const query:viewApplicantType = viewApplicantSchema.parse(req.query)

            //application service function
            const data = await applicationServices.viewApplicants(jobId, companyId, query)

            res
            .status(200)
            .json(new ApiResponse(200, data))
        } catch(error) {
            next(error)
        }
    }
}