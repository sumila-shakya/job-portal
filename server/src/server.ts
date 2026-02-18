import 'dotenv/config'
import express from "express"
import { exit } from 'node:process'

const PORT = process.env.PORT || 3000
const app = express()

app.use(express.json())

const startServer = async ()=> {
    try {
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
        res.status(200).json({
            status: 'ok',
            message: 'server is running',
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