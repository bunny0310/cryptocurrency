const Transaction = require("./transaction");
const Blockchain = require("../blockchain/index");

class TransactionPool
{

    constructor()
    {
        this.transactionMap = {};
    }

    setMap(map)
    {
        this.transactionMap = map;
    }

    setTransaction(transaction)
    {
        this.transactionMap[transaction.id] = transaction;
    }

    existingTransaction({inputAddress})
    {
         const transactions = Object.values(this.transactionMap);
         return transactions.find((transaction)=>transaction.input.address === inputAddress);
    }

    validTransactions()
    {
        return Object.values(this.transactionMap).filter((transaction)=>Transaction.validTransaction(transaction));
    }

    clearTransactions()
    {
        this.transactionMap = {};
    }
    clearBlockchainTransactions({ chain }) {
        for (let i=1; i<chain.length; i++) {
          const block = chain[i];
    
          for (let transaction of block.data) {
            if (this.transactionMap[transaction.id]) {
              delete this.transactionMap[transaction.id];
            }
          }
        }
      }

}

module.exports = TransactionPool;