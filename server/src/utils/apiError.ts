export class ApiError<T> extends Error {
    public statusCode: number
    public success:boolean
    public errors:T[]
    constructor(
        statusCode: number, 
        message:string = "Something went wrong!!",
        errors:T[] = [],
    ) {
        super(message)
        this.statusCode = statusCode
        this.success = false
        this.errors = errors
        Error.captureStackTrace(this,this.constructor)
    }
}