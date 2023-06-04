# Offset Bridge

A set of smart contracts and scripts that bridge funds from Solana to Polygon
and uses them to buy and retire carbon credits via Toucan.

The resultant Retirement Certificate is then bridged back to Solana.

## Instructions

Note: This is a work in progress, and these steps will change as the project evolves.

1. Initialize

```shell
pnpm run initialize
```

Sets up a new State on solana and derives a Token Authority PDA.
This should be done only once.

2. Wrap SOL

```shell
pnpm run wrap-sol
```

Transfers SOL to the Solana "Token Authority" PDA

NOTE: this step will later be moved into the smart contract, so you can simply call the smart contract with SOL.
NOTE 2: When paying with an SPL Token like USDC, this step can be skipped

3. Swap SOL for USDCpo

```shell
pnpm run swap
```

4. Bridge USDCpo to Polygon

```shell
pnpm run bridge
```