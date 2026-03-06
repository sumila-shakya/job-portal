import mongoose from "mongoose";

//interface definition
interface IJobSeeker {
    jobSeekerId: number,
    bio?: string,
    skills?: string[],
    education?: {
        level: 'Bachelor'|'Master'|'PhD'|'+2/A-levels'|'SEE'|'others',
        field: string,
        institution: string,
        year: number
    }[],
    address?: { country: string, city: string},
    experience?: { company: string, year: number, role: string}[],
    resumeUrl?: string,
    phoneNo?: string,
    isHidden: boolean
}

interface ICompany {
    companyId: number,
    aboutUs?: string,
    specialties?: string[],
    hqLocation?: { country: string, city: string },
    contactNo?: string,
    companyWebsiteURL?: string,  
    isHidden: boolean
}

interface IJob {
    jobId: number,
    description?: string,
    requirement: string[],
    position: 'junior' | 'senior';
    employmentType: 'full' | 'part' | 'intern' | 'contract' | 'freelance';
    workType: 'remote' | 'on-site' | 'hybrid';
    education?: {
        level: 'Bachelor'|'Master'|'PhD'|'+2/A-levels'|'SEE'|'others',
        field: string,
    },
    location: { country: string, city: string},
    salary?: { min: number, max: number, currency: string},
    experience?: { min: number, max: number},
    category: string
}


//schema definition
const jobSeekerSchema = new mongoose.Schema<IJobSeeker>({
    jobSeekerId: {type: Number, required: true, unique: true},
    bio: {type: String},
    skills: { type: [String]},
    education: [{
        level: {type: String, enum:['Bachelor','Master','PhD','+2/A-levels','SEE','others']},
        field: {type: String},
        institution: {type: String},
        year: {type: Number} 
    }],
    address: {
        country: {type: String},
        city: { type: String}
    },
    experience: [{
        company: {type: String},
        year: {type: Number},
        role: {type: String}
    }],
    resumeUrl: {type: String},
    phoneNo: {type: String, unique: true, sparse: true},
    isHidden: {type: Boolean, default: false}
},{timestamps: true})

const companySchema = new mongoose.Schema<ICompany>({
    companyId: {type: Number, required: true, unique: true},
    aboutUs: {type: String},
    specialties: { type: [String]},
    hqLocation: {
        country: {type: String},
        city: { type: String}
    },
    contactNo: {type: String, unique: true, sparse: true},
    companyWebsiteURL: {type: String},
    isHidden: {type: Boolean, default: false} 
},{timestamps: true})

const JobSchema = new mongoose.Schema<IJob>({
    jobId: {type: Number, required: true, unique: true},
    description: {type: String},
    requirement: { type: [String]},
    position: {type: String, enum:['junior' , 'senior']},
    employmentType: {type: String, enum:['full' , 'part' , 'intern' , 'contract' , 'freelance']},
    workType: {type: String, enum:['remote' , 'on-site' , 'hybrid']},
    education: [{
        level: {type: String, enum:['Bachelor','Master','PhD','+2/A-levels','SEE','others']},
        field: {type: String}
    }],
    location: {
        country: {type: String},
        city: { type: String}
    },
    salary: {
        min: {type: Number},
        max: { type: Number},
        currency: {type: String}
    },
    experience: {
        min: {type: Number},
        max: { type: Number},
    },
    category: {type: String}
})

//indexing



//models
export const JobSeekersProfile = mongoose.model<IJobSeeker>('JobSeekersProfile',jobSeekerSchema)
export const CompanyProfile = mongoose.model<ICompany>('CompanyProfile',companySchema)