import mongoose from "mongoose";

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

jobSeekerSchema.index({jobSeekerId: 1})

export const JobSeekersProfile = mongoose.model<IJobSeeker>('JobSeekersProfile',jobSeekerSchema)