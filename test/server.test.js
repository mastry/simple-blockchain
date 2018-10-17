const test = require('tape').test
const request = require('supertest')
const app = require('../server')

test('Server', async (t) => {
  const blockBody = 'this is the block data'
  request(app)
    .post('/block')
    .send(blockBody)
    .expect('Content-Type', 'application/json; charset=utf-8')
    .expect(200)
    .end((err, res) => {
      t.equals(err, null, '/block POST succeeds')
      t.equals(res.body.body, blockBody, '/block POST returns correct body')
    })

  request(app)
    .get('/block/0')
    .expect('Content-Type', 'application/json; charset=utf-8')
    .expect(200)
    .end((err, res) => {
      t.equals(err, null, '/block/0 succeeds')
      t.equals(res.body.body, 'Genesis Block', '/block/0 retrieves genesis block')
      t.equals(res.body.height, 0, '/block/0 block height is zero')
      t.equals(res.body.previousBlockHash, '0', '/block/0 previousBlockHash === 0')
      t.end()
    })
})