const Transaction = require("./transaction");
const Wallet = require("./index");
const {verifySignature} = require("../util/index");
const {REWARD_INPUT,MINING_REWARD} = require("../config");


describe('Transaction', ()=>{
    let transaction, recipient, senderWallet, amount;

     beforeEach(()=>{
         senderWallet = new Wallet();
         recipient = 'sample-public-key';
         amount = 50;

         transaction = new Transaction({senderWallet,recipient,amount});
     });

     it('has an id',()=>{
        expect(transaction).toHaveProperty('id');
     });
     describe('outputMap', ()=>{
         it('has an output map', ()=>{
             expect(transaction).toHaveProperty('outputMap');
         });
         it('outputs the amount to the recipient', ()=>{
            expect(transaction.outputMap[recipient]).toEqual(amount);
         })
         it('outputs the remaining balance to the sender wallet', ()=>{
             expect(transaction.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance - amount);
         })
     });
     
     describe('input', ()=>{
         it('has an input', ()=>{
             expect(transaction).toHaveProperty('input');
         });
         it('has a timestamp in the input', ()=>{
             expect(transaction.input).toHaveProperty('timestamp');
         })
         it('sets the amount to senderwallets balance', ()=>{
             expect(transaction.input.amount).toEqual(senderWallet.balance);
         });
         it('sets the address to sender wallets public key', ()=>{
             expect(transaction.input.address).toEqual(senderWallet.publicKey);
         });

         it('signs the input', ()=>{
             expect(
                 verifySignature({
                     publicKey: senderWallet.publicKey,
                     data: transaction.outputMap,
                     signature: transaction.input.signature
                 })
             ).toBe(true);
         })
     });

     describe('validTransaction()', ()=>{
         let errorMock;
         beforeEach(()=>{
             errorMock = jest.fn();
             global.console.error = errorMock;
         })
         describe('when the transaction is valid', ()=>{
            it('returns true', ()=>{
                expect(Transaction.validTransaction(transaction)).toBe(true);
            });
         });
         describe('when the transaction is invalid', ()=>{
            describe('and a transaction`s output map has invalid values', ()=>{
                it('returns false & logs an error', ()=>{
                    transaction.outputMap[senderWallet.publicKey] = 99999;
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('and a transaction`s input has invalid signature', ()=>{
                it('returns false and logs an error', ()=>{
                    transaction.input.signature = new Wallet().sign('data');
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
         });
     });

     describe('update()', ()=>{
         let originalSignature, originalSenderOutput, nextRecipient, nextAmount;

         describe('and the amount is invalid', ()=>{
            it('throws an error', ()=>{
                expect(()=>transaction.update({senderWallet,amount:999999,recipient:'foo'})).toThrowError('Amount exceeds the balance');
              });
         });

         describe('and the amount is valid', ()=>{
            beforeEach(()=>{
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextRecipient = 'next-recipient';
                nextAmount = 50;
                transaction.update({
                    senderWallet,amount: nextAmount, recipient: nextRecipient
                });
            })
    
            it('outputs the amount to the next recipient', ()=>{
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
             });
             it('subtracts the amount from the original sender`s output amount', ()=>{
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput-nextAmount);
             });
             it('maintains a total ouput that matches the input amount', ()=>{
                expect(
                    Object.values(transaction.outputMap)
                    .reduce((total, outputAmt) => total+outputAmt)
                ).toEqual(transaction.input.amount);
             });
             it('resigns the transaction', ()=>{
                expect(transaction.input.signature).not.toEqual(originalSignature);
             });

             describe('and another update but for the same recipient', ()=>{
                 let addedAmt;
                 beforeEach(()=>{
                     addedAmt = 80;
                     transaction.update({senderWallet,recipient:nextRecipient,amount:addedAmt});
                 });
                 it('adds to the recipient amount', ()=>{
                    expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount+addedAmt);
                 });
                 it('updates the senderwallet balance', ()=>{
                    expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput-nextAmount-addedAmt);
                 });

             })
         });

         
     })

     describe('rewardTransaction()', ()=>{
         let rewardTransaction, minerWallet;

         beforeEach(()=>{
             minerWallet = new Wallet();
             rewardTransaction = Transaction.rewardTransaction({minerWallet});
         });

         it('creates a transaction with the reward input', ()=>{
             expect(rewardTransaction.input).toEqual(REWARD_INPUT);
             expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
         })
     });
})