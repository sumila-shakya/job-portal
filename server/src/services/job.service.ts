import { db } from "../config/mysql.config";
import { jobs, NewJob, Job, jobApplications } from "../models/mysql.models";
import { JobDetail, CompanyProfile } from "../models/mongodb.models";
import { IJob } from "../@types/interface";
import { jobType, jobQueryType } from "../utils/validator";
import { and, eq, lt, gt, inArray, like, desc, count } from "drizzle-orm";
import { ApiError } from "../utils/apiError";


export const jobServices = {
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

        const result = await JobDetail.findOne({jobId: reqJob.jobId}).lean()
        if(!result) {
            throw new ApiError(500,"job details missing")
        }

        const {__v,_id,jobId, ...data} = result
        return {
            jobId: reqJob.jobId,
            title: reqJob.title,
            isClosed: reqJob.isClosed,
            deadlineDate: reqJob.deadlineDate,
            createdAt: reqJob.createdAt,
            updatedAt: reqJob.updatedAt,
            details: data
        } 
    },

    async viewJobs(data: jobQueryType) {
        const page = Number(data.page) || 1
        const limit = Number(data.limit) || 5
        const skip = (page - 1) * limit

        const mysqlCond = []
        if(data.title) {
            mysqlCond.push(like(jobs.title,`%${data.title}%`))
        }
        const isTitle = mysqlCond.length === 0 ? false : true
        mysqlCond.push(eq(jobs.isClosed, false))
        mysqlCond.push(eq(jobs.isDeleted, false))
        mysqlCond.push(gt(jobs.deadlineDate, new Date()))

        const mongoFilter: Record<string,any> = {}
        if(data.position) mongoFilter['position'] = data.position
        if(data.employmentType) mongoFilter['employmentType'] = data.employmentType
        if(data.workType) mongoFilter['workType'] = data.workType
        if(data.category) mongoFilter['category'] = data.category
        if(data.country) mongoFilter['location.country'] = data.country
        if(data.city) mongoFilter['location.city'] = data.city
        if(data.salary_max) mongoFilter['salary.max'] = {$lte: data.salary_max}
        if(data.salary_min) mongoFilter['salary.min'] = {$gte: data.salary_min}
        if(data.experience_max) mongoFilter['experience.max'] = {$lte: data.experience_max}
        if(data.experience_min) mongoFilter['experience.min'] = {$gte: data.experience_min}
        if(data.education_level) mongoFilter['education.level'] = data.education_level

        const isMongoFilter = Object.keys(mongoFilter).length === 0 ? false : true

        if(isTitle) {
            const mysqlJobs = await db
            .select({
                jobId: jobs.jobId,
                title: jobs.title,
                deadlineDate: jobs.deadlineDate,
                postedBy: jobs.postedBy
            })
            .from(jobs)
            .where(and(...mysqlCond))

            const jobIdArr = mysqlJobs.map((job)=>job.jobId)
            mongoFilter['jobId'] = {$in: jobIdArr}

            const [mongoDetails,totalCount] = await Promise.all([
                JobDetail
                .find(mongoFilter)
                .select('-_id -__v')
                .skip(skip)
                .limit(limit)
                .lean()
                ,
                JobDetail
                .countDocuments(mongoFilter)
            ])

            const allJobs = mongoDetails.map((job) => {
                const mysqlJob = mysqlJobs.find(m => m.jobId === job.jobId)
                return { 
                    ...mysqlJob,
                    details: job
                }
            })
            return {
                pagination: {
                    totalJobs: totalCount,
                    totalPages: Math.ceil(totalCount/limit),
                    page,
                    limit
                },
                allJobs
            }
        }

        if(isMongoFilter && !isTitle) {
            const mongoDetails = await JobDetail
            .find(mongoFilter)
            .select('-_id -__v')
            .lean()
            const jobIdArr = mongoDetails.map((job)=>job.jobId)
            mysqlCond.push(inArray(jobs.jobId, jobIdArr))

            const [mysqlJobs, [totalCount]] = await Promise.all([
                db
                .select({
                    jobId: jobs.jobId,
                    title: jobs.title,
                    deadlineDate: jobs.deadlineDate,
                    postedBy: jobs.postedBy
                })
                .from(jobs)
                .where(and(...mysqlCond))
                .limit(limit)
                .offset(skip)
                ,
                
                db.select({
                    jobs: count()
                })
                .from(jobs)
                .where(and(...mysqlCond))
            ])

            const allJobs = mysqlJobs.map((job)=> {
                const details = mongoDetails.find(m => m.jobId === job.jobId)
                return { 
                    ...job, 
                    details: details ?? {}
                }
            })
            return  {
                pagination: {
                    totalJobs: totalCount.jobs,
                    totalPages: Math.ceil(totalCount.jobs/limit),
                    page,
                    limit
                },
                allJobs
            }
        }

        if(!isMongoFilter && !isTitle) {
            const [mysqlJob, [totalCount]] = await Promise.all([
                db
                .select({
                    jobId: jobs.jobId,
                    title: jobs.title,
                    deadlineDate: jobs.deadlineDate,
                    postedBy: jobs.postedBy
                })
                .from(jobs)
                .where(and(...mysqlCond))
                .orderBy(desc(jobs.createdAt))
                .limit(limit)
                .offset(skip)
                ,
                
                db.select({
                    jobs: count()
                })
                .from(jobs)
                .where(and(...mysqlCond))
            ])

            const jobIdArr = mysqlJob.map((job)=>job.jobId)
            const mongoDetails = await JobDetail
            .find({jobId: {$in: jobIdArr}})
            .select('-_id -__v')
            .lean()

            const allJobs = mysqlJob.map((job)=> {
                const details = mongoDetails.find(m => m.jobId === job.jobId)
                return { 
                    ...job, 
                    details: details ?? {}
                }
            })
            return {
                pagination: {
                    totalJobs: totalCount.jobs,
                    totalPages: Math.ceil(totalCount.jobs/limit),
                    page,
                    limit
                },
                allJobs
            }
        }    
    },

    async deleteJob(toDelJobId: number, companyId: number) {
        const [toDelJob] = await db
        .select()
        .from(jobs)
        .where(and(
            eq(jobs.jobId, toDelJobId),
            eq(jobs.postedBy, companyId),
            eq(jobs.isDeleted,false)
        ))

        if(!toDelJob) {
            throw new ApiError(404,"Job not found")
        }

        await Promise.all([
            db.update(jobs)
            .set({
                isClosed: true,
                isDeleted: true,
                deletedAt: new Date()
            })
            .where(eq(jobs.jobId, toDelJob.jobId))
            ,

            db.update(jobApplications)
            .set({
                applicationStatus: 'cancelled'
            })
            .where(eq(jobApplications.jobId, toDelJob.jobId))
        ]) 
    }
}

export const cronJobServices = {
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
    
    async deleteJobs() {
        try{
            const GRACE_PERIOD_DAYS = 30
            const gracePeriodCutOff = new Date()
            gracePeriodCutOff.setDate(gracePeriodCutOff.getDate() - GRACE_PERIOD_DAYS)

            const expiredJobs = await db
            .select({
                jobId: jobs.jobId
            })
            .from(jobs)
            .where(and(
                eq(jobs.isDeleted, true),
                lt(jobs.deletedAt, gracePeriodCutOff)
            ))

            if(expiredJobs.length === 0) return
            const expiredJobsIds = expiredJobs.map(job => job.jobId)

            await JobDetail.deleteMany({
                jobId: {$in: expiredJobsIds}
            })

            await db
            .delete(jobs)
            .where(inArray(jobs.jobId, expiredJobsIds))

            console.log("Jobs deleted permanently!!")
        } catch(error) {
            console.error("Failed to permanently delete jobs: ", error)   
        }
    }
    
}