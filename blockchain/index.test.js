const Blockchain = require(".");
const Block = require("./block");
const cryptoHash = require("../util/crypto-hash");
const Wallet = require("../wallet");
const Transaction = require("../wallet/transaction");

describe("Blockchain",()=>{
    let blockchain,newChain, originalChain;
    beforeEach(()=>{
        blockchain = new Blockchain();
        newChain = new Blockchain();

        originalChain = blockchain.chain;
    })
    it('contains a `chain` array instance', ()=>{
        expect(blockchain.chain instanceof Array).toBe(true);
    });
    it('starts with the `genesis` block', ()=>{
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    });
    it('adds a new block to the chain', ()=>{
        const data = 'foo';
        blockchain.addBlock({data});
        expect(blockchain.chain[blockchain.chain.length-1].data).toEqual(data);
    })

    //tests for checking if the chain is valid or not
    describe("isValidChain()", ()=>{
        //if the chain doesn't start with a genesis block
        describe("when the chain doesn't begin with a genesis block", ()=>{
            it('returns false', ()=>{
                blockchain.chain[0]="bogus data";
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
        })
        describe("when the chain has multiple blocks and", ()=>{
            beforeEach(()=>{
                blockchain.addBlock({data:'first block'});
                blockchain.addBlock({data:'second block'});
                blockchain.addBlock({data:'third block'});
            })
            //lastHash reference is tampered with
            describe('and a lastHash reference has changed', ()=>{
                it('returns false', ()=>{
                    blockchain.chain[2].lastHash='bogus-lastHash';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });
            //data has been tampered with
            describe('and chain contains a block with an invalid field', ()=>{
                it('returns false', ()=>{
                    blockchain.chain[2].data='bogus data';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });
            //there is a difficulty jump
            describe('there is a block in the chain with difficulty jump', ()=>{
                it('should return false', ()=>{
                    const lastBlock = blockchain.chain[blockchain.chain.length-1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const nonce = 0;
                    const difficulty = lastBlock.difficulty-3;
                    const data = 'bogus data';
                    const hash = cryptoHash(lastHash,timestamp,nonce,difficulty,data);
                    const badBlock = new Block({lastHash,timestamp,hash,difficulty,nonce,data});
                    blockchain.chain.push(badBlock);
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            //there are no invalid blocks
            describe('and chain doesn`t contain any invalid blocks', ()=>{
                it('returns true', ()=>{
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
                });
            });           
        })

    })


    //tests for replaceChain method
    describe("replaceChain()", ()=>{

        let errorMock = jest.fn();
        let logMock = jest.fn();

        global.console.error = errorMock;
        global.console.log = logMock;

        describe("when the new chain is not longer", ()=>{
            beforeEach(()=>{
                newChain.chain[0]='bogus data';
                blockchain.replaceChain(newChain.chain);
            })
            it("does not replace the chain", ()=>{
                expect(blockchain.chain).toEqual(originalChain);
            });
            it("logs an error", ()=>{
                expect(errorMock).toHaveBeenCalled();
            });
        });
        describe("when the new chain is longer", ()=>{
            beforeEach(()=>{
                newChain.addBlock({data:'first block'});
                newChain.addBlock({data:'second block'});
                newChain.addBlock({data:'third block'});
            })
            describe("and the chain is invalid", ()=>{
                beforeEach(()=>{
                    newChain.chain[2].hash = 'bogus-hash';
                    blockchain.replaceChain(newChain.chain);
                })
                it("does not replace the chain", ()=>{
                    expect(blockchain.chain).toEqual(originalChain);                    
                });
                it("logs an error", ()=>{
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe("and the chain is valid", ()=>{
                beforeEach(()=>{
                    blockchain.replaceChain(newChain.chain);
                })
                it("replaces the chain", ()=>{
                    expect(blockchain.chain).toEqual(newChain.chain); 
                });
                it("logs an error", ()=>{
                    expect(logMock).toHaveBeenCalled();
                });
            });
        });

    });

    describe('validTransactionData()', () => {
        let transaction, rewardTransaction, wallet;
    
        beforeEach(() => {
          wallet = new Wallet();
          transaction = wallet.createTransaction({ recipient: 'foo-address', amount: 65 });
          rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
        });
    
        describe('and the transaction data is valid', () => {
          it('returns true', () => {
            newChain.addBlock({ data: [transaction, rewardTransaction] });
    
            expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(true);
          });
        });
    
        describe('and the transaction data has multiple rewards', () => {
          it('returns false and logs an error', () => {
            newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] });
    
            expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
          });
        });
    
        describe('and the transaction data has at least one malformed outputMap', () => {
          describe('and the transaction is not a reward transaction', () => {
            it('returns false and logs an error', () => {
              transaction.outputMap[wallet.publicKey] = 999999;
    
              newChain.addBlock({ data: [transaction, rewardTransaction] });
    
              expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
            });
          });
    
          describe('and the transaction is a reward transaction', () => {
            it('returns false and logs an error', () => {
              rewardTransaction.outputMap[wallet.publicKey] = 999999;
    
              newChain.addBlock({ data: [transaction, rewardTransaction] });
    
              expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
            });
          });
        });
    
        describe('and the transaction data has at least one malformed input', () => {
          it('returns false and logs an error', () => {
            wallet.balance = 9000;
    
            const evilOutputMap = {
              [wallet.publicKey]: 8900,
              fooRecipient: 100
            };
    
            const evilTransaction = {
              input: {
                timestamp: Date.now(),
                amount: wallet.balance,
                address: wallet.publicKey,
                signature: wallet.sign(evilOutputMap)
              },
              outputMap: evilOutputMap
            }
    
            newChain.addBlock({ data: [evilTransaction, rewardTransaction] });
    
            expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
          });
        });
        describe("and a block contains multiple identical transactions", ()=>{
            it("returns false", ()=>{
                newChain.addBlock({data: [transaction,transaction,transaction,rewardTransaction]});
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
            });
        })
    })
});