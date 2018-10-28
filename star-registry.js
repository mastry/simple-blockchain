const NodeCache = require('node-cache')
const CACHE_TIMEOUT_SECONDS = 300
const cache = new NodeCache({ stdTTL: CACHE_TIMEOUT_SECONDS })

var bitcoin = require('bitcoinjs-lib')
var bitcoinMessage = require('bitcoinjs-message')

class Validator {
  constructor(address) {
    this.requestTimeStamp = Date.now()
    this.address = address
    this.message = `${address}:${this.requestTimeStamp}:starRegistry`
  }

  get validationWindow() {
    const now = Date.now()
    const elapsed = Math.floor(now - this.requestTimeStamp) / 1000
    const remaining = CACHE_TIMEOUT_SECONDS - elapsed
    return remaining
  }

  validate(signature) {
    if (this.validationWindow <= 0) { 
      return false 
    }

    return bitcoinMessage.verify(this.message, this.address, signature)
  }
}

exports.requestValidation = (address) => {
  let validator = cache.get(address)
  if (validator === undefined) {
    validator = new Validator(address)
    cache.set(address, validator)
  }

  return { err: null, response: validator }
}

exports.validate = (address, signature) => {
  let validator = cache.get(address)
  if (validator === undefined) {
    throw Error("Address not found. Use requestValidation to initiate a validation request.")
  }

  const isValid = validator.validate(signature)

  const registration = {
    'registerStar': isValid,
    'status': {
      'address': validator.address,
      'requestTimeStamp': validator.startTime,
      'message': validator.message,
      'validationWindow': validator.validationWindow,
      'messageSignature': isValid ? 'valid' : 'invalid'
    }
  }

  return { err: null, response: registration }
}

exports.register = (req, res) => {

}

exports.searchHash = (req, res) => {

}

exports.searchAddress = (req, res) => {

}

exports.searchHeight = (req, res) => {

}

exports.close = () => {
  cache.close()
}