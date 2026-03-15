import { ROLE } from "../utils/constants"

export interface Payload {
    userId: number, 
    role: typeof ROLE[number]
}