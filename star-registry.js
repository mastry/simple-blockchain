const NodeCache = require('node-cache')
const CACHE_TIMEOUT_SECONDS = 300
const cache = new NodeCache({ stdTTL: CACHE_TIMEOUT_SECONDS })

exports.requestValidation = (address) => {
  const timestamp = Date.now()
  let startTime = cache.get(address)
  if (startTime === undefined) {
    startTime = timestamp
    cache.set(address, startTime)
  }

  const remaining = CACHE_TIMEOUT_SECONDS - (Math.floor(timestamp - startTime) / 1000)
  const response = {
    address: address,
    requestTimeStamp: startTime,
    message: `${address}:${startTime}:starRegistry`,
    validationWindow: remaining
  }

  return { err: null, response: response }
}

exports.validate = (req, res) => {

}

exports.register = (req, res) => {

}

exports.searchHash = (req, res) => {

}

exports.searchAddress = (req, res) => {

}

exports.searchHeight = (req, res) => {

}
