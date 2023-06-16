// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "openzeppelin/access/Ownable.sol";
import "src/CloneFactory.sol";
import "src/HoldingContractProxy.sol";

contract HoldingContractFactory is Ownable, CloneFactory {
    address public implementationAddress;
    HoldingContractProxy[] public proxies;

    event ContractCreated(HoldingContractProxy proxy);

    constructor(address newImplementationAddress) {
        implementationAddress = newImplementationAddress;
    }

    function setLibraryAddress(
        address newImplementationAddress
    ) external onlyOwner {
        implementationAddress = newImplementationAddress;
    }

    function createContract(uint256 initialData) external {
        // deploy a proxy contract
        HoldingContractProxy proxy = HoldingContractProxy(
            createClone(implementationAddress)
        );
        // initialize the contract state
        // proxy.initialize(initialData);

        proxies.push(proxy);
        emit ContractCreated(proxy);
    }
}
