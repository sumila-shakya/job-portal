import {z} from 'zod'
import { ROLE, EDUCATION_LEVEL, POSITION, WORKTYPE, EMPLOYMENT_TYPE, UPDATE_APPLICATION_STATUS, APPLICATION_STATUS } from './constants'

/* ------------------------------- Registration Validation ------------------------------- */
export const registrationSchema = z.object({
    name: z.string().min(2,{message:"Name must be atleast two characters long"}).trim(),
    email: z.string().email({message: "Invalid email format"}),
    password: z.string().min(8,{message:"Password is too short"})
    .regex(/[A-Z]/,{message:"Password must contain at least one uppercase letter"})
    .regex(/[a-z]/,{message:"Password must contain at least one lowercase letter"})
    .regex(/[0-9]/,{message:"Password must contain at least one digit"})
    .regex(/[^a-zA-Z0-9\s]/,{message:"Password must contain at least one special character"}),
    role: z.enum(ROLE,{message:"Invalid role"})
})

/* ------------------------------- Login Validation ------------------------------- */
export const loginSchema = z.object({
    email: z.string().email({message: "Invalid email format"}),
    password: z.string().min(1,{message:"Password is required"})
})

/* ------------------------------- Job Seeker Profile Validation ------------------------------- */
const JSProfileSchema = z.object({
    bio: z.string(),
    skills: z.array(z.string()),
    education: z.array(z.object({
        level: z.enum(EDUCATION_LEVEL),
        field: z.string(),
        institution: z.string(),
        year: z.number().min(1900)
    })),
    address: z.object({ country: z.string(), city: z.string()}),
    experience: z.array(z.object({ 
        company: z.string(), 
        years: z.number().positive(), 
        role: z.string()
    })),
    phoneNo: z.string(),
})
export const updateJSProfileSchema = JSProfileSchema.partial()

/* ------------------------------- Company Profile Validation ------------------------------- */
const companyProfileSchema = z.object({
    aboutUs: z.string(),
    specialties: z.array(z.string()),
    hqLocation: z.object({ country: z.string(), city: z.string()}),
    contactNo: z.string(),
    companyWebsiteURL: z.string().url()
    .regex(/^https?:\/\//, {message: "Only http/https allowed"})
    .max(2048, {message: "URL too long"}),
})
export const updateComProfileSchema = companyProfileSchema.partial()

/* ------------------------------- Job Posting Validation ------------------------------- */
export const jobSchema = z.object({
    title: z.string().min(2,{message: "The title must be at least two characters long"}).trim(),
    deadlineDate: z.coerce.date().refine((date)=> date > new Date(), {message: "Job is already closed"}),
    description: z.string().optional(),
    requirement: z.array(z.string()),
    position: z.enum(POSITION,{message:"Invalid position"}),
    employmentType: z.enum(EMPLOYMENT_TYPE,{message:"Invalid employment type"}),
    workType: z.enum(WORKTYPE,{message:"Invalid work type"}),
    education: z.object({
        level: z.enum(EDUCATION_LEVEL),
        field: z.string()
    }).optional(),
    location: z.object({ country: z.string(), city: z.string()}),
    salary: z.object({ 
        min: z.number().positive(), 
        max: z.number().positive(), 
        currency: z.string().min(1)
    }).refine((data)=> data.min <= data.max, {message:"maximum salary must be greater than minimum salary"})
    .optional(),
    experience: z.object({ 
        min: z.number().positive(), 
        max: z.number().positive()
    })
    .refine((data)=> data.min <= data.max, {message:"maximum experience must be greater than minimum experience"})
    .optional(),
    category: z.string().min(2,{message: "The category must be at least two characters long"}).trim()
})

/* ------------------------------- Job Query Validation ------------------------------- */
const jobQSchema = z.object({
    title: z.string().min(2).trim(),
    category: z.string().min(2).trim(),
    position: z.enum(POSITION,{message:"Invalid position"}),
    employmentType: z.enum(EMPLOYMENT_TYPE,{message:"Invalid employment type"}),
    workType: z.enum(WORKTYPE,{message:"Invalid work type"}),
    country: z.string().min(2), 
    city: z.string().min(2),
    salary_min: z.coerce.number().positive(), 
    salary_max: z.coerce.number().positive(),
    experience_min: z.coerce.number().positive(), 
    experience_max: z.coerce.number().positive(),
    education_level: z.enum(EDUCATION_LEVEL),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(5).default(5)
})
export const jobQuerySchema = jobQSchema.partial()

/* ------------------------------- Applied Job Validation ------------------------------- */
export const appliedJobSchema = z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(5).default(5).optional()
})

/* ------------------------------- Update Application Validation ------------------------------- */
export const updateStatusSchema = z.object({
    applicationStatus: z.enum(UPDATE_APPLICATION_STATUS)
})

/* ------------------------------- View Applicant Validation ------------------------------- */
export const viewApplicantSchema = z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(5).default(5).optional(),
    applicationStatus: z.enum(APPLICATION_STATUS).optional()
})

export type registrationType = z.infer<typeof registrationSchema>
export type loginType = z.infer<typeof loginSchema>
export type updateJSProfileType = z.infer<typeof updateJSProfileSchema>
export type updateComProfileType = z.infer<typeof updateComProfileSchema>
export type jobType = z.infer<typeof jobSchema>
export type jobQueryType = z.infer<typeof jobQuerySchema>
export type appliedJobsType = z.infer<typeof appliedJobSchema>
export type updateStatusType = z.infer<typeof updateStatusSchema>
export type viewApplicantType = z.infer<typeof viewApplicantSchema>