class TransactionMiner
{

    constructor({blockchain,wallet,pubSub,transactionPool})
    {
        this.blockchain = blockchain;
        this.wallet = wallet;
        this.pubSub = pubSub;
        this.transactionPool = transactionPool;
    }

    mineTransactions()
    {
        //get the transaction pool's valid transactions
        //generate the miner's rewards
        //add a block consisting of these transactions to the blockchain
        //broadcast the updated blockchain
        //clear the pool
    }

}
module.exports = TransactionMiner;