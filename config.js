const INITIAL_DIFFICULTY = 3;
const MINE_RATE = 1000; //in milli seconds
const STARTING_BALANCE = 1000;

const GENESIS_DATA = {
    timestamp: 1,
    data: [],
    hash: 'foo-hash',
    nonce: 0,
    difficulty: INITIAL_DIFFICULTY,
    lastHash: 'foo-lastHash'
}

const REWARD_INPUT = 
{
    address: '*authorized-reward*',
};
const MINING_REWARD=50;

module.exports = {GENESIS_DATA, INITIAL_DIFFICULTY, MINE_RATE, STARTING_BALANCE,REWARD_INPUT,MINING_REWARD};