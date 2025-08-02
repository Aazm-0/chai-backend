class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something Went Wrong",
        errors = [],
        stack = ""
    ) {
        // If you dont ooveride message in super the stack tracing with msg might not vbe proper? and you can bypass it in some tools
        super(message)
        this.statusCode = statusCode
        this.errors = errors
        // This data is set to null is to provide consistency and say oh there is no data to serve
        this.data = null
        this.success = false
        // Stack trace is used to identify where the error occured so this logic is written very well fo thris so it is easy to identify the file 
        /*
        Yes, in production apps:
        Logging frameworks (like Winston, Pino, or Bunyan) capture .stack for error logs.
        Error monitoring tools (like Sentry, LogRocket, New Relic) use .stack to:
        Recreate how the error happened.
        Show the full context.
        */
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}
// The reason we make a centralized ApiError and ApiResponse is because
// It ensures all the api responses follow the same format ex :(success,message,data,error) easy to consume
// You can change all logic in one place
// Reusable code instead of logging res.statu.json again and again