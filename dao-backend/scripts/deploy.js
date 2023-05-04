const hre = require("hardhat");
const { NFT_CONTRACT_ADDRESS } = require("../constants");

//* How to change this file
/*
- Fill in the `ContractName` with your contract name.
- Uncomment the verification process if you want to verify your contract but make sure to uncomment the same in the `hardhat.config.js` and change the values as required.

You can pass in values into your contract like doing the following :
ex : Asssume you have a string and a number to pass
` const lock = await Lock.deploy("hello", 5);`
*/

//* Sample Deployment
/*
  const Lock = await hre.ethers.getContractFactory("ContractName");
  const lock = await Lock.deploy();

  await lock.deployed();

  console.log("Contract Deployed to : ", lock.address);

  console.log("Sleeping...");
  await sleep(50000);
  await hre.run("verify:verify", {
    address: lock.address,
    constructorArguments: [],
  });
*/

async function main() {
  // Deploy the NFTMarketplace contract first
  const NftMarketplace = await ethers.getContractFactory(
    "NFTMarketplace"
  );
  const nftMarketplace = await NftMarketplace.deploy();
  await nftMarketplace.deployed();

  console.log("nftMarketplace deployed to: ", nftMarketplace.address);

  // Now deploy the DAO contract
  const DaoContract = await ethers.getContractFactory("TheBasicDAO");
  const daoContract = await DaoContract.deploy(
    nftMarketplace.address,
    NFT_CONTRACT_ADDRESS,
    {
      // This assumes your metamask account has at least 1 ETH in its account
      // Change this value as you want
      value: ethers.utils.parseEther("1"),
    }
  );
  await daoContract.deployed();

  console.log("DAO contract deployed to: ", daoContract.address);
}

// Async Sleep function
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
