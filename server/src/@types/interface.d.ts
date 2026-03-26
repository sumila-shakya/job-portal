import { POSITION, EMPLOYMENT_TYPE, WORKTYPE, EDUCATION_LEVEL, ROLE } from "../utils/constants";
import { updateJSProfileType } from "../utils/validator"

export interface Payload {
    userId: number, 
    role: typeof ROLE[number]
}

export interface JProfileUpdates extends updateJSProfileType{
    resumeUrl?: string,
}

export interface IJobSeeker {
    jobSeekerId: number,
    bio?: string,
    skills?: string[],
    education?: {
        level: typeof EDUCATION_LEVEL[number],
        field: string,
        institution: string,
        year: number
    }[],
    address?: { country: string, city: string},
    experience?: { company: string, years: number, role: string}[],
    resumeUrl?: string,
    phoneNo?: string,
    isHidden: boolean
}

export interface ICompany {
    companyId: number,
    aboutUs?: string,
    specialties?: string[],
    hqLocation?: { country: string, city: string },
    contactNo?: string,
    companyWebsiteURL?: string,  
    isHidden: boolean
}

export interface IJob {
    jobId: number,
    description?: string,
    requirement: string[],
    position: typeof POSITION[number],
    employmentType: typeof EMPLOYMENT_TYPE[number],
    workType: typeof WORKTYPE[number],
    education?: {
        level: typeof EDUCATION_LEVEL[number],
        field: string,
    },
    location: { country: string, city: string},
    salary?: { min: number, max: number, currency: string},
    experience?: { min: number, max: number},
    category: string
}