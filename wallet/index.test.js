const Wallet = require("./index");
const {verifySignature} = require("../util");
const Transaction = require('./transaction');
const {STARTING_BALANCE} = require("../config");
const Blockchain = require("../blockchain");

describe('Wallet', () => {
    let wallet;
  
    beforeEach(() => {
      wallet = new Wallet();
    });
  
    it('has a `balance`', () => {
      expect(wallet).toHaveProperty('balance');
    });
  
    it('has a `publicKey`', () => {
      expect(wallet).toHaveProperty('publicKey');
    });
  
    describe('signing data', () => {
      const data = 'foobar';
  
      it('verifies a signature', () => {
        expect(
          verifySignature({
            publicKey: wallet.publicKey,
            data,
            signature: wallet.sign(data)
          })
        ).toBe(true);
      });
  
      it('does not verify an invalid signature', () => {
        expect(
          verifySignature({
            publicKey: wallet.publicKey,
            data,
            signature: new Wallet().sign(data)
          })
        ).toBe(false);
      });
    });

    describe('createTransaction()', ()=>{
      describe('and the amount exceeds the balance', ()=>{
        it('throws an error', ()=>{
          expect(()=>wallet.createTransaction({amount:999999,recipient:'foo'})).toThrowError('Amount exceeds the balance');
        })
      });
      describe('and the amount is valid', ()=>{
        let amount,recipient,transaction;
        beforeEach(()=>{
          amount = 50;
          recipient = 'foo';
          transaction  = wallet.createTransaction({amount,recipient});
        })
        it('creates an instance of transaction class', ()=>{
          expect(transaction instanceof Transaction).toBe(true);
        });
        it('matches the transaction input with the wallet', ()=>{
          expect(transaction.input.address).toEqual(wallet.publicKey);
        });
        it('outputs the amount of the recipient', ()=>{
          expect(transaction.outputMap[recipient]).toEqual(amount);
        });
      });

      describe('and a chain is passed', ()=>{
        it('calls Wallet.calculateBalance()', ()=>{

          const calculateBalanceMock = jest.fn();
          const originalMethod = Wallet.calculateBalance;
          Wallet.calculateBalance = calculateBalanceMock;
          Wallet.calculateBalance = 
          wallet.createTransaction({
            amount:10,
            recipient:'foo',
            chain: new Blockchain().chain
          });
          expect(calculateBalanceMock).toHaveBeenCalled();
          Wallet.calculateBalance = originalMethod;
        })
      })
  })

  describe('calculateBalance()', ()=>{
    let blockchain;
    beforeEach(()=>{
      blockchain = new Blockchain();
    });

    describe('and there`re no outputs for the wallet', ()=>{
      it('returns the starting balance', ()=>{
        expect(
          Wallet.calculateBalance({
            chain:blockchain.chain,
            address: wallet.publicKey
          })
        ).toEqual(STARTING_BALANCE);
      });
    });
    describe('and there`re outputs for thr wallet', ()=>{
      let transaction1,transaction2;
      beforeEach(()=>{
        transaction1 = new Wallet().createTransaction({
          recipient:wallet.publicKey,
          amount: 20
        });
        transaction2 = new Wallet().createTransaction({
          recipient:wallet.publicKey,
          amount: 20
        });
        blockchain.addBlock({data:[transaction1,transaction2]});
      });
      it('adds up all the outputs', ()=>{
        expect(Wallet.calculateBalance({
          chain:blockchain.chain,
          address: wallet.publicKey
        })).toEqual(STARTING_BALANCE+transaction1.outputMap[wallet.publicKey]+transaction2.outputMap[wallet.publicKey]);
      });

      describe('and the wallet has made the transaction', ()=>{
        let recentTransaction;
        beforeEach(()=>{
          recentTransaction = wallet.createTransaction({
            recipient: 'foo-recipient',
            amount: 20
          });
          blockchain.addBlock({data:[recentTransaction]});
        });
        
        it('returns the output amount of the recent transaction', ()=>{
          expect(Wallet.calculateBalance({
            chain:blockchain.chain,
            address:wallet.publicKey
          })).toEqual(recentTransaction.outputMap[wallet.publicKey]);
        });

        describe('and there are more outputs next to and after the recent transaction', ()=>{
          let sameBlockTransaction, nextBlockTransaction;
          beforeEach(()=>{
            recentTransaction = wallet.createTransaction({
              recipient: 'later-foo-address',
              amount: 20
            });
            sameBlockTransaction = Transaction.rewardTransaction({minerWallet: wallet});
            blockchain.addBlock({data:[recentTransaction,sameBlockTransaction]});
            nextBlockTransaction = new Wallet().createTransaction({
              amount:75,
              recipient:wallet.publicKey
            });
            blockchain.addBlock({data:[nextBlockTransaction]});
          });
          it('adds up all the output values', ()=>{
            expect(Wallet.calculateBalance({
              chain:blockchain.chain,
              address: wallet.publicKey
            }))
            .toEqual(recentTransaction.outputMap[wallet.publicKey]+sameBlockTransaction.outputMap[wallet.publicKey]+nextBlockTransaction.outputMap[wallet.publicKey]);
          })
        })
      })
    })
  })
});