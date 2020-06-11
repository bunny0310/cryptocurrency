const express = require("express");
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const PubSub = require("./app/pubsub");
const request = require("request");
const cors = require("cors");
const path = require("path");
const Wallet = require("./wallet");
const Transaction = require("./wallet/transaction");
const TransactionPool = require("./wallet/transaction-pool");
const TransactionMiner = require("./app/transaction-miner");
const isDevelopment = process.env.ENV === 'development';

const REDIS_URL = isDevelopment ?
  'redis://127.0.0.1:6379' :
  'redis://h:p8cebc8dfc62a0d728f98a7dbe778658ad8bed5469392ee42300706aece2b07dc@ec2-3-221-10-247.compute-1.amazonaws.com:25299'

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'client/public')));
app.use(cors());

const blockchain = new Blockchain();
const wallet = new Wallet();
const transactionPool = new TransactionPool();
const pubsub = new PubSub({ blockchain, transactionPool, redisUrl: REDIS_URL });
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

const DEFAULT_PORT=3000; 
const ROOT_NODE_URL = 'http://localhost:'+DEFAULT_PORT;

const syncWithRoot = ()=>{
    request({url: `${ROOT_NODE_URL}/api/blocks`}, (error,response,body)=>{
        if(!error && response.statusCode===200)
        {
            console.log("syncing chain");
            blockchain.replaceChain(JSON.parse(body));
        }
    })

    request({url: `${ROOT_NODE_URL}/api/transaction-pool-map`}, (error,response,body)=>{
        if(!error && response.statusCode===200)
        {
            const map = JSON.parse(body);
            console.log("syncing transactions with", JSON.stringify(map));
            transactionPool.setMap(map);
        }
    })
}

app.get('/api/blocks', (req,res)=>{
    res.status(200).json(blockchain.chain);
});

app.post('/api/blocks/',(req,res)=>{
    let length = blockchain.chain.length;
    const data = req.body.data;
    if(data===undefined || data==="" || data===null)res.status(500).send("Internal server error!");
    blockchain.addBlock({data});
    if(blockchain.chain.length-length==1 && blockchain.chain[blockchain.chain.length-1].data == data)
    {
        pubsub.brodcastChain();       
        res.status(200).send("Block added!");
    }
    else res.status(500).send("Internal server error!");

})

app.post('/api/transact', (req,res)=>{
    const recipient = req.body.recipient; 
    const amount = req.body.amount;

    if(recipient===undefined || amount===undefined)
        return res.status(422).send("Invalid request,please check the format of the request");

    let transaction = transactionPool.existingTransaction({inputAddress:wallet.publicKey});
    try{
        if(transaction)
        {
            transaction.update({senderWallet:wallet,amount,recipient});
        }
        else
        {
            transaction = wallet.createTransaction({amount,recipient,chain:blockchain.chain});
        }
    }catch(err)
    {
        return res.status(400).json({type: 'error', msg: err.message});
    }
    transactionPool.setTransaction(transaction);
    pubsub.brodcastTransaction(transaction);
    return res.status(201).json({transaction});
})

app.get('/api/transaction-pool-map', (req,res)=>{
    res.status(200).json({transactionPoolMap: transactionPool.transactionMap});
})
app.get('/api/mine-transactions', (req,res)=>{
    transactionMiner.mineTransactions();
    res.redirect('/api/blocks');
});
app.get('/api/wallet-info', (req,res)=>{
    const address = wallet.publicKey;
    res.status(200).json({
        address,
        balance: Wallet.calculateBalance(
            {
                chain:blockchain.chain,
                address
            }
        )
    });
});
if (isDevelopment) {
    const walletFoo = new Wallet();
    const walletBar = new Wallet();
  
    const generateWalletTransaction = ({ wallet, recipient, amount }) => {
      const transaction = wallet.createTransaction({
        recipient, amount, chain: blockchain.chain
      });
  
      transactionPool.setTransaction(transaction);
    };
  
    const walletAction = () => generateWalletTransaction({
      wallet, recipient: walletFoo.publicKey, amount: 5
    });
  
    const walletFooAction = () => generateWalletTransaction({
      wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
    });
  
    const walletBarAction = () => generateWalletTransaction({
      wallet: walletBar, recipient: wallet.publicKey, amount: 15
    });
  
    for (let i=0; i<10; i++) {
      if (i%3 === 0) {
        walletAction();
        walletFooAction();
      } else if (i%3 === 1) {
        walletAction();
        walletBarAction();
      } else {
        walletFooAction();
        walletBarAction();
      }
  
      transactionMiner.mineTransactions();
    }
  }


let PEER_PORT;
if(process.env.GENERATE_PEER_PORT === 'true')
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random()*1000);
const PORT = process.env.PORT||PEER_PORT || DEFAULT_PORT;
app.listen(PORT,()=>{
    console.log("listening at http://localhost:",PORT);
    if(PORT!==DEFAULT_PORT)
        syncWithRoot();
})