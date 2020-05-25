const Blockchain = require("./blockchain");

const blockchain = new Blockchain();
blockchain.addBlock({data:'foo'});
let prevTS, nextTS, nextBlock, timeDiff, average;
let times = [];
for(let i=0;i<10000;++i)
{
    prevTS = blockchain.chain[blockchain.chain.length-1].timestamp;
    blockchain.addBlock({data: `Block ${i}`});
    nextBlock = blockchain.chain[blockchain.chain.length-1];
    nextTS = nextBlock.timestamp;
    timeDiff = nextTS-prevTS;
    times.push(timeDiff);
    average = times.reduce((sum,val)=>(sum+val))/times.length;
    console.log(`Time to mine block ${timeDiff} ms. Difficulty: ${nextBlock.difficulty}. Avg time: ${average} ms`);
}