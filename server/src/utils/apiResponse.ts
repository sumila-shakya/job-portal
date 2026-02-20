export class ApiResponse <T> {
    public success:boolean
    public statusCode:number
    public data:T
    public message:string

    constructor(statusCode:number,message:string = "Success", data:T) {
        this.statusCode = statusCode
        this.message = message
        this.success = statusCode < 400
        this.data = data
    }
}