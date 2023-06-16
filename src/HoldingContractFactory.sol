// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "openzeppelin/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "src/HoldingContract.sol";

contract HoldingContractFactory is Ownable {
    address public implementationAddress; // TODO immutable?
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
        string calldata newSolanaAccountAddress
    ) external returns (address) {
        // deploy a minimal proxy contract
        address proxy = Clones.cloneDeterministic(implementationAddress, salt);
        HoldingContract(proxy).initialize(
            newTco2,
            proxy,
            newBeneficiaryName,
            newSolanaAccountAddress
        );

        proxies.push(proxy);

        emit ContractCreated(proxy);
        return proxy;
    }
}
