class StarRegistryError extends Error {
  constructor (...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params)

    this.name = this.constructor.name

    // Maintains proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StarRegistryError)
    }
  }
}

module.exports = StarRegistryError
