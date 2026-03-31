import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { applicationServices } from "../services/application.service";
import { appliedJobSchema, appliedJobsType } from "../utils/validator";

export const applicationController = {
    async applyJob(req: Request, res: Response, next: NextFunction) {
        try {
            const applicantId = req.user?.userId;
            if(!applicantId) {
                throw new ApiError(401,"Access Denied")
            }

            const jobId: number = parseInt(req.params.jobId as string)
            if(Number.isNaN(jobId)) {
                throw new ApiError(400,"The valid user id must be provided")
            }

            const data = await applicationServices.applyJob(applicantId, jobId)

            res
            .status(201)
            .json(new ApiResponse(201, data, "Successfully applied to the job"))
        } catch(error) {
            next(error)
        }
    },

    async withdrawJob(req: Request, res: Response, next: NextFunction) {
        try {
            const applicantId = req.user?.userId;
            if(!applicantId) {
                throw new ApiError(401,"Access Denied")
            }

            const applicationId: number = parseInt(req.params.applicationId as string)
            if(Number.isNaN(applicationId)) {
                throw new ApiError(400,"The valid user id must be provided")
            }

            await applicationServices.withdrawJob(applicantId, applicationId)

            res.status(200)
            .json(new ApiResponse(200,{},"Application is successfully withdrawn"))
        } catch(error) {
            next(error)
        }
    },

    async viewAppliedJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const applicantId = req.user?.userId;
            if(!applicantId) {
                throw new ApiError(401,"Access Denied")
            }

            const paginationData: appliedJobsType = appliedJobSchema.parse(req.query)

            const data = await applicationServices.viewAppliedJobs(applicantId, paginationData)

            res.status(200)
            .json(new ApiResponse(200, data))
        } catch(error) {
            next(error)
        }
    }
}