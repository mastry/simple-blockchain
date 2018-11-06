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
  constructor (data) {
    this.hash = ''
    this.height = 0
    this.body = data
    this.time = 0
    this.previousBlockHash = ''
  }

  /**
   * Converts a Block to a JSON string.
   * @param {Block} block
   * The Block to convert to JSON
   */
  static toJSON (block) {
    return JSON.stringify(block)
  }

  /**
   * Creates a Block from a JSON string.
   * @param {string} json
   * The JSON representation of a Block.
   */
  static fromJSON (json) {
    return Block.clone(JSON.parse(json))
  }

  /**
   * Creates a copy of a Block.
   * @param {Block} source
   * The Block object to copy.
   */
  static clone (source) {
    let block = new Block()
    block.hash = source.hash
    block.height = source.height
    block.body = source.body
    block.time = source.time
    block.previousBlockHash = source.previousBlockHash

    return block
  }
}

module.exports = Block
