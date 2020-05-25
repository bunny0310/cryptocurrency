const Block = require("./block");
const {GENESIS_DATA,MINE_RATE} = require("./config");
const {cryptoHash} = require('./crypto-hash');
const hexToBinary = require('hex-to-binary');

describe('Block',()=>{
    const timestamp = 2000;
    const lastHash = 'foo-hash';
    const hash = 'hash';
    const data = ['data'];
    const nonce = 1;
    const difficulty = 1;

    //test if the block has all the fields set up properly
    const block = new Block({timestamp,lastHash,hash,data,nonce,difficulty});
    it('has all the properties', ()=>{
        expect(block.timestamp).toEqual(timestamp);
        expect(block.lastHash).toEqual(lastHash);
        expect(block.data).toEqual(data);
        expect(block.hash).toEqual(hash);
        expect(block.nonce).toEqual(nonce);
        expect(block.difficulty).toEqual(difficulty);
    });

    //test for the genesis block
    describe('genesis()', ()=>{
        const genesisBlock = Block.genesis();
        it('returns a block instance', ()=>{
            expect(genesisBlock instanceof Block).toBe(true);
        });
        it('returns the genesis data',()=>{
            expect(genesisBlock).toEqual(GENESIS_DATA);
        });
    });

    //test for the mineBLock function
    describe('mineBlock()', ()=>{
        const lastBlock = Block.genesis();
        const data = 'minedData';
        const minedBlock = Block.mineBlock({lastBlock,data});
        it('returns a block instance', ()=>{
            expect(minedBlock instanceof Block).toBe(true);
        });
        it('sets the `lasthash` field of the minedBlock to be the hash value of the genesis block',()=>{
            expect(minedBlock.lastHash).toEqual(lastBlock.hash);
        });
        it('sets the `data` field of the minedBlock to be the data variable',()=>{
            expect(minedBlock.data).toEqual(data);
        });
        it('sets a `timestamp`', ()=>{
            expect(minedBlock.timestamp).not.toEqual(undefined);
        });
        it('creates a sha-256 hash based on proper inputs', ()=>{
            expect(minedBlock.hash).toEqual(
                cryptoHash(
                    minedBlock.timestamp,
                    minedBlock.data,
                    minedBlock.nonce,
                    minedBlock.difficulty,
                    minedBlock.lastHash
                )
            );
        });
        it('it sets a hash that meets the `difficulty` criteria', ()=>{
            expect(hexToBinary(minedBlock.hash).substring(0,minedBlock.difficulty)).toEqual("0".repeat(minedBlock.difficulty));
        });
        it('adjusts the difficulty', ()=>{
            const POSSIBLE_RESULTS = [lastBlock.difficulty+1,lastBlock.difficulty-1];
            expect(POSSIBLE_RESULTS.includes(minedBlock.difficulty)).toBe(true);
        })
    })

    //tests for checking if difficulty is being adjusted properly or not
    describe("adjustDifficulty()", ()=>{
        it("increases it for a quickly mined block", ()=>{
            expect(Block.adjustDifficulty({originalBlock:block,timestamp:block.timestamp+MINE_RATE-100}))
            .toEqual(block.difficulty+1);
        });
        it("decreases it for a slowly mined block", ()=>{
            expect(Block.adjustDifficulty({originalBlock:block,timestamp:block.timestamp+MINE_RATE+100}))
            .toEqual(block.difficulty-1);
        });
        it('has a lower limit of 1', ()=>{
            block.difficulty = -1;
            expect(Block.adjustDifficulty({originalBlock:block})).toEqual(1);
        });
    });

});