const crypto = require('crypto');
// const hexToBinary = require('hex-to-binary');
const cryptoHash = (...args)=>{
    let input = args.sort().join(' ');
    return crypto.createHash('sha256').update(input).digest('hex');
};

module.exports = {cryptoHash}