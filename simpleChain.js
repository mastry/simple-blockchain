const SHA256 = require('crypto-js/sha256');
const level = require('level');

let db = null; // You must call the init() method before using the module!


//-- Internal helper function
// Computes the SHA256 hash of a block
function computeHash(block) {
  return SHA256(JSON.stringify(block)).toString();
}

//-- Internal helper function
// Creates a genesis block
function createGenesisBlock() {
  let block = new Block('Genesis Block');
  block.time = getTime();
  block.previousBlockHash = "0";
  block.hash = computeHash(block);
  return block;
}

//-- Internal helper function
// Returns the current time formatted for Blocks
function getTime() {
  return new Date().getTime().toString().slice(0, -3);
}


/**
 * Block encapsulates the properties for a 
 * single block in a Blockchain. 
 */
class Block {
  /**
   * Creates a new block for use in a Blockchain
   * @param  {string} data
   * The data to store in the Block.
   * 
   * @example 
   * let block = new Block('data to be stored in block')
   */
  constructor(data) {
    this.hash = "",
      this.height = 0,
      this.body = data,
      this.time = 0,
      this.previousBlockHash = ""
  }

  /**
   * Converts a Block to a JSON string.
   * @param {Block} block 
   * The Block to convert to JSON
   */
  static toJSON(block) {
    return JSON.stringify(block);
  }

  /**
   * Creates a Block from a JSON string.
   * @param {string} json 
   * The JSON representation of a Block.
   */
  static fromJSON(json) {
    return Block.clone(JSON.parse(json));
  }

  /**
   * Creates a copy of a Block.
   * @param {Block} source 
   * The Block object to copy.
   */
  static clone(source) {
    let block = new Block();
    block.hash = source.hash,
      block.height = source.height,
      block.body = source.body,
      block.time = source.time,
      block.previousBlockHash = source.previousBlockHash

    return block;
  }
}

/**
 * Blockchain represents a simple blockchain with
 * a collection of Blocks, methods to add new blocks and verify the chain.
 */
class Blockchain {
  /**
   * Create a new block chain
   * 
   * @example
   * let chain = new Blockchain();
   * chain.addBlock(new Block('some data'));
   * chain.verifyChain();
   */
  constructor() {
  }

  /**
   * Add a new Block to the blockchain. All properties except 'body'
   * will be calculated before adding the Block to the blockchain. 
   * 
   * If a genesis block does not exist yet, one will be added before the
   * new Block is added.
   * @param  {Block} newBlock
   * The Block to add to the chain. The body property should already
   * have the desired value (changing it later will invalidate the Blockchain).
   * 
   * @example
   * const SimpleChain = require('./simpleChain');
   * 
   * await SimpleChain.init(); //-- IMPORTANT!
   * 
   * const chain = new SimpleChain.Blockchain();
   * 
   * let block = new Block('some data');
   * chain.addBlock(block);
   * console.log(block);
   * 
   * await SimpleChain.close(); //-- IMPORTANT!
   */
  async addBlock(newBlock) {
    try {
      let currentHeight = await this.getBlockHeight();

      // Add a genesis block if we don't already have one
      if (currentHeight < 0) {
        currentHeight = 0;
        const genesisBlock = createGenesisBlock();
        await db.put(currentHeight, Block.toJSON(genesisBlock));
        await db.put("height", 0);
      }

      newBlock.height = currentHeight + 1;
      const prevBlock = await this.getBlock(currentHeight);
      newBlock.previousBlockHash = prevBlock.hash;
      newBlock.time = getTime();
      newBlock.hash = computeHash(newBlock);

      // Save the new block to the data store
      await db.put(newBlock.height, Block.toJSON(newBlock));
      await db.put("height", newBlock.height);
    }
    catch (error) {
      console.error("Blockchain.addBlock failed.", error)
    }
  }


