var bitcoin = require('bitcoinjs-lib')
var bitcoinMessage = require('bitcoinjs-message')

class Memcache {
  constructor (address) {
    this.requestTimeStamp = Date.now()
    this.address = address
    this.message = `${address}:${this.requestTimeStamp}:starRegistry`
  }

  cacheTimeout () { return 300 }

  get validationWindow () {
    const now = Date.now()
    const elapsed = Math.floor(now - this.requestTimeStamp) / 1000
    const remaining = Memcache.cacheTimeout - elapsed
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

Memcache.cacheTimeout = 300

module.exports = Memcache
