const test = require('tape').test
const request = require('supertest')
const app = require('../server')

var bitcoin = require('bitcoinjs-lib')
var bitcoinMessage = require('bitcoinjs-message')

test('Star Registry Server', async (t) => {
  // Generate a random key pair / address on testnet
  const keyPair = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet })
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: bitcoin.networks.testnet })

  let reqValidation
  let signature
  let starBlock

  request(app)
    .post('/requestValidation')
    .send({ address: address })
    .expect('Content-Type', 'application/json; charset=utf-8')
    .expect(200)
    .then(res => {
      t.equals(res.body.address, address, 'requestValidation returns correct address')
      t.equals(res.body.requestTimeStamp > 0, true, 'requestValidation returns a timestamp')
      t.equals(res.body.message, `${address}:${res.body.requestTimeStamp}:starRegistry`,
        'requestValidation returns a valid message')
      t.equals(res.body.validationWindow > 0, true, 'requestValidation returns a validation window')
      reqValidation = res.body
      signature = bitcoinMessage.sign(reqValidation.message, keyPair.privateKey, keyPair.compressed)
    })
    .then(() => {
      // Sign the message and submit for validation
      request(app)
        .post('/message-signature/validate')
        .send({ 'address': address, 'signature': signature })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200)
        .then(res => {
          t.equals(res.body.registerStar, true, 'signature validates')
          t.equals(res.body.status.address, address, 'returns correct address')
          t.equals(res.body.status.requestTimeStamp > 0, true, 'returns a timestamp')
          t.equals(res.body.status.message, `${address}:${res.body.status.requestTimeStamp}:starRegistry`,
            'returns a valid message')
          t.equals(res.body.status.validationWindow > 0, true, 'returns a validation window')
          t.equals(res.body.status.messageSignature, 'valid', 'signature is flagged as valid')
        })
    })
    .then(() => {
      // Register a star
      const ra = '6h 45m 8.91728s'
      const dec = '-16° 42\' 58.0171\'\''
      const story = 'the dog star'
      request(app)
        .post('/block')
        .send({
          address: address,
          star: {
            ra: ra,
            dec: dec,
            story: story }
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200)
        .then(res => {
          const body = JSON.parse(res.body.body)
          t.equals(body.address, address, 'registration returns correct address')
          t.equals(res.body.height > 0, true, 'registration returns height')
          t.equals(res.body.hash.length > 0, true, 'registration returns hash')
          t.equals(res.body.previousBlockHash.length > 0, true, 'registration returns previousBlockHash')
          t.equals(res.body.time > 0, true, 'registration returns time')
          starBlock = res.body
        })
        .then(() => {
          // Search by address
          request(app)
            .get(`/stars/address:${address}`)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .then(res => {
              t.equals(res.body[0].hash, starBlock.hash, 'search by address')
            })
        })
    })
    .catch(e => {
      console.log(e)
      t.end()
    })
    .finally(() => { t.end() })
})
