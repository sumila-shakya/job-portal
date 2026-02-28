import { serial, timestamp, mysqlEnum, varchar, boolean, mysqlTable, bigint, index, unique } from "drizzle-orm/mysql-core";

//users schema
export const users = mysqlTable('users', {
    userId: serial('user_id').primaryKey(),
    name: varchar('name', {length: 255}).notNull(),
    email: varchar('email',{length: 255}).notNull().unique(),
    password: varchar('password',{length: 255}).notNull(),
    role: mysqlEnum('role',['job_seeker','company','admin']).notNull(),
    createdAt: timestamp('created_at',{mode:'date'}).defaultNow(),
    updatedAt: timestamp('updated_at',{ mode:'date'}).defaultNow().onUpdateNow(),
    isActive: boolean('is_active').notNull().default(true)
})

//jobs schema
export const jobs = mysqlTable('jobs', {
    jobId: serial('job_id').primaryKey(),
    postedBy: bigint('posted_by',{mode:'number', unsigned:true}).notNull().references(()=>users.userId, {onDelete:'cascade',onUpdate:'cascade'}),
    title: varchar('title', {length: 255}).notNull(),
    createdAt: timestamp('created_at',{mode:'date'}).defaultNow(),
    updatedAt: timestamp('updated_at',{ mode:'date'}).defaultNow().onUpdateNow(),
    deadlineDate: timestamp('deadline_date',{mode:'date'}).notNull(),
    isClosed: boolean('is_closed').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
},(table)=>{
    return {nameIdx: index("title_idx").on(table.title)}
})

//job application schema
export const jobApplications = mysqlTable('job_applications',{
    applicationId: serial('application_id').primaryKey(),
    jobId: bigint('job_id',{mode:'number', unsigned:true}).notNull().references(()=>jobs.jobId, {onDelete:'cascade',onUpdate:'cascade'}),
    applicantId: bigint('applicant_id',{mode:'number', unsigned:true}).notNull().references(()=>users.userId, {onDelete:'cascade',onUpdate:'cascade'}),
    appliedDate: timestamp('applied_date',{mode:'date'}).defaultNow(),
    applicationStatus: mysqlEnum('application_status',['pending','rejected','accepted','shortlisted','interviewed','withdrawn']).notNull().default('pending'),
    updatedAt: timestamp('updated_at',{ mode:'date'}).defaultNow().onUpdateNow(),
},(table)=>{
    return {uniqueApplication: unique('unique_application').on(table.jobId,table.applicantId)}
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert

export type Application = typeof jobApplications.$inferSelect
export type NewApplication = typeof jobApplications.$inferInsert