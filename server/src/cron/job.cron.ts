import cron from 'node-cron'
import { jobServices } from '../services/job.service'

export const expiredJobsCron = () => {
    cron.schedule('0 0 * * *', async ()=> {
        await jobServices.closeExpiredJobs()
    })
}
