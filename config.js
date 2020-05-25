const INITIAL_DIFFICULTY = 3;
const MINE_RATE = 1000; //in milli seconds

const GENESIS_DATA = {
    timestamp: 1,
    data: [],
    hash: 'foo-hash',
    nonce: 0,
    difficulty: INITIAL_DIFFICULTY,
    lastHash: 'foo-lastHash'
}
module.exports = {GENESIS_DATA, INITIAL_DIFFICULTY, MINE_RATE};