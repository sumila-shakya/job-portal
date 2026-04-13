import { applicationStatus } from "../@types/interface";

//status transition for the job application update
export const STATE_TRANSITIONS:Record<applicationStatus, applicationStatus[]> = {
    pending: ['rejected', 'shortlisted'],
    shortlisted: ['rejected','interviewed'],
    interviewed: ['rejected','accepted'],
    withdrawn: [],
    cancelled: [],
    accepted: [],
    rejected: []
}