  /**
   * Get current block height in the chain.
   */
  async getBlockHeight() {
    try {
      let height = await db.get("height");
      return parseInt(height, 10);
    }
    catch (err) {
      if (err.notFound) {
        return -1;
      }
      else {
        throw err;
      }
    }
  }


  /**
   * Gets the block from the data store with the specified height
   * throws an error if a block with blockHeight does not exist
   * @param  {int} blockHeight
   * The height of the block to retrieve. Block heights start at zero.
   */
  async getBlock(blockHeight) {
    try {
      let json = await db.get(blockHeight);
      return Block.fromJSON(json);
    }
    catch (error) {
      console.error(`Blockchain.getBlock(${blockHeight}) failed. ${error}`)
      throw error;
    }
  }


  /**
   * Validates a single Block. Confirms that the hash property contains 
   * the correct hash for the Block's current state.
   * @param  {Block} block
   * The block to validate.
   */
  validateBlock(block) {
    // clone the block so we can safely remove the hash
    const clone = Block.clone(block);
    // get block hash
    let blockHash = clone.hash;
    // remove block hash to test block integrity
    clone.hash = "";
    clone.hash = computeHash(clone);

    // Compare
    if (blockHash === clone.hash) {
      return true;
    }
    else {
      console.log(
        `Block #${block.height} invalid hash: ${blockHash} <> ${clone.hash}`
      );
      return false;
    }
  }


  /**
   * Validates the entire block chain. Calls validateBlock on every block
   * in the chain and confirms that previousBlockHash contains the 
   * correct has for the previous block in the chain.
   * @returns {ValidationResult} 
   * 
   * @example
   * const SimpleChain = require('./simpleChain');
   * 
   * await SimpleChain.init();  //-- IMPORTANT!
   * 
   * const chain = new SimpleChain.Blockchain();
   * 
   * // ... add blocks here ...
   * 
   * const result = await chain.validateChain();
   * if( result.isValid ) {
   *    console.log("All systems go.")
   * } else {
   *    console.log("Uh oh...")
   *    for( let err of result.error.chainErrors ) {
   *        consol.log(err);
   *    } 
   * }
   * 
   * await SimpleChain.close(); //-- IMPORTANT!
   */
  async validateChain() {
    
    const promise = new Promise((resolve, reject) => {
      
      let stream = db.createReadStream();
      const errorLog = new Set();
        
      stream.on('data', async (data) => {
          
          if (data.key != "height") { // skip our height indicator

            // Validate the individual block
            const block = Block.fromJSON(data.value);
            if (!this.validateBlock(block)) {
              errorLog.add(`Block ${block.height} is invalid`);
            }

            // Ensure this block has the correct hash for the previous block
            if(block.height > 0) {
              let previousBlock = await this.getBlock(block.height-1);
              if( block.previousBlockHash != previousBlock.hash) {
                errorLog.add(`Block ${block.height} - previous hash is invalid.`);
              }
            }
          }
        })
        .on('error', err => {
          reject(err);
        })
        .on('close', () => {
          if( errorLog.size == 0 ) {
            resolve(new ValidationResult(true, null));
          }
          else {
            resolve(
              new ValidationResult(
                false, 
                new ValidationError(errorLog)
              )
            );
          }
        })
    })

    return promise;
  }
}

class ValidationResult {
  constructor(isValid, error) {
    this.isValid = isValid;
    this.error = error;
  }
}

class ValidationError extends Error {
  constructor(chainErrors, ...args) {
      super(...args);
      Error.captureStackTrace(this, ValidationError);

      this._chainErrors = chainErrors;
  }

  /**
   * A Set of error messages for the blockchain
   * 
   * @example
   * for (let e of err.chainError) {
   *    console.log(e)
   * }
   */
  get chainErrors() {
    return this._chainErrors;
  }
}

module.exports = {
  Block: Block,
  Blockchain: Blockchain,
  ValidataionResult: ValidationResult,
  ValidationError, ValidationError,
  init: async function () { db = await level('./db') },
  close: async function () { await db.close() }
}

