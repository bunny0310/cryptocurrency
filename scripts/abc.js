const express = require("express");
const bodyParser = require("body-parser");
const Blockchain = require("../blockchain");
const PubSub = require("../app/pubsub");
const request = require("request");
const Wallet = require("../wallet");
const Transaction = require("../wallet/transaction");
const TransactionPool = require("../wallet/transaction-pool");
const TransactionMiner = require("../app/transaction-miner");


const blockchain = new Blockchain();
const wallet = new Wallet();
const transactionPool = new TransactionPool();
const pubsub = new PubSub({blockchain,transactionPool});
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });
transactionMiner.mineTransactions();
console.log(transactionPool);