class NotFoundError extends Error {
    constructor(type) {
      // Pass remaining arguments (including vendor specific ones) to parent constructor
      var message = `${type} was not found on database.`
      super(message)
  
      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, NotFoundError)
      }
  
      this.name = 'NotFoundError'
      // Custom debugging information
      this.type = type
      this.status = 404
      //this.date = new Date()
    }
  }

class ForbiddenMethodError extends Error {
    constructor(type) {
      // Pass remaining arguments (including vendor specific ones) to parent constructor
      var message = `${type} operation is not allowed on this page.`
      super(message)
  
      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ForbiddenMethodError)
      }
  
      this.name = 'ForbiddenMethodError'
      // Custom debugging information
      this.type = type
      this.status = 405
    }
  }

class UnauthorizedError extends Error {
    constructor() {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        var message = `You are unauthorized to perform this operation.`
        super(message)

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
        Error.captureStackTrace(this, UnauthorizedError)
        }

        this.name = 'UnauthorizedError'
        // Custom debugging information
        this.type = 'Unauthorized'
        this.status = 401
    }
}

module.exports = { 
    NotFoundError:NotFoundError,
    ForbiddenMethodError:ForbiddenMethodError,
    UnauthorizedError:UnauthorizedError
}