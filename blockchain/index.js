const Block = require("./block");
const cryptoHash = require("../util/crypto-hash");
class Blockchain
{
    constructor()
    {
        this.chain = [Block.genesis()];
    }

    addBlock({data})
    {
        const lastBlock = this.chain[this.chain.length-1];
        const newBlock = Block.mineBlock({data,lastBlock});
        this.chain.push(newBlock);
    }

    static isValidChain(chain)
    {
        if(JSON.stringify(chain[0])!==JSON.stringify(Block.genesis()))return false;
        for(let i=1;i<chain.length;++i)
        {
            const block = chain[i];
            const actualLastHash = chain[i-1].hash;
            const {data,timestamp,lastHash,hash,difficulty, nonce} = block;
            if(lastHash!==actualLastHash)return false;
            const hashVal = cryptoHash(data,timestamp,lastHash,difficulty,nonce);
            if(hashVal!==hash)return false;
            if(Math.abs(block.difficulty-chain[i-1].difficulty)>1)return false;
        }
        return true;
    }

    replaceChain(newChain, onSuccess)
    {
        if(newChain.length<=this.chain.length){
            console.error("The incoming chain must be longer");
            return;
        }
        if(Blockchain.isValidChain(newChain))
        {
            this.chain=newChain;
            console.log("Blockchain replaced successfully");
            if(onSuccess)onSuccess();
        }
        else 
        {
            console.error("The incoming chain must be valid");
            return;
        }
    }
}

module.exports = Blockchain;