import cron from 'node-cron'
import { cronUserServices } from '../services/auth.service'

export const permanentlyDeactivateUsers = () => {
    cron.schedule('0 0 * * *', async () => {
        await cronUserServices.deleteUsers()
    })
}