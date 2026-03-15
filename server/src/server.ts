import 'dotenv/config'
import express from "express"
import { exit } from 'node:process'
import { db } from './config/mysql.config'
import { connectMongoDb } from './config/mongodb.config'
import mongoose from 'mongoose'
import { ApiResponse } from './utils/apiResponse'
import { errorHandler } from './middlewares/error.middleware'
import authRouter from './routes/auth.route'
import cookieParser from 'cookie-parser'

const PORT = process.env.PORT || 3000
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

//authentication route
app.use('/api/auth',authRouter)

const startServer = async ()=> {
    try {
        console.log("Starting server !!")
        //connecting mongodb database
        await connectMongoDb()
        console.log(`MongoDb database connected`)

        //connecting mysql database
        await db.execute('SELECT 1')
        console.log(`MySQL database connected`)

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