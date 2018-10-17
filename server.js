const simpleChain = require('./simple-blockchain')
const chain = new simpleChain.Blockchain()

const express = require('express')
const app = express()
const port = 8000

// Parses the body of a POST as raw UTF8 text
let rawTextParser = (req, res, next) => {
  req.setEncoding('utf8')
  req.rawBody = ''
  req.on('data', chunk => {
    req.rawBody += chunk
  })
  req.on('end', () => {
    next()
  })
}

app.use(rawTextParser)

app.get('/get/:blockHeight', async (req, res, next) => {
  try {
    const blockHeight = parseInt(req.params.blockHeight)
    const block = await chain.getBlock(blockHeight)
    res.status(200).send(block)
  } catch (err) {
    if (err.notFound) {
      res.status(404).send('Block not found')
    } else {
      next(err)
    }
  }
})

app.post('/block', async (req, res, next) => {
  try {
    if (!req.rawBody || req.rawBody === '') {
      res.status(400).send('Empty block. Try including some data in the Block body.')
    } else {
      let block = new simpleChain.Block(req.rawBody)
      block = await chain.addBlock(block)
      res.setHeader('Content-Type', 'application/json')
      res.status(200).send(block)
    }
  } catch (err) {
    next(err)
  }
})

simpleChain.init()
  .then(() => {
    if (require.main === module) {
      app.listen(port, async () => {
        await simpleChain.init()
        console.log(`Listening on port ${port}`)
      })
    }
  })
  .catch(err => {
    console.log(err)
  })

module.exports = app // For testing only
