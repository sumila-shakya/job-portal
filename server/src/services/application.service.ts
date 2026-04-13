import { db } from "../config/mysql.config";
import { jobApplications, jobs, NewApplication, Application, users } from "../models/mysql.models";
import { eq, and, gt, desc, count, notInArray } from "drizzle-orm";
import { ApiError } from "../utils/apiError";
import { appliedJobsType, updateStatusType, viewApplicantType } from "../utils/validator";
import { STATE_TRANSITIONS } from "../utils/statusTransition";
import { JobSeekersProfile } from "../models/mongodb.models";

export const applicationServices = {
    //apply for the job service function
    async applyJob(applicantId: number, jobId: number) {
        //check if the job exists and the user has already applied for the job
        const [[job],[existingApplication]] = await Promise.all([
            await db
            .select()
            .from(jobs)
            .where(and(
                eq(jobs.jobId,jobId),
                gt(jobs.deadlineDate,new Date()),
                eq(jobs.isClosed, false),               //job not closed
                eq(jobs.isDeleted, false)               //job not deleted
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

        //check if the job exists
        if(!job) {
            throw new ApiError(404,"job not found")
        }

        //check if the user has already applied for the job
        if(existingApplication) {
            //cannot reaaply for the job after withdrawing
            if(existingApplication.applicationStatus === 'withdrawn') {
                throw new ApiError(400,"Cannot reapply after withdrawing")
            }

            throw new ApiError(400,"already applied to the job")
        }

        const data: NewApplication = {
            jobId: job.jobId,
            applicantId: applicantId
        }

        //insert new application into the database
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

    //withdraw from the job function
    async withdrawJob(applicantId: number, applicationId: number) {
        //check for the existing application
        const [existingApplication]:Application[] = await db
            .select()
            .from(jobApplications)
            .where(and(
                eq(jobApplications.applicationId, applicationId),
                eq(jobApplications.applicantId, applicantId)
            ))
    
        if(!existingApplication) {
            throw new ApiError(404,"application not found")
        }

        //if the user has already withdrawn throw error
        if(existingApplication.applicationStatus === 'withdrawn') {
            throw new ApiError(400,"application already withdrawn")
        }

        //cannot withdraw if the application is already accepted, rejected or cancelled
        const nonWithdrawableStates: string[] = ['accepted','rejected','cancelled']

        if(nonWithdrawableStates.includes(existingApplication.applicationStatus)) {
            throw new ApiError(400,"application already processed cannot withdraw now")
        }

        //update the status to withdrawn
        await db.update(jobApplications)
        .set({
            applicationStatus: 'withdrawn'
        })
        .where(and(
            eq(jobApplications.applicationId, existingApplication.applicationId),
            eq(jobApplications.applicantId, applicantId)
        ))
    },

    //job seeker service function to view the applied jobs
    async viewAppliedJobs(applicantId: number, paginationData:appliedJobsType) {
        //calculate the page number and offset
        const page: number = Number(paginationData.page) || 1
        const limit: number = Number(paginationData.limit) || 5
        const skip: number = (page - 1) * limit

        //get all the applications and the total count of applications
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
            //pagination meta data
            pagination: {
                totalApplications: total.count,
                totalPages: Math.ceil(total.count/limit),
                page,
                limit
            },
            appliedJobs
        }
    },

    //company service function to update the application status
    async updateApplicationStatus(applicationId: number, companyId: number, updateData: updateStatusType) {
        //get the application that is not withdrawn or cancelled
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

        //check if the application exists
        if(!application) {
            throw new ApiError(404,"Application not found")
        }

        //check if the job for the application was posted by the company
        if(application.postedBy !== companyId) {
            throw new ApiError(403,"Forbidden, Permission Denied")
        }

        //check if the status transistion is valid or not
        if(!STATE_TRANSITIONS[application.applicationStatus].includes(updateData.applicationStatus)) {
            throw new ApiError(400, "Invalid state")
        }

        //update the job application status
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

    //company service function for viewing the applicants for the job
    async viewApplicants(jobId: number, companyId: number, query: viewApplicantType) {
        //calculate the page number and the offset
        const page: number = Number(query.page) || 1
        const limit: number = Number(query.limit) || 5
        const skip: number = (page - 1) * limit

        const mysqlCond = [eq(jobApplications.jobId,jobId)]

        //filter by the application status
        if(query.applicationStatus) {
            mysqlCond.push(eq(jobApplications.applicationStatus,query.applicationStatus))
        }

        const [[job], mysqlData, [totalApplications]] = await Promise.all([
            //get the requested job
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

            //get the mysql data for the application of the requested job
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

            //get the total count of the applications for the requested job
            db.select({
                count: count()
            })
            .from(jobApplications)
            .where(eq(jobApplications.jobId,jobId))
        ])

        if(!job) {
            throw new ApiError(404,"Job not found")
        }

        //get the applicant ids
        const applicantIdArr: number[] = mysqlData.map(application => application.applicantId)

        //find the mongodb data for the applications
        const mongodbData = await JobSeekersProfile
        .find({jobSeekerId: {$in: applicantIdArr}})
        .select('jobSeekerId resumeUrl phoneNo')
        .lean()

        //merge the mysql and mongodb data
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
            //job details
            job,

            //pagination meta data
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