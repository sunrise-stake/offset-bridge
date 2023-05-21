// wormhole contract addresses
// reference: https://book.wormhole.com/reference/contracts.html

const POLYGON_TEST_TOKEN_BRIDGE_ADDRESS = "0x377D55a7928c046E18eEbb61977e714d2a76472a";
const SOL_TEST_TOKEN_BRIDGE_ADDRESS = "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe";
const SOL_TEST_BRIDGE_ADDRESS = "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5";
const SOL_TOKEN_BRIDGE_ADDRESS = "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb";
const SOL_BRIDGE_ADDRESS = "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth";
const CHAIN_ID_POLYGON = 5;
const CHAIN_ID_SOLANA = 1;

// usdc test token on solana , https://developers.circle.com/developer/docs/usdc-on-testnet#usdc-on-solana-testnet
const USDC_TEST_TOKEN = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

// Holding contract deployed on sepolia testnet 
const TARGET_CONTRACT = "0xFed3CfC8Ea0bF293e499565b8ccdD46ff8B37Ccb"; // this is just any contract rn 

const WORMHOLE_RPC_HOST = ["http://guardian:7071"];

module.exports = { POLYGON_TEST_TOKEN_BRIDGE_ADDRESS, SOL_TOKEN_BRIDGE_ADDRESS, SOL_BRIDGE_ADDRESS, SOL_TEST_BRIDGE_ADDRESS, SOL_TEST_TOKEN_BRIDGE_ADDRESS, USDC_TEST_TOKEN, CHAIN_ID_POLYGON, CHAIN_ID_SOLANA, TARGET_CONTRACT };