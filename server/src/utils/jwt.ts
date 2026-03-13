import jwt from 'jsonwebtoken'
import { ROLE } from './constants'

const ACCCES_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!

export const jwtUtils = {
    generateAccessToken(payload: {userId: number, role: typeof ROLE[number]}) {
        if(!ACCCES_TOKEN_SECRET) {
            console.error("Access token not defined")
        }
        return jwt.sign(payload,ACCCES_TOKEN_SECRET,{ expiresIn: '10m'})
    },

    generateRefreshToken(payload: {userId: number, role: typeof ROLE[number]}) {
        if(!REFRESH_TOKEN_SECRET) {
            console.error("Refresh token not defined")
        }
        return jwt.sign(payload,REFRESH_TOKEN_SECRET,{ expiresIn: '7d'})
    },

    getExpiryDate(): Date {
        return new Date(Date.now() + 7*24*60*60*1000)
    }
}