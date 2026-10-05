import 'dotenv/config'
import express from "express"
import { exit } from 'node:process'
import { db } from './config/mysql.config'
import { connectMongoDb } from './config/mongodb.config'
import { app } from './app'
import { expiredJobsCron, permanentlyDeleteJobs } from './cron/job.cron'
import { permanentlyDeactivateUsers } from './cron/auth.cron'

const PORT = process.env.PORT || 3000

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

startServer()