// Create an in-memory cache that automatically deletes items after 5 minutes (300 seconds)
const NodeCache = require('node-cache')
const CACHE_TIMEOUT_SECONDS = 300
const cache = new NodeCache({ stdTTL: CACHE_TIMEOUT_SECONDS })

var bitcoin = require('bitcoinjs-lib')
var bitcoinMessage = require('bitcoinjs-message')

class Validator {
  constructor (address) {
    this.requestTimeStamp = Date.now()
    this.address = address
    this.message = `${address}:${this.requestTimeStamp}:starRegistry`
  }

  get validationWindow () {
    const now = Date.now()
    const elapsed = Math.floor(now - this.requestTimeStamp) / 1000
    const remaining = CACHE_TIMEOUT_SECONDS - elapsed
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
let _initialized = false

class StarRegistry {
  constructor () {
    if (!StarRegistry.instance) {
      this.simpleChain = require('./simple-blockchain')
      this.blockchain = new this.simpleChain.Blockchain()
      StarRegistry.instance = this
    }

    return StarRegistry.instance
  }

  async _init () {
    if (!_initialized) {
      await this.simpleChain.init()
      _initialized = true
    }
  }

  requestValidation (address) {
    return new Promise((resolve, reject) => {
      try {
        let validator = cache.get(address)
        if (validator === undefined) {
          validator = new Validator(address)
          cache.set(address, validator)
        }

        resolve(validator)
      } catch (e) {
        reject(e)
      }
    })
  }

  validate (address, signature) {
    return new Promise((resolve, reject) => {
      try {
        let validator = cache.get(address)
        if (validator === undefined) {
          reject(Error('Address not found. Use requestValidation to initiate a validation request.'))
        }

        const isValid = validator.validate(signature)

        const registration = {
          'registerStar': isValid,
          'status': {
            'address': validator.address,
            'requestTimeStamp': validator.requestTimeStamp,
            'message': validator.message,
            'validationWindow': validator.validationWindow,
            'messageSignature': isValid ? 'valid' : 'invalid'
          }
        }

        resolve(registration)
      } catch (e) {
        reject(e)
      }
    })
  }

  async register (address, ra, dec, story, magnitude = NaN, constellation = '') {
    try {
      await this._init()
      let validator = cache.get(address)
      if (validator === undefined) {
        throw Error('Address not found. Use requestValidation to initiate a validation request.')
      }

      if (validator.validationWindow <= 0) {
        throw Error(`Validation window has exppired for address ${address}`)
      }

      const starBlock = {
        address: validator.address,
        star: {
          dec: dec,
          ra: ra,
          story: Buffer.from(story).toString('hex'),
          magnitude: magnitude,
          constellation: constellation
        }
      }
      let block = new this.simpleChain.Block(JSON.stringify(starBlock))
      block = await this.blockchain.addBlock(block)
      return block
    } catch (e) {
      throw new StarRegistryError(e.message)
    }
  }

  async searchHash (hash) {
    try {
      await this._init()
      let block = null
      const height = await this.blockchain.getBlockHeight()
      for (let index = 1; index <= height; index++) {
        const b = await this.blockchain.getBlock(index)
        if (b.hash === hash) {
          block = b
          break
        }
      }

      return block
    } catch (e) {
      throw new StarRegistryError()
    }
  }

  async searchAddress (address) {
    try {
      await this._init()
      let blocks = []
      const height = await this.blockchain.getBlockHeight()
      for (let index = 1; index <= height; index++) {
        const block = await this.blockchain.getBlock(index)
        const body = JSON.parse(block.body)
        if (body.address === address) {
          blocks.push(block)
        }
      }

      return blocks
    } catch (e) {
      throw new StarRegistryError()
    }
  }

  async searchHeight (height) {
    try {
      await this._init()
      const block = await this.blockchain.getBlock(height)
      return block
    } catch (e) {
      throw new StarRegistryError()
    }
  }

  close () {
    cache.close()
    if (_initialized) {
      this.simpleChain.close()
    }
  }
}
const instance = new StarRegistry()
Object.freeze(instance)
module.exports = instance
