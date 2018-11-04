const simpleChain = require('./simple-blockchain')
const chain = new simpleChain.Blockchain()

const controller = require('./star-registry')

const express = require('express')
const app = express()
const port = 8000

// Use body-parser for JSON parsing
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Error handling
app.use((err, request, response, next) => {
  console.log(err)
  response.status(500).send(err.message)
})

app.post('/requestValidation', (req, res, next) => {
  controller.requestValidation(req.body.address)
    .then(response => {
      res.status(200).json(response)
    })
    .catch(next)
})

app.post('/message-signature/validate', async (req, res, next) => {
  controller.validate(req.body.address, req.body.signature)
    .then(response => {
      res.status(200).json(response)
    })
    .catch(next)
})

app.get('/block/:blockHeight', async (req, res, next) => {
  try {
    const blockHeight = parseInt(req.params.blockHeight)
    const block = await chain.getBlock(blockHeight)
    res.status(200).json(block)
  } catch (err) {
    if (err.notFound) {
      res.status(404).json('Block not found')
    } else {
      res.status(500).json({ error: err.toString() })
    }
  }
})

app.get('/stars/address::address', async (req, res, next) => {
  try {
    const blocks = await controller.searchAddress(req.params.address)
    res.status(200).json(blocks)
  } catch (err) {
    if (err.notFound) {
      res.status(404).json('Block not found')
    } else {
      res.status(500).json({ error: err.toString() })
    }
  }
})

app.post('/block', async (req, res, next) => {
  try {
    const blockBody = req.body
    if (!blockBody || blockBody === '') {
      res.status(400).json({ error: 'Empty block. Try including some data in the Block body.' })
    } else {
      let block = new simpleChain.Block(blockBody)
      block = await chain.addBlock(block)
      res.status(200).json(block)
    }
  } catch (err) {
    res.status(500).json({ error: err.toString() })
  }
})

simpleChain.init()
  .then(() => {
    if (require.main === module) {
      app.listen(port, async () => {
        console.log(`Listening on port ${port}`)
      })
    }
  })
  .catch(err => {
    console.log(err)
  })

module.exports = app // For testing only
