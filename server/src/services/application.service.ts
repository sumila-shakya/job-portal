import { db } from "../config/mysql.config";
import { jobApplications, jobs, NewApplication, Application, users } from "../models/mysql.models";
import { eq, and, gt, desc, count, notInArray } from "drizzle-orm";
import { ApiError } from "../utils/apiError";
import { appliedJobsType, updateStatusType, viewApplicantType } from "../utils/validator";
import { STATE_TRANSITIONS } from "../utils/statusTransition";
import { JobSeekersProfile } from "../models/mongodb.models";

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
    },

    async updateApplicationStatus(applicationId: number, companyId: number, updateData: updateStatusType) {
        const [application] = await db
        .select({
            applicationId: jobApplications.applicationId,
            jobId: jobApplications.jobId,
            applicantId: jobApplications.applicantId,
            appliedDate: jobApplications.appliedDate,
            applicationStatus: jobApplications.applicationStatus,
            postedBy: jobs.postedBy
        })
        .from(jobApplications)
        .innerJoin(jobs,eq(jobApplications.jobId,jobs.jobId))
        .where(and(
            eq(jobApplications.applicationId, applicationId),
            notInArray(jobApplications.applicationStatus,['withdrawn','cancelled'])
        ))

        if(!application) {
            throw new ApiError(404,"Application not found")
        }

        if(application.postedBy !== companyId) {
            throw new ApiError(403,"Forbidden, Permission Denied")
        }

        if(!STATE_TRANSITIONS[application.applicationStatus].includes(updateData.applicationStatus)) {
            throw new ApiError(400, "Invalid state")
        }

        await db
        .update(jobApplications)
        .set({
            applicationStatus: updateData.applicationStatus
        })
        .where(eq(jobApplications.applicationId, applicationId))

        return {
            applicationId: application.applicationId,
            jobId: application.jobId,
            applicantId: application.applicantId,
            appliedDate: application.appliedDate,
            applicationStatus: updateData.applicationStatus,
            updatedAt: new Date()
        }
    },

    async viewApplicants(jobId: number, companyId: number, query: viewApplicantType) {
        const page = Number(query.page) || 1
        const limit = Number(query.limit) || 5
        const skip = (page - 1) * limit
        const mysqlCond = [eq(jobApplications.jobId,jobId)]
        if(query.applicationStatus) {
            mysqlCond.push(eq(jobApplications.applicationStatus,query.applicationStatus))
        }

        const [[job], mysqlData, [totalApplications]] = await Promise.all([
            db.select({
                jobId: jobs.jobId,
                title: jobs.title,
                createdAt: jobs.createdAt,
                isClosed: jobs.isClosed,
                deadlineDate: jobs.deadlineDate
            })
            .from(jobs)
            .where(and(
                eq(jobs.jobId,jobId),
                eq(jobs.isDeleted,false),
                eq(jobs.postedBy,companyId)
            )),

            db.select({
                applicationId: jobApplications.applicationId,
                applicantId: jobApplications.applicantId,
                name: users.name,
                email: users.email,
                appliedDate: jobApplications.appliedDate,
                applicationStatus: jobApplications.applicationStatus,
                updatedAt: jobApplications.updatedAt,
            })
            .from(jobApplications)
            .innerJoin(users,eq(jobApplications.applicantId,users.userId))
            .where(and(...mysqlCond))
            .orderBy(desc(jobApplications.appliedDate))
            .limit(limit)
            .offset(skip),

            db.select({
                count: count()
            })
            .from(jobApplications)
            .where(eq(jobApplications.jobId,jobId))
        ])

        if(!job) {
            throw new ApiError(404,"Job not found")
        }

        const applicantIdArr = mysqlData.map(application => application.applicantId)
        const mongodbData = await JobSeekersProfile
        .find({jobSeekerId: {$in: applicantIdArr}})
        .select('jobSeekerId resumeUrl phoneNo')
        .lean()

        const applications = mysqlData.map(application => {
            const details = mongodbData.find(m => m.jobSeekerId === application.applicantId)
            return {
                ...application,
                profile: {
                    resumeUrl: details?.resumeUrl ?? null,
                    phoneNo: details?.phoneNo ?? null
                }
            }
        })
        
        return {
            job,
            pagination: {
                totalApplications: totalApplications.count,
                totalPages: Math.ceil(totalApplications.count/limit),
                page,
                limit
            },
            applications
        }
    }
}