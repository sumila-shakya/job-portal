import { db } from "../config/mysql.config";
import { users, jobs, NewJob, Job, User } from "../models/mysql.models";
import { JobDetail, CompanyProfile, IJob } from "../models/mongodb.models";
import { jobType } from "../utils/validator";
import { and, eq, lt } from "drizzle-orm";
import { ApiError } from "../utils/apiError";


export const jobServices = {
    async closeExpiredJobs() {
        try{
            await db.update(jobs)
            .set({isClosed: true})
            .where(and(
                lt(jobs.deadlineDate, new Date()),
                eq(jobs.isClosed, false),
                eq(jobs.isDeleted, false)
            ))
            console.log("Expired jobs cleaned up !!")
        } catch(error) {
            console.error("Failed to clean up expired jobs: ", error)
        }
    },

    async postJob(data: jobType, companyId: number) {
        const { title, deadlineDate, ...jobData } = data
        const newJob: NewJob = {
            title,
            postedBy: companyId,
            deadlineDate
        }

        const [job] = await db
        .insert(jobs)
        .values(newJob)

        const jobDetails: IJob = {jobId: job.insertId,...jobData}

        try{
            const result = await JobDetail.create(jobDetails)
            const {__v,_id,...data} = result.toJSON()
            return {
                title,
                ...data
            }
        } catch(error) {
            await db.delete(jobs).where(eq(jobs.jobId,job.insertId))
            throw new ApiError(500,"Failed to post job")
        }
    },

    async getMyJobs(companyId: number) {
        const allJobs = await db
        .select({
            jobId: jobs.jobId,
            title: jobs.title,
            isClosed: jobs.isClosed,
            deadlineDate: jobs.deadlineDate,
            createdAt: jobs.createdAt,
            updatedAt: jobs.updatedAt
        })
        .from(jobs)
        .where(and(
            eq(jobs.postedBy, companyId),
            eq(jobs.isDeleted, false)
        ))

        return allJobs
    },

    async getJobDetails(companyId: number, reqJobId: number) {
        const [reqJob]:Job[] = await db.select().from(jobs)
        .where(and(
            eq(jobs.jobId, reqJobId),
            eq(jobs.postedBy, companyId),
            eq(jobs.isDeleted,false)
        ))
        if(!reqJob) {
            throw new ApiError(404,"Job not found")
        }

        const result = await JobDetail.findOne({jobId: reqJob.jobId})
        if(!result) {
            throw new ApiError(500,"job details missing")
        }

        const {__v,_id,jobId, ...data} = result.toJSON()
        return {
            jobId: reqJob.jobId,
            title: reqJob.title,
            isClosed: reqJob.isClosed,
            deadlineDate: reqJob.deadlineDate,
            createdAt: reqJob.createdAt,
            updatedAt: reqJob.updatedAt,
            details: data
        }
        
    }
}