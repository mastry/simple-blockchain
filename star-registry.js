// Create an in-memory cache that automatically deletes items after 5 minutes (330 seconds)
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
}

exports.requestValidation = (address) => {
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

exports.validate = (address, signature) => {
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
          'requestTimeStamp': validator.startTime,
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

exports.register = async (address, ra, dec, story) => {
  let validator = cache.get(address)
  if (validator === undefined) {
    throw Error('Address not found. Use requestValidation to initiate a validation request.')
  }

  if (validator.validationWindow <= 0) {
    throw Error(`Validation window has exppired for address ${address}`)
  }

  const SimpleChain = require('./simple-blockchain')
  await SimpleChain.init()

  const starBlock = {
    address: validator.address,
    star: {
      dec: dec,
      ra: ra,
      story: Buffer.from(story).toString('hex')
    }
  }
  const chain = new SimpleChain.Blockchain()
  let block = new SimpleChain.Block(JSON.stringify(starBlock))
  block = await chain.addBlock(block)

  await SimpleChain.close()

  return { err: null, response: block }
}

exports.searchHash = async (hash) => {
  try {
    let block = null
    const SimpleChain = require('./simple-blockchain')
    await SimpleChain.init()
    const chain = new SimpleChain.Blockchain()
    const height = await chain.getBlockHeight()
    for (let index = 1; index <= height; index++) {
      const b = await chain.getBlock(index)
      if (b.hash === hash) {
        block = b
        break
      }
    }

    await SimpleChain.close()

    return { err: null, response: block }
  } catch (e) {
    return { err: e, response: null }
  }
}

exports.searchAddress = async (address) => {
  let blocks = []
  const SimpleChain = require('./simple-blockchain')
  await SimpleChain.init()
  const chain = new SimpleChain.Blockchain()
  for (let index = 1; index <= await chain.getBlockHeight(); index++) {
    const block = await chain.getBlock(index)
    const body = JSON.parse(block.body)
    if (body.address === address) {
      blocks.push(block)
    }
  }

  await SimpleChain.close()

  return { err: null, response: blocks }
}

exports.searchHeight = async (height) => {
  const SimpleChain = require('./simple-blockchain')
  await SimpleChain.init()
  const chain = new SimpleChain.Blockchain()
  const block = await chain.getBlock(height)
  await SimpleChain.close()

  return { err: null, response: block }
}

exports.close = () => {
  cache.close()
}
