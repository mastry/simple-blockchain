const test = require('tape').test
const Simple = require('../simpleBlockchain')

const testBody = JSON.stringify({
  address: 'mrMxKH9Cz9r3WqMSEAJ5xtV9ayjER3mFZ8',
  star: {
    dec: "-16° 42' 58.0171''",
    ra: '6h 45m 8.91728s',
    story: '74686520646f672073746172',
    magnitude: null,
    constellation: '' }
})

test('Block', (t) => {
  let block = new Simple.Block(testBody)
  block.hash = '123'
  block.height = 123
  block.previousBlockHash = '222222222'
  block.time = '0999'

  const clone = Simple.Block.clone(block)

  t.equals(clone.data, block.data, 'Cloned data should be equal')
  t.equals(clone.hash, block.hash, 'Cloned hash should be equal')
  t.equals(clone.height, block.height, 'Cloned height should be equal')
  t.equals(clone.previousBlockHash, block.previousBlockHash, 'Cloned previousBlockHash should be equal')
  t.equals(clone.time, block.time, 'Cloned time should be equal')
  t.end()
})

test('Blockchain', async (t) => {
  try {
    const chain = Simple.Blockchain
    await chain.init()

    let block1 = await chain.addBlock(testBody)
    let height = await chain.getBlockHeight()
    t.equals(height > 0, true, 'Block height should be at least 1')

    let gBlock = await chain.getBlock(0)
    t.equals(gBlock.previousBlockHash, '', 'Genesis block previous block hash is empty')
    t.equals(gBlock.height, 0, 'Genesis block height is zero')
    t.equals(gBlock.body, 'Genesis Block', 'Genesis block body is correct')

    const block2 = await chain.addBlock(testBody)
    t.equals(block1.hash, block2.previousBlockHash, 'Hashes are chained properly')

    let newHeight = await chain.getBlockHeight()
    t.equals(newHeight - height, 1, 'Block height increases')

    const blockIsValid = chain.validateBlock(block2)
    t.equals(blockIsValid, true, 'Individual blocks validate')

    const result = await chain.validateChain()
    if (!result.isValid) {
      for (let e of result.error.chainErrors) {
        console.log(e)
      }
    }
    t.equals(result.isValid, true, 'Blockchain validates all blocks')

    t.end()
  } catch (e) {
    t.fail(e)
  } finally {
    await Simple.Blockchain.close()
  }
})
