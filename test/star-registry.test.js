const test = require('tape').test

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

test('requestValidation', async (t) => {
  const registry = require('../star-registry')
  let result = registry.requestValidation('abc123')
  t.equals('abc123', result.response.address, 'Registered address is correct')
  t.equals(true, result.response.requestTimeStamp <= Date.now(), 'Timestamp is reasonable')
  t.equals(true, result.response.validationWindow <= 300, 'Initial validation window is <= 300 seconds')
  t.equals(`abc123:${result.response.requestTimeStamp}:starRegistry`, result.response.message, 'Message is formatted correctly')

  // Additional validation requests with same address should just return remaining time
  const result1 = registry.requestValidation('abc123').response.validationWindow
  await sleep(1000)
  const result2 = registry.requestValidation('abc123').response.validationWindow
  t.equals(true, result2 < result1, 'Validation window shrinks')
  registry.close()
  t.end()
})

test('validate', async (t) => {
  try {
    var bitcoin = require('bitcoinjs-lib')
    var bitcoinMessage = require('bitcoinjs-message')

    // Generate a random key pair / address on testnet
    const keyPair = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet })
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: bitcoin.networks.testnet })

    // Sign the message and submit for validation
    const registry = require('../star-registry')
    const validation = registry.requestValidation(address)
    var signature = bitcoinMessage.sign(validation.response.message, keyPair.privateKey, keyPair.compressed)
    let isValid = registry.validate(address, signature).response.registerStar
    t.equals(isValid, true, 'Valid signatures validate')

    // Register the star
    const story = 'Found star using https://www.google.com/sky/'
    const result = await registry.register(address, '16h 29m 1.0s', '-26° 29\' 24.9', story)
    const block = JSON.parse(result.response.body)
    t.equals(block.address, address, 'Registration address is correct')
    t.equals(block.star.ra, '16h 29m 1.0s', 'Right ascension is correct')
    t.equals(block.star.dec, '-26° 29\' 24.9', 'Declination is correct')
    t.equals(Buffer.from(block.star.story, 'hex').toString(), story, 'Story is correct')
  } catch (e) {
    t.fail(e.message, e)
  } finally {
    t.end()
  }
})

test('search', async (t) => {
  try {
    var bitcoin = require('bitcoinjs-lib')
    var bitcoinMessage = require('bitcoinjs-message')

    // Generate a random key pair / address on testnet
    const keyPair = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet })
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: bitcoin.networks.testnet })

    // Sign the message and submit for validation
    const registry = require('../star-registry')
    const validation = registry.requestValidation(address)
    var signature = bitcoinMessage.sign(validation.response.message, keyPair.privateKey, keyPair.compressed)
    let isValid = registry.validate(address, signature).response.registerStar

    // Register the star
    const story = 'Found star using https://www.google.com/sky/'
    const result = await registry.register(address, '16h 29m 1.0s', '-26° 29\' 24.9', story)

    // Search by address
    const addressBlocks = await registry.searchAddress(address)
    t.equals(addressBlocks.response.length, 1, 'Finds match by address')
    t.equals(addressBlocks.response[0].hash === result.response.hash, true, 'Finds correct block by address')

    // Search by hash
    const hashBlock = await registry.searchHash(result.response.hash)
    t.equals(hashBlock.response.hash === result.response.hash, true, 'Finds correct match by hash')

    // Search by height
    const heightBlock = await registry.searchHeight(result.response.height)
    t.equals(heightBlock.response.hash === result.response.hash, true, 'Finds correct match by height')
  } catch (e) {
    console.log(`ERROR: ${e}`)
  } finally {
    t.end()
  }
})
