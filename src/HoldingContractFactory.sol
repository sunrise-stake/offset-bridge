// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "src/HoldingContract.sol";
import "forge-std/console.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract HoldingContractFactory is Ownable {
    address public implementationAddress;
    address[] public proxies;

    event ContractCreated(address proxy);

    constructor(address newImplementationAddress) {
        implementationAddress = newImplementationAddress;
    }

    function setImplementationAddress(
        address newImplementationAddress
    ) external onlyOwner {
        implementationAddress = newImplementationAddress;
    }

    function createContract(
        bytes32 salt,
        address newTco2,
        string calldata newBeneficiaryName,
        bytes32 newSolanaAccountAddress,
        address retireContract
    ) external returns (address) {
        // deploy a minimal proxy contract
        address proxy = Clones.cloneDeterministic(implementationAddress, salt);
        HoldingContract(proxy).initialize(
            newTco2,
            proxy,
            newBeneficiaryName,
            newSolanaAccountAddress,
            retireContract,
            msg.sender
        );

        proxies.push(proxy);

        emit ContractCreated(proxy);
        return proxy;
    }

    /**
        * @dev Returns the address of the implementation given a particular salt
        * @return The address of the implementation.
        */
    function getContractAddress(
        bytes32 salt,
        address deployer
    ) external view returns (address) {
        return Clones.predictDeterministicAddress(implementationAddress, salt, deployer);
    }
}
