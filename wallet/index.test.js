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
      })
    })
  })
});