const test = require('tape').test
const request = require('supertest')
const app = require('../server')

var bitcoin = require('bitcoinjs-lib')
var bitcoinMessage = require('bitcoinjs-message')

test('Server', t => {
  const input = { body: 'this is the block data' }
  request(app)
    .post('/block')
    .send(input)
    .expect('Content-Type', 'application/json; charset=utf-8')
    .expect(200)
    .end((err, res) => {
      t.equals(err, null, '/block POST succeeds')
      t.equals(res.body.body, input.body, '/block POST returns correct body')
    })

  request(app)
    .get('/block/0')
    .expect('Content-Type', 'application/json; charset=utf-8')
    .expect(200)
    .end((err, res) => {
      t.equals(err, null, '/block/0 succeeds')
      t.equals(res.body.body, 'Genesis Block', '/block/0 retrieves genesis block')
      t.equals(res.body.height, 0, '/block/0 block height is zero')
      t.equals(res.body.previousBlockHash, '', '/block/0 previousBlockHash is empty')
    })

  request(app)
    .get('/block/-1')
    .expect('Content-Type', 'application/json; charset=utf-8')
    .expect(404)
    .end((err, res) => {
      t.equals(err, null, 'Invalid block height returns JSON 404 error')
      t.end()
    })
})

test('/requestValidation', t => {
  let body = { address: 1234567890 }
  request(app)
    .post('/requestValidation')
    .send(body)
    .expect('Content-Type', 'application/json; charset=utf-8')
    .expect(200)
    .end((err, res) => {
      t.equals(err, null, 'POST succeeds')
      t.equals(res.body.address, body.address, 'returns correct address')
      t.equals(res.body.requestTimeStamp > 0, true, 'returns a timestamp')
      t.equals(res.body.message, `${body.address}:${res.body.requestTimeStamp}:starRegistry`,
        'returns a valid message')
      t.equals(res.body.validationWindow > 0, true, 'returns a validation window')
      t.end()
    })
})

test('/message-signature/validate', async (t) => {
  // Generate a random key pair / address on testnet
  const keyPair = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet })
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: bitcoin.networks.testnet })

  // Sign the message and submit for validation
  const registry = require('../star-registry')
  const validation = await registry.requestValidation(address)
  var signature = bitcoinMessage.sign(validation.message, keyPair.privateKey, keyPair.compressed)

  let body = {
    'address': address,
    'signature': signature
  }

  request(app)
    .post('/message-signature/validate')
    .send(body)
    .expect('Content-Type', 'application/json; charset=utf-8')
    .expect(200)
    .end((err, res) => {
      t.equals(err, null, 'POST succeeds')
      t.equals(res.body.registerStar, true, 'signature validates')
      t.equals(res.body.status.address, address, 'returns correct address')
      t.equals(res.body.status.requestTimeStamp > 0, true, 'returns a timestamp')
      t.equals(res.body.status.message, `${body.address}:${res.body.status.requestTimeStamp}:starRegistry`,
        'returns a valid message')
      t.equals(res.body.status.validationWindow > 0, true, 'returns a validation window')
      t.equals(res.body.status.messageSignature, 'valid', 'signature is flagged as valid')
      t.end()
    })
})
