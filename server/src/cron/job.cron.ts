import cron from 'node-cron'
import { jobServices, cronJobServices } from '../services/job.service'

export const expiredJobsCron = () => {
    cron.schedule('0 0 * * *', async ()=> {
        await cronJobServices.closeExpiredJobs()
    })
}

export const permanentlyDeleteJobs = () => {
    cron.schedule('0 0 * * *', async ()=> {
        await cronJobServices.deleteJobs()
    })
}
