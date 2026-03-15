import { ROLE } from "../utils/constants"

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number,
                role: typeof ROLE[number]
            }
        }
    }
}

export {}