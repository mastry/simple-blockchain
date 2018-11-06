const config = require('../config')
const Block = require('./block')

const SHA256 = require('crypto-js/sha256')
const level = require('level')
const ValidationError = require('./validationError')
const ValidationResult = require('./validationResult')

let db = null // You must call the init() method before using the module!

// -- Internal helper function
// Computes the SHA256 hash of a block
function computeHash (block) {
  return SHA256(JSON.stringify(block)).toString()
}

// -- Internal helper function
// Creates a genesis block
function createGenesisBlock () {
  let block = new Block('Genesis Block')
  block.time = getTime()
  block.previousBlockHash = ''
  block.hash = computeHash(block)
  return block
}

// -- Internal helper function
// Returns the current time formatted for Blocks
function getTime () {
  return new Date().getTime().toString().slice(0, -3)
}

module.exports.addBlock = async (data) => {
  try {
    let currentHeight = await this.getBlockHeight()

    if (currentHeight === -1) { throw Error('Genesis block does not exist!') }

    let newBlock = new Block(data)

    newBlock.height = currentHeight + 1
    const prevBlock = await this.getBlock(currentHeight)
    newBlock.previousBlockHash = prevBlock.hash
    newBlock.time = getTime()
    newBlock.hash = computeHash(newBlock)

    // Save the new block to the data store
    await db.put(newBlock.height, Block.toJSON(newBlock))
    await db.put('height', newBlock.height)

    return await this.getBlock(newBlock.height)
  } catch (error) {
    console.error('Blockchain.addBlock failed.', error)
  }
}

module.exports.getBlockHeight = async () => {
  try {
    let height = await db.get('height')
    return parseInt(height, 10)
  } catch (err) {
    if (err.notFound) {
      return -1
    } else {
      throw err
    }
  }
}

module.exports.getBlock = async (blockHeight) => {
  try {
    let json = await db.get(blockHeight)
    return Block.fromJSON(json)
  } catch (error) {
    console.error(`Blockchain.getBlock(${blockHeight}) failed. ${error}`)
    throw error
  }
}

module.exports.validateBlock = (block) => {
  // clone the block so we can safely remove the hash
  const clone = Block.clone(block)
  // get block hash
  let blockHash = clone.hash
  // remove block hash to test block integrity
  clone.hash = ''
  clone.hash = computeHash(clone)

  // Compare
  if (blockHash === clone.hash) {
    return true
  } else {
    console.log(
      `Block #${block.height} invalid hash: ${blockHash} <> ${clone.hash}`
    )
    return false
  }
}

module.exports.validateChain = async () => {
  const promise = new Promise((resolve, reject) => {
    const errorLog = new Set()

    let stream = db.createReadStream()
    stream.on('data', async (data) => {
      if (data.key !== 'height') { // skip our height indicator
      // Validate the individual block
        const block = Block.fromJSON(data.value)
        if (!this.validateBlock(block)) {
          errorLog.add(`Block ${block.height} is invalid`)
        }

        // Ensure this block has the correct hash for the previous block
        if (block.height > 0) {
          let previousBlock = await this.getBlock(block.height - 1)
          if (block.previousBlockHash !== previousBlock.hash) {
            errorLog.add(`Block ${block.height} - previous hash is invalid.`)
          }
        }
      }
    })
      .on('error', err => {
        reject(err)
      })
      .on('close', () => {
        if (errorLog.size === 0) {
          resolve(new ValidationResult(true, null))
        } else {
          resolve(
            new ValidationResult(
              false,
              new ValidationError(errorLog)
            )
          )
        }
      })
  })

  return promise
}

module.exports.init = async () => {
  try {
    if (db == null) {
      db = await level(config.blockchain.dbFolder)

      // this will throw err.notFound if there is no genesis block
      await db.get(0)
    }
  } catch (err) {
    if (err.notFound) {
    // Genesis block not found so add one
      const genesisBlock = createGenesisBlock()
      await db.put(0, Block.toJSON(genesisBlock))
      await db.put('height', 0)
    } else {
      throw err
    }
  }
}

module.exports.close = async () => { await db.close() }
