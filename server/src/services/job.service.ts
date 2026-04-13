import { db } from "../config/mysql.config";
import { jobs, NewJob, Job, jobApplications } from "../models/mysql.models";
import { JobDetail, CompanyProfile } from "../models/mongodb.models";
import { IJob } from "../@types/interface";
import { jobType, jobQueryType } from "../utils/validator";
import { and, eq, lt, gt, inArray, like, desc, count } from "drizzle-orm";
import { ApiError } from "../utils/apiError";


export const jobServices = {
    //post job service function
    async postJob(data: jobType, companyId: number) {
        const { title, deadlineDate, ...jobData } = data

        const newJob: NewJob = {
            title,
            postedBy: companyId,
            deadlineDate
        }

        //insert into the mysql
        const [job] = await db
        .insert(jobs)
        .values(newJob)

        const jobDetails: IJob = {jobId: job.insertId,...jobData}

        try{
            //insert into the mongodb
            const result = await JobDetail.create(jobDetails)
            const {__v,_id,...data} = result.toJSON()
            return {
                title,
                ...data
            }
        } catch(error) {
            //delete the mysql data if mongodb insert fails
            await db.delete(jobs).where(eq(jobs.jobId,job.insertId))
            throw new ApiError(500,"Failed to post job")
        }
    },

    //company service function to view all the jobs posted by the company
    async getMyJobs(companyId: number) {
        //fetch all the job meta data
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

    //get the details for the job posted by the company
    async getJobDetails(companyId: number, reqJobId: number) {
        //get the job
        const [reqJob]:Job[] = await db.select().from(jobs)
        .where(and(
            eq(jobs.jobId, reqJobId),
            eq(jobs.postedBy, companyId),
            eq(jobs.isDeleted,false)
        ))

        //check if the job exists
        if(!reqJob) {
            throw new ApiError(404,"Job not found")
        }

        //get the job details
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

    //public route to view, search and filter the jobs
    async viewJobs(data: jobQueryType) {
        //calculate the page number and offset
        const page: number = Number(data.page) || 1
        const limit: number = Number(data.limit) || 5
        const skip: number = (page - 1) * limit

        //categorize the mysql query filters
        const mysqlCond = []
        if(data.title) {
            mysqlCond.push(like(jobs.title,`%${data.title}%`))
        }
        const isTitle = mysqlCond.length === 0 ? false : true
        mysqlCond.push(eq(jobs.isClosed, false))
        mysqlCond.push(eq(jobs.isDeleted, false))
        mysqlCond.push(gt(jobs.deadlineDate, new Date()))

        //categorize the mongodb filters
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

        //mysql leads
        if(isTitle) {
            //get the mysql data
            const mysqlJobs = await db
            .select({
                jobId: jobs.jobId,
                title: jobs.title,
                deadlineDate: jobs.deadlineDate,
                postedBy: jobs.postedBy
            })
            .from(jobs)
            .where(and(...mysqlCond))

            //get the job ids
            const jobIdArr: number[] = mysqlJobs.map((job)=>job.jobId)
            mongoFilter['jobId'] = {$in: jobIdArr}

            const [mongoDetails,totalCount] = await Promise.all([
                //get the mongodb data
                JobDetail
                .find(mongoFilter)
                .select('-_id -__v')
                .skip(skip)
                .limit(limit)
                .lean()
                ,

                //get the total job count
                JobDetail
                .countDocuments(mongoFilter)
            ])

            //merge mysql and mongodb data
            const allJobs = mongoDetails.map((job) => {
                const mysqlJob = mysqlJobs.find(m => m.jobId === job.jobId)
                return { 
                    ...mysqlJob,
                    details: job
                }
            })

            return {
                //pagination meta data
                pagination: {
                    totalJobs: totalCount,
                    totalPages: Math.ceil(totalCount/limit),
                    page,
                    limit
                },
                allJobs
            }
        }

        //mongodb leads
        if(isMongoFilter && !isTitle) {
            //find mongodb data
            const mongoDetails = await JobDetail
            .find(mongoFilter)
            .select('-_id -__v')
            .lean()

            //get the job ids 
            const jobIdArr: number[] = mongoDetails.map((job)=>job.jobId)
            mysqlCond.push(inArray(jobs.jobId, jobIdArr))

            const [mysqlJobs, [totalCount]] = await Promise.all([
                //get the mysql data
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
                
                //get the total job count
                db.select({
                    jobs: count()
                })
                .from(jobs)
                .where(and(...mysqlCond))
            ])

            //merge the mysql and mongodb data
            const allJobs = mysqlJobs.map((job)=> {
                const details = mongoDetails.find(m => m.jobId === job.jobId)
                return { 
                    ...job, 
                    details: details ?? {}
                }
            })

            return  {
                //pagination meta data
                pagination: {
                    totalJobs: totalCount.jobs,
                    totalPages: Math.ceil(totalCount.jobs/limit),
                    page,
                    limit
                },
                allJobs
            }
        }

        //no filter query
        if(!isMongoFilter && !isTitle) {
            const [mysqlJob, [totalCount]] = await Promise.all([
                //get the mysql data
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
                
                //get the total job count
                db.select({
                    jobs: count()
                })
                .from(jobs)
                .where(and(...mysqlCond))
            ])

            //get the job ids
            const jobIdArr = mysqlJob.map((job)=>job.jobId)

            //get the mongodb data
            const mongoDetails = await JobDetail
            .find({jobId: {$in: jobIdArr}})
            .select('-_id -__v')
            .lean()

            //merge the mongodb and mysql data
            const allJobs = mysqlJob.map((job)=> {
                const details = mongoDetails.find(m => m.jobId === job.jobId)
                return { 
                    ...job, 
                    details: details ?? {}
                }
            })

            return {
                //pagination meta data
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

    //delete job server function
    async deleteJob(toDelJobId: number, companyId: number) {
        //get the job to delete
        const [toDelJob]: Job[] = await db
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
            //soft delete the job
            db.update(jobs)
            .set({
                isClosed: true,
                isDeleted: true,
                deletedAt: new Date()
            })
            .where(eq(jobs.jobId, toDelJob.jobId))
            ,

            //change the status of all application to cancelled
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
            //close the jobs after their deadline is over
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
            //calculate the grace period
            const GRACE_PERIOD_DAYS = 30
            const gracePeriodCutOff = new Date()
            gracePeriodCutOff.setDate(gracePeriodCutOff.getDate() - GRACE_PERIOD_DAYS)

            //get all the expired jobs
            const expiredJobs = await db
            .select({
                jobId: jobs.jobId
            })
            .from(jobs)
            .where(and(
                eq(jobs.isDeleted, true),
                lt(jobs.deletedAt, gracePeriodCutOff)
            ))

            if(expiredJobs.length === 0) 
                return

            //get the expired job ids
            const expiredJobsIds: number[] = expiredJobs.map(job => job.jobId)

            //delete the mongodb job details
            await JobDetail.deleteMany({
                jobId: {$in: expiredJobsIds}
            })

            //delete the mysql jobs
            await db
            .delete(jobs)
            .where(inArray(jobs.jobId, expiredJobsIds))

            console.log("Jobs deleted permanently!!")
        } catch(error) {
            console.error("Failed to permanently delete jobs: ", error)   
        }
    }
    
}