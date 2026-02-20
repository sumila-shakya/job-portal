import mongoose from "mongoose";

export const connectMongoDb = async():Promise<void> => {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI as string)
    } catch (error) {
        throw error
    }
}