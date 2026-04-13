import 'dotenv/config'
import express from "express"
import { exit } from 'node:process'
import { db } from './config/mysql.config'
import { connectMongoDb } from './config/mongodb.config'
import mongoose from 'mongoose'
import { ApiResponse } from './utils/apiResponse'
import { errorHandler } from './middlewares/error.middleware'
import authRouter from './routes/auth.route'
import profileRouter from './routes/profile.route'
import jobRouter from './routes/job.route'
import cookieParser from 'cookie-parser'
import applicationRouter from './routes/application.route'
import { expiredJobsCron, permanentlyDeleteJobs } from './cron/job.cron'
import { permanentlyDeactivateUsers } from './cron/auth.cron'

const PORT = process.env.PORT || 3000
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

app.use('/api/auth',authRouter)
app.use('/api/profile',profileRouter)
app.use('/api/jobs',jobRouter)
app.use('/api/application',applicationRouter)

const startServer = async ()=> {
    try {
        console.log("Starting server !!")
        //connecting mongodb database
        await connectMongoDb()
        console.log(`MongoDb database connected`)

        //connecting mysql database
        await db.execute('SELECT 1')
        console.log(`MySQL database connected`)

        //initializing cron jobs
        
        console.log("Cleaning up expired jobs")
        expiredJobsCron()

        console.log("Cleaning up the deleted jobs")
        permanentlyDeleteJobs()

        console.log("Cleaning up the deactivated users")
        permanentlyDeactivateUsers()

        //listen on port 3000
        app.listen(PORT,()=>{
            console.log(`Server is running on port ${PORT || 3000}`)
        })
    }catch(error) {
        const errorMessage = error instanceof Error ? error.message : error
        console.error("Failed to start the server: ",errorMessage)
        exit(1)
    }
}

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

startServer()