import {z} from 'zod'
import { ROLE, EDUCATION_LEVEL } from './constants'

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

export const loginSchema = z.object({
    email: z.string().email({message: "Invalid email format"}),
    password: z.string().min(1,{message:"Password is required"})
})

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
    experience: z.array(z.object({ company: z.string(), years: z.number().positive(), role: z.string()})),
    phoneNo: z.string(),
})
export const updateJSProfileSchema = JSProfileSchema.partial()

export type registrationType = z.infer<typeof registrationSchema>
export type loginType = z.infer<typeof loginSchema>
export type updateJSProfileType = z.infer<typeof updateJSProfileSchema>