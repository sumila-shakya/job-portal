import { ROLE } from "../utils/constants"
import { updateJSProfileType } from "../utils/validator"

export interface Payload {
    userId: number, 
    role: typeof ROLE[number]
}

export interface JProfileUpdates extends updateJSProfileType{
    resumeUrl?: string,
}