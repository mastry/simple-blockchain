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

test('validate', (t) => {
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
  t.end()
})
