const express = require("express");
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const PubSub = require("./app/pubsub");
const request = require("request");
const Wallet = require("./wallet");
const Transaction = require("./wallet/transaction");
const TransactionPool = require("./wallet/transaction-pool");
const TransactionMiner = require("./app/transaction-miner");

const app = express();
app.use(bodyParser.json());
const blockchain = new Blockchain();
const wallet = new Wallet();
const transactionPool = new TransactionPool();
const pubsub = new PubSub({blockchain,transactionPool});
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
            transaction = wallet.createTransaction({amount,recipient,chain});
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



let PEER_PORT;
if(process.env.GENERATE_PEER_PORT === 'true')
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random()*1000);
const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT,()=>{
    console.log("listening at http://localhost:",PORT);
    if(PORT!==DEFAULT_PORT)
        syncWithRoot();
})