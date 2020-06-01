const Transaction = require("./transaction");

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

}

module.exports = TransactionPool;