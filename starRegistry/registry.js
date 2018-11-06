const Memcache = require('./memcache')
const StarRegistryError = require('./starRegistryError')

let _initialized = false

class StarRegistry {
  constructor () {
    if (!StarRegistry.instance) {
      this.simple = require('../simpleBlockchain')
      this.blockchain = this.simple.Blockchain
      StarRegistry.instance = this
    }

    return StarRegistry.instance
  }

  async _init () {
    if (!_initialized) {
      await this.blockchain.init()
      _initialized = true
    }
  }

  requestValidation (address) {
    return new Promise((resolve, reject) => {
      try {
        let memcache = Memcache.get(address)
        if (memcache === undefined) {
          memcache = new Memcache(address)
          Memcache.set(address, memcache)
        }

        resolve(memcache)
      } catch (e) {
        reject(e)
      }
    })
  }

  validate (address, signature) {
    return new Promise((resolve, reject) => {
      try {
        let memcache = Memcache.get(address)
        if (memcache === undefined) {
          reject(Error('Address not found. Use requestValidation to initiate a validation request.'))
        }

        const isValid = memcache.validate(signature)

        const registration = {
          'registerStar': isValid,
          'status': {
            'address': memcache.address,
            'requestTimeStamp': memcache.requestTimeStamp,
            'message': memcache.message,
            'validationWindow': memcache.validationWindow,
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
      let memcache = Memcache.get(address)
      if (memcache === undefined) {
        throw Error('Address not found. Use requestValidation to initiate a validation request.')
      }

      if (memcache.validationWindow <= 0) {
        throw Error(`Validation window has exppired for address ${address}`)
      }

      const starBlock = {
        address: memcache.address,
        star: {
          dec: dec,
          ra: ra,
          story: Buffer.from(story).toString('hex'),
          magnitude: magnitude,
          constellation: constellation
        }
      }
      const data = JSON.stringify(starBlock)
      const block = await this.blockchain.addBlock(data)
      Memcache.del(address) // Ensure only one star can be registered at a time
      return block
    } catch (e) {
      throw new StarRegistryError(`register: ${e.toString()}`)
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
      throw new StarRegistryError(`searchHash: ${hash}`)
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
      throw new StarRegistryError(`searchAddress ${address}: ${e.toString()}`)
    }
  }

  async searchHeight (height) {
    try {
      await this._init()
      const block = await this.blockchain.getBlock(height)
      return block
    } catch (e) {
      throw new StarRegistryError(`searchHeight: ${height}`)
    }
  }

  async close () {
    Memcache.close()
    if (_initialized) {
      await this.blockchain.close()
    }
  }
}
const instance = new StarRegistry()
Object.freeze(instance)
module.exports = instance
