// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "src/HoldingContract.sol";
import "forge-std/console.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @notice Factory to generate holding contracts
 */
contract HoldingContractFactory is Ownable {
    address public implementationAddress;
    address[] public proxies;

    event ContractCreated(address proxy);

    constructor(address newImplementationAddress) {
        implementationAddress = newImplementationAddress;
    }

    /**
     * @notice Set the implementation address for a holding contract
     * @param newImplementationAddress Address of the implementation of a holding contract
     */ 
    function setImplementationAddress(
        address newImplementationAddress
    ) external onlyOwner {
        implementationAddress = newImplementationAddress;
    }

    /**
     * Create a new holding contract
     * @param salt Salt for determining the address of new holding contract
     * @param newTco2 Address of the project for which TCO2 will be retired
     * @param newBeneficiaryName Name of beneficiary
     * @param newSolanaAccountAddress Address of wallet in Solana to which the retirement certificate will be sent to
     * @param retireContract Address of the deployed contract of CarbonOffsetSettler to be used to retire TCO2
     */
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
