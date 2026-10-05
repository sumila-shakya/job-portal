import 'dotenv/config'
import express from "express"
import { db } from './config/mysql.config'
import mongoose from 'mongoose'
import { ApiResponse } from './utils/apiResponse'
import { errorHandler } from './middlewares/error.middleware'
import authRouter from './routes/auth.route'
import profileRouter from './routes/profile.route'
import jobRouter from './routes/job.route'
import cookieParser from 'cookie-parser'
import applicationRouter from './routes/application.route'

export const app = express()

// EXPRESS GLOBAL MIDDLEWARES
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

// ROUTES
app.use('/api/auth',authRouter)
app.use('/api/profile',profileRouter)
app.use('/api/jobs',jobRouter)
app.use('/api/application',applicationRouter)

// HEALTH STATUS CHECKUP
app.get('/api/health', async(_, res, next)=> {
    try {
        /*
        testing the global error handler
        throw new Error("Simulated crash")
        */

        //testing mongodb connection
        const mongodbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'

        //testing mysql connection
        await db.execute('SELECT 1')

        const healthData = {
            status: 'ok',
            mysql: "Connected",
            mongodb: mongodbStatus,
            timestamp: new Date().toISOString()
        }

        res.status(200).json(new ApiResponse(200, healthData, "Server is running"))
    } catch (error) {
        next(error)
    }
})

app.use(errorHandler)