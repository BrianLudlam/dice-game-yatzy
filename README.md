# Yatzy Dice Game

A smart contract implementation of the game Yatzy, utiliing an existing BlockDice65Turn3 contract to track user roll fucntionality. The user is able to start a game, continue a game per roll - accoumlatively tracking score, and abort game. 

TODO: elaborate more

## Deployment

The DiceGameYatzy contract can be deployed on Ethereum mainnet or testnet, side-chain, or compatible chain. Deployment requires address of deployed BlockDice65Turn3 contract.

Run `truffle compile` to compile, `truffle deploy` to deploy (default local chain).

## Testing 

Run `truffle test` for thorough testing.

## extdev-plasma-us1 Deployed Contract Address

0xA0D58ACBD4526371E182068F33d3493Df387585c

## BlockDice65Turn3 repo

https://github.com/BrianLudlam/block-dice65-turn3