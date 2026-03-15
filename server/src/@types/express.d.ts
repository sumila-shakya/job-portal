import { Payload } from "./interface"

declare global {
    namespace Express {
        interface Request {
            user?: Payload
        }
    }
}

export {}