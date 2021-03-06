const controller = require('./starRegistry')
const config = require('./config')

const express = require('express')
const app = express()
const port = config.app.port

// Use body-parser for JSON parsing
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

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
    const block = await controller.searchHeight(blockHeight)
    res.status(200).json(block)
  } catch (err) {
    next(err)
  }
})

app.get('/stars/address::address', async (req, res, next) => {
  try {
    const blocks = await controller.searchAddress(req.params.address)
    res.status(200).json(blocks)
  } catch (err) {
    next(err)
  }
})

app.get('/stars/hash::hash', async (req, res, next) => {
  try {
    const blocks = await controller.searchHash(req.params.hash)
    res.status(200).json(blocks)
  } catch (err) {
    next(err)
  }
})

app.post('/block', async (req, res, next) => {
  try {
    if (!req.body || req.body === '') {
      res.status(400).json({ error: 'Empty block. Try including some data in the Block body.' })
    } else {
      const address = req.body.address
      const star = req.body.star
      const block = await controller.register(
        address,
        star.ra,
        star.dec,
        star.story,
        star.magnitude || NaN,
        star.constellation || '')
      res.status(200).json(block)
    }
  } catch (err) {
    next(err)
  }
})

// Error handling
app.use((err, request, response, next) => {
  console.log(err)
  if (err.notFound) {
    response.status(404).json('The requested block was not found.')
  } else {
    response.status(500).json({ error: err.message })
  }
})

if (require.main === module) {
  app.listen(port, async () => {
    console.log(`Listening on port ${port}`)
  })
}

module.exports = app // For testing only
