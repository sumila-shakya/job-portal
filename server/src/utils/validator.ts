import {z} from 'zod'
import { ROLE } from './constants'

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

export type registrationType = z.infer<typeof registrationSchema>