import { db } from "../config/mysql.config";
import { jobApplications, jobs, NewApplication, Application, users } from "../models/mysql.models";
import { eq, and, gt, desc, count } from "drizzle-orm";
import { ApiError } from "../utils/apiError";
import { appliedJobsType } from "../utils/validator";

export const applicationServices = {
    async applyJob(applicantId: number, jobId: number) {
        const [[job],[existingApplication]] = await Promise.all([
            await db
            .select()
            .from(jobs)
            .where(and(
                eq(jobs.jobId,jobId),
                gt(jobs.deadlineDate,new Date()),
                eq(jobs.isClosed, false),
                eq(jobs.isDeleted, false)
            ))
            ,

            db
            .select()
            .from(jobApplications)
            .where(and(
                eq(jobApplications.jobId, jobId),
                eq(jobApplications.applicantId, applicantId)
            ))
        ]) 
        if(!job) {
            throw new ApiError(404,"job not found")
        }

        if(existingApplication) {
            if(existingApplication.applicationStatus === 'withdrawn') {
                throw new ApiError(400,"Cannot reapply after withdrawing")
            }
            throw new ApiError(400,"already applied to the job")
        }

        const data: NewApplication = {
            jobId: job.jobId,
            applicantId: applicantId
        }

        const [application] = await db
        .insert(jobApplications)
        .values(data)

        return {
            applicationId: application.insertId,
            jobId: job.jobId,
            applicantId: applicantId,
            applicationStatus: 'pending',
            appliedDate: new Date(),
        }
    },

    async withdrawJob(applicantId: number, applicationId: number) {
        const [existingApplication] = await db
            .select()
            .from(jobApplications)
            .where(and(
                eq(jobApplications.applicationId, applicationId),
                eq(jobApplications.applicantId, applicantId)
            ))

        if(!existingApplication) {
            throw new ApiError(404,"application not found")
        }
        if(existingApplication.applicationStatus === 'withdrawn') {
            throw new ApiError(400,"application already withdrawn")
        }

        const nonWithdrawableStates = ['accepted','rejected','cancelled']
        if(nonWithdrawableStates.includes(existingApplication.applicationStatus)) {
            throw new ApiError(400,"application already processed cannot withdraw now")
        }

        await db.update(jobApplications)
        .set({
            applicationStatus: 'withdrawn'
        })
        .where(and(
            eq(jobApplications.applicationId, existingApplication.applicationId),
            eq(jobApplications.applicantId, applicantId)
        ))
    },

    async viewAppliedJobs(applicantId: number, paginationData:appliedJobsType) {
        const page = Number(paginationData.page) || 1
        const limit = Number(paginationData.limit) || 5
        const skip = (page - 1) * limit

        const [appliedJobs, [total]] = await Promise.all([
            db
            .select({
                applicationId: jobApplications.applicationId,
                jobId: jobs.jobId,
                jobTitle: jobs.title,
                postedBy: users.userId,
                companyName: users.name,
                appliedDate: jobApplications.appliedDate,
                applicationStatus: jobApplications.applicationStatus,
                updatedAt: jobApplications.updatedAt,
                jobStatus: {
                    isClosed: jobs.isClosed,
                    deadlineDate: jobs.deadlineDate,
                    isDeleted: jobs.isDeleted
                }
            })
            .from(jobApplications)
            .innerJoin(jobs,eq(jobApplications.jobId,jobs.jobId))
            .innerJoin(users,eq(jobs.postedBy,users.userId))
            .where(eq(jobApplications.applicantId, applicantId))
            .orderBy(desc(jobApplications.appliedDate))
            .limit(limit)
            .offset(skip)
            ,

            db
            .select({
                count: count()
            })
            .from(jobApplications)
            .where(eq(jobApplications.applicantId, applicantId))
        ]) 

        return {
            pagination: {
                totalApplications: total.count,
                totalPages: Math.ceil(total.count/limit),
                page,
                limit
            },
            appliedJobs
        }
    }
}