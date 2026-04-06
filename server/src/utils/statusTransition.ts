import { applicationStatus } from "../@types/interface";

export const STATE_TRANSITIONS:Record<applicationStatus, applicationStatus[]> = {
    pending: ['rejected', 'shortlisted'],
    shortlisted: ['rejected','interviewed'],
    interviewed: ['rejected','accepted'],
    withdrawn: [],
    cancelled: [],
    accepted: [],
    rejected: []
}