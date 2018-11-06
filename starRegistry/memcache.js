var bitcoin = require('bitcoinjs-lib')
var bitcoinMessage = require('bitcoinjs-message')

// Create an in-memory cache that automatically deletes items after 5 minutes (300 seconds)
const CACHE_TIMEOUT = 300
const NodeCache = require('node-cache')
const cache = new NodeCache({ stdTTL: CACHE_TIMEOUT })

class Memcache {
  constructor (address) {
    this.requestTimeStamp = Date.now()
    this.address = address
    this.message = `${address}:${this.requestTimeStamp}:starRegistry`
  }

  get validationWindow () {
    const now = Date.now()
    const elapsed = Math.floor(now - this.requestTimeStamp) / 1000
    const remaining = CACHE_TIMEOUT - elapsed
    return remaining
  }

  validate (signature) {
    if (this.validationWindow <= 0) {
      return false
    }

    return bitcoinMessage.verify(this.message, this.address, signature)
  }

  toJSON () {
    return {
      'address': this.address,
      'requestTimeStamp': this.requestTimeStamp,
      'message': this.message,
      'validationWindow': this.validationWindow
    }
  }
}

Memcache.get = (address) => { return cache.get(address) }
Memcache.set = (address, memcache) => { cache.set(address, memcache) }
Memcache.del = (address) => { cache.del(address) }
Memcache.close = () => { cache.close() }

module.exports = Memcache
