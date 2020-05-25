const {GENESIS_DATA,MINE_RATE} = require("./config");
const {cryptoHash} = require('./crypto-hash');
const hexToBinary = require('hex-to-binary');
class Block
{
    constructor({timestamp,lastHash,hash,data,difficulty, nonce}) {
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty;
    }

    static genesis()
    {
        return new Block(GENESIS_DATA);
    }
    static mineBlock({lastBlock,data})
    {
        const lastHash = lastBlock.hash;
        let difficulty = lastBlock.difficulty;
        let nonce = 0;
        let hash,timestamp,binhash;
        do
        {
            timestamp=Date.now();
            nonce++;
            difficulty = Block.adjustDifficulty({originalBlock:lastBlock,timestamp});
            hash=cryptoHash(lastHash,timestamp,data,nonce,difficulty);
            binhash = hexToBinary(hash);
        }while(binhash.substring(0,difficulty)!=="0".repeat(difficulty));
       // console.log("block's binhash is ",binhash);
        const minedBlock = new this({
            lastHash,
            data,
            timestamp,
            difficulty,
            nonce,
            hash
        });
        return minedBlock;
    }

    static adjustDifficulty({originalBlock,timestamp})
    {
        if(originalBlock.difficulty<1)return 1;
        if(timestamp-originalBlock.timestamp>MINE_RATE)
            return originalBlock.difficulty-1;
        return originalBlock.difficulty+1;
    }
}

module.exports = Block;
