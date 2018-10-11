const test = require('tape').test;
const SimpleChain = require('../simpleChain');


test('Block', (t) => {
    let block = new SimpleChain.Block("test");
    block.hash = "123";
    block.height = 123;
    block.previousBlockHash = "222222222";
    block.time = "0999";
    
    const clone = SimpleChain.Block.clone(block);

    t.equals(clone.data, block.data, 'Cloned data should be equal');
    t.equals(clone.hash, block.hash, 'Cloned hash should be equal');
    t.equals(clone.height, block.height, 'Cloned height should be equal');
    t.equals(clone.previousBlockHash, block.previousBlockHash, 'Cloned previousBlockHash should be equal');
    t.equals(clone.time, block.time, 'Cloned time should be equal');
    t.end();
})

test('Blockchain', async (t) => {
    await SimpleChain.init();
    const chain = new SimpleChain.Blockchain();


    let block1 = new SimpleChain.Block("test");
    await chain.addBlock(block1);
    let height = await chain.getBlockHeight();
    t.equals(height > 0, true, 'Block height should be at least 1')

    let gBlock = await chain.getBlock(0);
    t.equals(gBlock.previousBlockHash, "0", 'Genesis block previous block hash is 0');
    t.equals(gBlock.height, 0, 'Genesis block height is zero');
    t.equals(gBlock.body, "Genesis Block", 'Genesis block body is correct');

    let block2 = new SimpleChain.Block('another test');
    await chain.addBlock(block2);
    t.equals(block1.hash, block2.previousBlockHash, 'Hashes are chained properly');
    
    let newHeight = await chain.getBlockHeight();
    t.equals(newHeight - height, 1, 'Block height increases');

    const blockIsValid = chain.validateBlock(block2);
    t.equals(blockIsValid, true, 'Individual blocks validate')

    const result = await chain.validateChain();
    if(!result.isValid) {
        for (let e of result.error.chainErrors) {
            console.log(e);
        }
    }
    t.equals(result.isValid, true, 'Blockchain validates all blocks');

    await SimpleChain.close();
    t.end();
})
