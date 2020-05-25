const express = require("express");
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const PubSub = require("./pubsub");
const request = require("request");

const app = express();
app.use(bodyParser.json());
const blockchain = new Blockchain();
const pubsub = new PubSub({blockchain});

const DEFAULT_PORT=3000; 
const ROOT_NODE_URL = 'http://localhost:'+DEFAULT_PORT;

const syncChains = ()=>{
    request({url: `${ROOT_NODE_URL}/api/blocks`}, (error,response,body)=>{
        if(!error && response.statusCode===200)
        {
            console.log("syncing chain");
            blockchain.replaceChain(JSON.parse(body));
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

let PEER_PORT;
if(process.env.GENERATE_PEER_PORT === 'true')
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random()*1000);
const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT,()=>{
    console.log("listening at http://localhost:",PORT);
    if(PORT!==DEFAULT_PORT)
        syncChains();
})