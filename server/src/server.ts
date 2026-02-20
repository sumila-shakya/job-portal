import 'dotenv/config'
import express from "express"
import { exit } from 'node:process'
import { db } from './config/mysql.config'
import { connectMongoDb } from './config/mongodb.config'
import mongoose from 'mongoose'

const PORT = process.env.PORT || 3000
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))

const startServer = async ()=> {
    try {
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

app.get('/api/health', async(_, res)=> {
    try {
        //testing mongodb connection
        const mongodbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'

        //testing mysql connection
        await db.execute('SELECT 1')

        res.status(200).json({
            status: 'ok',
            message: 'server is running',
            mysql: "Connected",
            mongodb: mongodbStatus,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "unexpected error occurred"
        })
    }
})

startServer()