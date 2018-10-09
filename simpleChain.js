const SHA256 = require('crypto-js/sha256');
const level = require('level');
let db = null;


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
    return JSON.stringify(block).toString();
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
   * let block = new Block('some data');
   * blockChain.addBlock(block);
   * console.log(block);
   */
  async addBlock(newBlock) {
    try {
      let currentHeight = await this.getBlockHeight();

      // Add a genesis block if we don't already have one
      if (currentHeight < 0) {
        currentHeight = 0;
        const genesisBlock = createGenesisBlock();
        await db.put(currentHeight, Block.toJSON(genesisBlock));
      }

      newBlock.height = currentHeight + 1;
      const prevBlock = await this.getBlock(currentHeight);
      newBlock.previousBlockHash = prevBlock.hash;
      newBlock.time = getTime();
      newBlock.hash = computeHash(newBlock);

      // Save the new block to the data store
      await db.put(newBlock.height, Block.toJSON(newBlock));
    }
    catch (error) {
      console.error("Blockchain.addBlock failed.", error)
    }
  }


  /**
   * Get current block height in the chain.
   */
  async getBlockHeight() {
    
    let i = -1;
    // an ugly hack to get the current block heigth,
    // but I couldn't get createReadStream to work (for some reason)
    while(true) {
        try {
            let _ = await db.get(i+1);
            ++i;
        }
        catch (err) {
          if( err.type == 'NotFoundError') {
              break; // no more entries in the database
          }
          else {
              throw err;
          }
      }
    }

    return i;
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
   */
  validateChain() {
    const errorLog = new Set();
    let previousBlock = null;

    db.createValueStream()
    
    .on('error', err => {
      console.log('Unable to read key stream!', err)
    })

    .on('close', () => {
      if (errorLog.length != 0) {
        console.error("The chain is invalid:");
        for (let e of errorLog) {
          console.error(e);
        }
      }
    })

    .on('data', currentBlock => {
      // Validate the individual block
      const block = Block.fromJSON(currentBlock);
      if (!this.validateBlock(block)) {
        errorLog.add(`Block ${block.height} is invalid`);
      }

      // Ensure this block has the correct hash for the previous block
      if (previousBlock) {
        if (block.previousBlockHash != previousBlock.hash) {
          errorLog.add(`Block ${block.height} - invalid previousBlockHash.`);
        }
      }
    });

    return errorLog.size === 0;
  }
}

module.exports = {
  Block: Block,
  Blockchain: Blockchain,
  init: async function () { db = await level('./db')},
  close : async function() {await db.close()}
}
