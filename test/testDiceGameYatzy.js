const truffleAssert = require('truffle-assertions');
const DiceGameYatzy = artifacts.require("DiceGameYatzy");
const BlockDice65Turn3Address = '0x87B72d56b9b12Ac56E4018Ee1101c91bBeA29443';

const DICE_SIDES = 6;
const ROLL_COUNT = 5;
const VERIFY_BLOCKS = 1;

const BANK_COUNT = 6;
const BANK_ALL_FILTER = [5,5,5,5,5,5];
const BANK_NONE_FILTER = [0,0,0,0,0,0];

const TALLY_COUNT = 15;

let game;

const sleep = async (time) => {
  return new Promise(resolve => setTimeout(() => resolve(), time));
}

const consoleLog = (msg) => { console.log ('LOG >>> ', msg); }

const sleepUntilBlock = async (blockNumber) => {
  let _blockNumber = 0;
  while (_blockNumber <= blockNumber) {
    await sleep(1200);
    const block = await web3.eth.getBlock("latest");
    _blockNumber = block.number;
  }
}


contract("DiceGameYatzy", (accounts) => {

  const owner = accounts[0];
  const alice = accounts[1];
  const aliceOp = accounts[2];
  const bob = accounts[3];

  beforeEach(async () => {
    game = await DiceGameYatzy.new(BlockDice65Turn3Address, {from: owner});
  });

  afterEach(async () => {
    await game.destroy({from: owner});
  });

  it("should allow a random game", async () => {
  	const key = web3.utils.soliditySha3 (Date.now());
  	let tx;
  	let tally;
    let gameId;
	  try{
  	  tx = await game.startGame(web3.utils.soliditySha3(key), VERIFY_BLOCKS, {from: alice});
  	  truffleAssert.eventEmitted(tx, 'GameStarted', (e) => (
    		e.account.toString() === alice &&
        e.verify.toString() === VERIFY_BLOCKS.toString() &&
    		(gameId = e.gameId.toString()) !== "0"
  	  ));

      const verified = await game.verifyActiveGame(alice, gameId, {from: bob});
      assert(verified, true);

      const aliceAccount = await game.getAccount(alice, {from: bob});
      assert(aliceAccount.gameId.toString(), gameId);
      assert(aliceAccount.total.toString(), "0");
      assert(aliceAccount.score.toString(), "0");

      const aliceGame = await game.getGame(gameId, {from: bob});
      assert(aliceGame.account.toString(), alice);
      assert(aliceGame.score.toString(), "0");
      assert(aliceGame.verify.toString(), VERIFY_BLOCKS.toString());
      assert(aliceGame.turns.toString(), "0");
      assert(aliceGame.tally.length, 15);

      await sleepUntilBlock(tx.receipt.blockNumber + VERIFY_BLOCKS);

      let bank = await game.getTurnBank(key, {from: alice});
      bank = bank.map((value) => parseInt(value.toString(), 10));
      consoleLog('bank '+ bank.join(' '));

      assert(bank.reduce((total, each) => total + each), ROLL_COUNT);

      let roll = await game.getTurnRoll(key, {from: alice});
      roll = roll.map((value) => parseInt(value.toString(), 10));
      consoleLog('roll '+ roll.join(' '));

      assert(roll.length, ROLL_COUNT);

    	for (tally=0; tally<(TALLY_COUNT-1); tally++){
    	  tx = await game.continueGame(
  	  	  key, web3.utils.soliditySha3(key), BANK_ALL_FILTER, tally, {from: alice});
    		truffleAssert.eventEmitted(tx, 'GameContinued', (e) => (
    	  	  e.account.toString() === alice && 
    	  	  e.turn.toString() === (tally+1).toString() && 
    	      e.tally.length === TALLY_COUNT && 
    	      parseInt(e.score.toString(), 10) === e.tally
    	      	.map((value) => (parseInt(value, 10) === 255) ? 0 : parseInt(value, 10))
    	      	.reduce((total, each) => total + each)
  	    ));  
  	  	await sleepUntilBlock(tx.receipt.blockNumber + VERIFY_BLOCKS);
  	  }

  	  tx = await game.continueGame(
  	  	key, web3.utils.soliditySha3(key), BANK_ALL_FILTER, TALLY_COUNT-1, {from: alice});
  	  truffleAssert.eventEmitted(tx, 'GameEnded', (e) => (
    		e.account.toString() === alice && 
      	e.tally.length === TALLY_COUNT && 
          parseInt(e.score.toString(), 10) === e.tally
  	      .map((value) => (parseInt(value, 10) === 255) ? 0 : parseInt(value, 10))
  	      .reduce((total, each) => total + each)
  	  ));
  	} catch(e) {
  	  tx = await game.abortGame({from: alice});
  	  truffleAssert.eventEmitted(tx, 'GameEnded', (e) => (
    		e.account.toString() === alice
  	  ));
  	  assert(false, ''+e);
  	}

  })
/*
  it("should allow abort game", async () => {
  	const key = web3.utils.soliditySha3 (Date.now());
  	let tx;
	try{
	  tx = await game.startGame(web3.utils.soliditySha3(key), VERIFY_BLOCKS, {from: alice});
	  truffleAssert.eventEmitted(tx, 'GameStarted', (e) => (
  		e.account.toString() === alice &&
  		e.gameId.toString() !== "0"
	  ));

    await sleepUntilBlock(tx.receipt.blockNumber + VERIFY_BLOCKS);

	  tx = await game.continueGame(
  		key, web3.utils.soliditySha3(key), BANK_ALL_FILTER, 14, {from: alice}
    );
    truffleAssert.eventEmitted(tx, 'GameContinued', (e) => (
	  	e.account.toString() === alice && 
	  	e.turn.toString() === "1" && 
    	e.tally.length === TALLY_COUNT && 
    	parseInt(e.score.toString(), 10) === e.tally
      .map((value) => (parseInt(value, 10) === 255) ? 0 : parseInt(value, 10))
      .reduce((total, each) => total + each)
	  ));

	  tx = await game.abortGame({from: alice});
	  truffleAssert.eventEmitted(tx, 'GameEnded', (e) => (
  		e.account.toString() === alice
	  ));

	} catch(e) {
	  tx = await game.abortGame({from: alice});
	  truffleAssert.eventEmitted(tx, 'GameEnded', (e) => (
  		e.account.toString() === alice
	  ));
	  assert(false, ''+e);
	} 
  })

  it("should not allow more than one game per account at a time", async () => {
  	const key = web3.utils.soliditySha3 (Date.now());
  	let tx;
  	try{
  	  tx = await game.startGame(web3.utils.soliditySha3(key), VERIFY_BLOCKS, {from: alice});
  	  truffleAssert.eventEmitted(tx, 'GameStarted', (e) => (
    		e.account.toString() === alice &&
    		e.gameId.toString() !== "0"
  	  ));
  	  await game.startGame(web3.utils.soliditySha3(key), {from: alice});
  	  assert(false);
  	} catch(e) {
  	  tx = await game.abortGame({from: alice});
  	  truffleAssert.eventEmitted(tx, 'GameEnded', (e) => (
    		e.account.toString() === alice
  	  ));
  	  assert(true);
  	} 
  })

  it("should allow multiple accounts random games at once", async () => {
  	const keyA = web3.utils.soliditySha3 (Date.now());
  	const keyB = web3.utils.soliditySha3 (Date.now());
  	let tx;
  	try{
  	  tx = await game.startGame(web3.utils.soliditySha3(keyA), VERIFY_BLOCKS, {from: alice});
  	  truffleAssert.eventEmitted(tx, 'GameStarted', (e) => (
    		e.account.toString() === alice &&
    		e.gameId.toString() !== "0"
  	  ));

    	tx = await game.startGame(web3.utils.soliditySha3(keyB), VERIFY_BLOCKS, {from: bob});
  	  truffleAssert.eventEmitted(tx, 'GameStarted', (e) => (
    		e.account.toString() === bob &&
    		e.gameId.toString() !== "0"
  	  ));

      await sleepUntilBlock(tx.receipt.blockNumber + VERIFY_BLOCKS);

  	  let tally;
  	  for (tally=0; tally<(TALLY_COUNT-1); tally++){
  	  	tx = await game.continueGame(
	  	    keyA, web3.utils.soliditySha3(keyA), BANK_ALL_FILTER, tally, {from: alice});
  		  truffleAssert.eventEmitted(tx, 'GameContinued', (e) => (
  	  	  e.account.toString() === alice && 
  	  	  e.turn.toString() === (tally+1).toString() && 
  	      e.tally.length === TALLY_COUNT && 
  	      parseInt(e.score.toString(), 10) === e.tally
  		      .map((value) => (parseInt(value, 10) === 255) ? 0 : parseInt(value, 10))
  		      .reduce((total, each) => total + each)
  	  	));

  	  	tx = await game.continueGame(
  	  	  keyB, web3.utils.soliditySha3(keyB), BANK_ALL_FILTER, tally, {from: bob});
  		  truffleAssert.eventEmitted(tx, 'GameContinued', (e) => (
  	  	  e.account.toString() === bob && 
  	  	  e.turn.toString() === (tally+1).toString() && 
  	      e.tally.length === TALLY_COUNT && 
  	      parseInt(e.score.toString(), 10) === e.tally
  		      .map((value) => (parseInt(value, 10) === 255) ? 0 : parseInt(value, 10))
  		      .reduce((total, each) => total + each)
  	  	));

        await sleepUntilBlock(tx.receipt.blockNumber + VERIFY_BLOCKS);
  	  }

  	  tx = await game.continueGame(
  	  	keyA, web3.utils.soliditySha3(keyA), BANK_ALL_FILTER, TALLY_COUNT-1, {from: alice});
  	  truffleAssert.eventEmitted(tx, 'GameEnded', (e) => (
    		e.account.toString() === alice && 
      	e.tally.length === TALLY_COUNT && 
      	parseInt(e.score.toString(), 10) === e.tally
  	      .map((value) => (parseInt(value, 10) === 255) ? 0 : parseInt(value, 10))
  	      .reduce((total, each) => total + each)
      ));

  	  tx = await game.continueGame(
  	  	keyB, web3.utils.soliditySha3(keyB), BANK_ALL_FILTER, TALLY_COUNT-1, {from: bob});
  	  truffleAssert.eventEmitted(tx, 'GameEnded', (e) => (
    		e.account.toString() === bob && 
      	e.tally.length === TALLY_COUNT && 
      	parseInt(e.score.toString(), 10) === e.tally
  	      .map((value) => (parseInt(value, 10) === 255) ? 0 : parseInt(value, 10))
  	      .reduce((total, each) => total + each)
  	  ));

  	} catch(e) {
  	  tx = await game.abortGame({from: alice});
  	  truffleAssert.eventEmitted(tx, 'GameEnded', (e) => (
    		e.account.toString() === alice
  	  ));

  	  tx = await game.abortGame({from: bob});
  	  truffleAssert.eventEmitted(tx, 'GameEnded', (e) => (
    		e.account.toString() === bob
  	  ));

  	  assert(false, ''+e);
  	}
  })
*/
});