class ValidationError extends Error {
  constructor (chainErrors, ...args) {
    super(...args)
    Error.captureStackTrace(this, ValidationError)

    this._chainErrors = chainErrors
  }

  /**
   * A Set of error messages for the blockchain
   *
   * @example
   * for (let e of err.chainError) {
   *    console.log(e)
   * }
   */
  get chainErrors () {
    return this._chainErrors
  }
}

module.exports = ValidationError
