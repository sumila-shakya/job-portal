import jwt from 'jsonwebtoken'
import { ROLE } from './constants'
import { ApiError } from './apiError'

const ACCCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!

export const jwtUtils = {
    generateAccessToken(payload: {userId: number, role: typeof ROLE[number]}) {
        if(!ACCCESS_TOKEN_SECRET) {
            console.error("Access token not defined")
        }
        return jwt.sign(payload,ACCCESS_TOKEN_SECRET,{ expiresIn: '10m'})
    },

    generateRefreshToken(payload: {userId: number, role: typeof ROLE[number]}) {
        if(!REFRESH_TOKEN_SECRET) {
            console.error("Refresh token not defined")
        }
        return jwt.sign(payload,REFRESH_TOKEN_SECRET,{ expiresIn: '7d'})
    },

    getExpiryDate(): Date {
        return new Date(Date.now() + 7*24*60*60*1000)
    },

    verifyToken(token: string) {
        try {
            const decoded = jwt.verify(token,ACCCESS_TOKEN_SECRET) as { userId: number, role: typeof ROLE[number]}
            return decoded
        } catch(error) {
            if(error instanceof jwt.TokenExpiredError) {
                throw new ApiError(401,'Expired token.')
            }
            throw new ApiError(401,'Invalid token.')
        }
    }
}