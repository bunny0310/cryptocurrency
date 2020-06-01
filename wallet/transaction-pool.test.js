const TransactionPool = require('./transaction-pool');
const Transaction = require("./transaction");
const Wallet = require("./index");

describe('TransactionPool', ()=>{
    let transactionPool, transaction, wallet;

    beforeEach(()=>{
        transactionPool = new TransactionPool();
        wallet = new Wallet();
        transaction = new Transaction({
            senderWallet:wallet,
            amount:50,
            recipient: 'foo-recipient'
        });
    });

    describe('setTransaction()', ()=>{
        it('adds a transaction', ()=>{
            transactionPool.setTransaction(transaction);
            expect(transactionPool.transactionMap[transaction.id])
            .toBe(transaction);
        });
    });

    describe('existingTransaction()', ()=>{
        it('returns an existing transaction given an input address', ()=>{
            transactionPool.setTransaction(transaction);
            expect(transactionPool.existingTransaction({inputAddress:wallet.publicKey}))
            .toBe(transaction);
        })
    });

    describe('validTransactions()', ()=>{
        let validTransactions,errorMock;
        beforeEach(()=>{
            validTransactions = [];

            for(let i=0;i<10;++i)
             {
                 transaction = new Transaction({
                     senderWallet: wallet,
                     recipient:'foo-recipient',
                     amount:30
                 });

                 if(i&3 === 0)
                 {
                     transaction.input.amount = 999999;
                 }
                 else if(i%1 === 0)
                 {
                     transaction.input.signature = new Wallet().sign('foo');
                 }
                 else
                 {
                     validTransactions.push(transaction);
                 }

                 transactionPool.setTransaction(transaction);
             }

             errorMock = jest.fn();
             global.console.error = errorMock;
        });

        it('returns valid transaction', ()=>{
            expect(transactionPool.validTransactions()).toEqual(validTransactions);
        })
        it('logs an error', ()=>{
            transactionPool.validTransactions();
            expect(errorMock).toHaveBeenCalled();
        })
    })
});