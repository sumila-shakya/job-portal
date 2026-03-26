import mongoose from "mongoose";
import { POSITION, EMPLOYMENT_TYPE, WORKTYPE, EDUCATION_LEVEL } from "../utils/constants";
import { IJobSeeker, ICompany, IJob } from "../@types/interface";

/* ------------------------------- schema definition ------------------------------- */
const jobSeekerSchema = new mongoose.Schema<IJobSeeker>({
    jobSeekerId: {type: Number, required: true, unique: true},
    bio: {type: String},
    skills: { type: [String]},
    education: [{
        level: {type: String, enum:EDUCATION_LEVEL},
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
        years: {type: Number},
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
    position: {type: String, enum:POSITION},
    employmentType: {type: String, enum:EMPLOYMENT_TYPE},
    workType: {type: String, enum:WORKTYPE},
    education: {
        level: {type: String, enum:EDUCATION_LEVEL},
        field: {type: String}
    },
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


/* ------------------------------- indexing ------------------------------- */
JobSchema.index({'category':1, 'location.city':1, 'position':1})
JobSchema.index({'location.city':1, 'employmentType':1, 'workType':1})
JobSchema.index(
    {'salary.min':1, 'salary.max':1},
    {partialFilterExpression: {'salary':{$exists:true}}}
)
JobSchema.index(
    {'experience.min':1, 'experience.max':1},
    {partialFilterExpression: {'experience':{$exists:true}}}
)


/* ------------------------------- models ------------------------------- */
export const JobSeekersProfile = mongoose.model<IJobSeeker>('JobSeekersProfile',jobSeekerSchema)
export const CompanyProfile = mongoose.model<ICompany>('CompanyProfile',companySchema)
export const JobDetail = mongoose.model<IJob>('JobDetail',JobSchema)