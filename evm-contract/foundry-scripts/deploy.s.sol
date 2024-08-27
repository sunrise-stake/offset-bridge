// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

import "forge-std/Script.sol";
import {CarbonOffsetSettler} from "src/CarbonOffsetSettler.sol";
import {HoldingContract} from "src/HoldingContract.sol";
import {HoldingContractFactory} from "src/HoldingContractFactory.sol";

contract Deploy is Script {
    CarbonOffsetSettler carbonOffsetSettler;
    HoldingContract holdingImplementation;
    HoldingContractFactory factory;

    function run() external {
        //read env variables and choose EOA for transaction signing
        uint256 deployerPrivateKey = vm.envUint("POLYGON_PRIVATE_KEY");
        address tco2 = 0x463de2a5c6E8Bb0c87F4Aa80a02689e6680F72C7;
        address beneficiary = address(0);
        string memory beneficiaryName = "0x0";
        string memory solanaAccountAddress = "0";
        address sunriseAdmin = address(0);

        vm.startBroadcast(deployerPrivateKey);

        holdingImplementation = new HoldingContract();
        // deploy factory contract pointing to implementation contract
        factory = new HoldingContractFactory(address(holdingImplementation));
        carbonOffsetSettler = new CarbonOffsetSettler();

        console.log(
            "Retire contract deployed to: %s",
            address(carbonOffsetSettler)
        );
        console.log(
            "Holding contract deployed to: %s",
            address(holdingImplementation)
        );
        console.log("Factory contract deployed to: %s", address(factory));

        vm.stopBroadcast();

        // impersonate a whale to fund our contract with usdc. to run:
        // cast rpc anvil_impersonateAccount 0x19aB546E77d0cD3245B2AAD46bd80dc4707d6307
        // forge script scripts/deploy.s.sol:Deploy --sender 0x19aB546E77d0cD3245B2AAD46bd80dc4707d6307 --rpc-url http://localhost:8545  --broadcast --unlocked
        // vm.startBroadcast(0x19aB546E77d0cD3245B2AAD46bd80dc4707d6307);
        // address usdc = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
        // // deal(usdc, address(holdingContract), 100 * 1e6);
        // usdc.call(
        //     abi.encodeWithSignature(
        //         "transfer(address,uint256)",
        //         address(holdingContract),
        //         100 * 1e6
        //     )
        // );
        // vm.stopBroadcast();
    }
}
