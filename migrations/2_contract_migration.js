const DiceGameYatzy = artifacts.require("DiceGameYatzy");
//const BlockDice65Turn3Address = '0x87B72d56b9b12Ac56E4018Ee1101c91bBeA29443';//dev
const BlockDice65Turn3Address = '0xFC1C54558586D42c2D584476f83862BeF02F569C';//loom
module.exports = function(deployer) {
  deployer.deploy(DiceGameYatzy, BlockDice65Turn3Address);
};
