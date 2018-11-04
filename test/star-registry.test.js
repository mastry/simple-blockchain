const test = require('tape').test
const registry = require('../star-registry')

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

test('requestValidation', async (t) => {
  let result = await registry.requestValidation('abc123')
  t.equals('abc123', result.address, 'Registered address is correct')
  t.equals(true, result.requestTimeStamp <= Date.now(), 'Timestamp is reasonable')
  t.equals(true, result.validationWindow <= 300, 'Initial validation window is <= 300 seconds')
  t.equals(`abc123:${result.requestTimeStamp}:starRegistry`, result.message, 'Message is formatted correctly')

  // Additional validation requests with same address should just return remaining time
  const result1 = (await registry.requestValidation('abc123')).validationWindow
  await sleep(1000)
  const result2 = (await registry.requestValidation('abc123')).validationWindow
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
    const validation = await registry.requestValidation(address)
    var signature = bitcoinMessage.sign(validation.message, keyPair.privateKey, keyPair.compressed)
    let isValid = (await registry.validate(address, signature)).registerStar
    t.equals(isValid, true, 'Valid signatures validate')

    // Register the star
    const story = 'Found star using https://www.google.com/sky/'
    const result = await registry.register(address, '16h 29m 1.0s', '-26° 29\' 24.9', story)
    const block = JSON.parse(result.body)
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
    const validation = await registry.requestValidation(address)
    var signature = bitcoinMessage.sign(validation.message, keyPair.privateKey, keyPair.compressed)
    await registry.validate(address, signature)

    // Register the star
    const story = 'Found star using https://www.google.com/sky/'
    const result = await registry.register(address, '16h 29m 1.0s', '-26° 29\' 24.9', story)

    // Search by address
    const addressBlocks = await registry.searchAddress(address)
    t.equals(addressBlocks.length, 1, 'Finds match by address')
    t.equals(addressBlocks[0].hash === result.hash, true, 'Finds correct block by address')

    // Search by hash
    const hashBlock = await registry.searchHash(result.hash)
    t.equals(hashBlock.hash === result.hash, true, 'Finds correct match by hash')

    // Search by height
    const heightBlock = await registry.searchHeight(result.height)
    t.equals(heightBlock.hash === result.hash, true, 'Finds correct match by height')
  } catch (e) {
    t.fail(e.message, e)
  } finally {
    registry.close()
    t.end()
  }
})
