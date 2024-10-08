// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

import "src/CarbonOffsetSettler.sol";
import "forge-std/console.sol";
import "lib/openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";

import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

import "src/interfaces/INFTBridge.sol";
import "lib/openzeppelin-contracts-upgradeable/contracts/token/ERC721/IERC721Upgradeable.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";
import "lib/openzeppelin-contracts/contracts/utils/Counters.sol";

/**
 * A holding contract that holds the bridged funds from a Solana account, use it to buy and retire TCO2,
 * and send the retirement certificate back to the Solana address
 */
contract HoldingContract is OwnableUpgradeable, IERC721Receiver {
    // Logic contract address
    // address public logicContract;

    // nonce for sending the wormhole message
    using Counters for Counters.Counter;
    Counters.Counter private _nonce;
    // Retirement details specific to the Holding Contract owner
    address public tco2;
    address public beneficiary;
    string public beneficiaryName;
    bytes32 public SolanaAccountAddress;
    // Retirement contract (mundo CarbonOffsetSettler)
    address public retireContract;

    // Wormhole bridge
    address public constant BRIDGE = 0x90BBd86a6Fe93D3bc3ed6335935447E75fAb7fCf;
    // testnet 0x51a02d0dcb5e52F5b92bdAA38FA013C91c7309A9;

    // Toucan Retirement Certificate Contract
    address public constant CERT = 0x5e377f16E4ec6001652befD737341a28889Af002;

    // USDC token contract
    address public constant USDC = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;

    /**
     * Event emitted when funds are used to offset emissions
     * @param tco2 Address of the project for which TCO2 will be retired
     * @param beneficiary Address of beneficiary, to whom the retirement will be accredited
     * @param beneficiaryName Name of beneficiary
     * @param amount Amount of TCO2 offset
     */
    event Offset(
        address indexed tco2,
        address indexed beneficiary,
        string beneficiaryName,
        uint256 amount
    );

    // Errors
    error InsufficientFunds();
    error InvalidRetireContract();

    /**
     * To initialize a holding contract with a new set of parameters
     * @notice Initialize the proxy contract
     * @param newTco2 Address of the project for which TCO2 will be retired
     * @param newBeneficiary Address of beneficiary, to whom the retirement will be accredited
     * @param newBeneficiaryName Name of beneficiary
     * @param newSolanaAccountAddress Address of wallet in Solana to which the retirement certificate will be sent to
     * @param newRetireContract Address of the deployed contract of CarbonOffsetSettler to be used to retire TCO2
     * @param owner Address of owner of the holding contract
     */
    function initialize(
        address newTco2,
        address newBeneficiary,
        string calldata newBeneficiaryName,
        bytes32 newSolanaAccountAddress,
        address newRetireContract,
        address owner
    ) external initializer {
        tco2 = newTco2;
        beneficiary = newBeneficiary;
        beneficiaryName = newBeneficiaryName;
        SolanaAccountAddress = newSolanaAccountAddress;
        retireContract = newRetireContract;
        // initialize ownership of the proxy and transfer to the user
        __Ownable_init();
        transferOwnership(owner);
    }

    /**
     * @notice Set the address of the CarbonOffsetSettler contract
     * @param newRetireContract Address of the CarbonOffsetSettler contract
     */
    function setRetireContract(address newRetireContract) external onlyOwner {
        if (newRetireContract == address(0)) revert InvalidRetireContract();
        retireContract = newRetireContract;
    }

    // ------------------ Setting retirement details (admin-only, ensure valid values) ------------------ //

    /**
     * @notice Set the details for the beneficiary of the carbon offset
     * @param newBeneficiary address of the beneficiary (in case you're retiring for someone else)
     * @param newBeneficiaryName name of the beneficiary
     */
    function setBeneficiary(
        address newBeneficiary,
        string calldata newBeneficiaryName
    ) external onlyOwner {
        beneficiary = newBeneficiary;
        beneficiaryName = newBeneficiaryName;
    }

    /**
     * @notice Set the address of the TCO2 token contract
     * @param newTco2 address of the TCO2 token contract
     */
    function setTCO2(address newTco2) external onlyOwner {
        tco2 = newTco2;
    }

    /*
     * @notice Set the Solana Account that receives the retirement certificate
     * @dev This is read out to calculate the associated token account for the Wormhole message
     * @param newSolanaAccountAddress address of the Solana Account
     */
    function setSolanaAccountAddress(
        bytes32 newSolanaAccountAddress
    ) external onlyOwner {
        _setSolanaAccountAddress(newSolanaAccountAddress);
    }

    // --------------------------------- Permissionless retiring --------------------------------------- //
    /**
     * @notice Offset carbon emissions by sending USDC to the CarbonOffsetSettler contract and using the funds to retire carbon tokens.
     * @param entity name of the entity that does the retirement (Sunrise Stake)
     * @param message retirement message
     */
    function offset(
        string calldata entity,
        string calldata message
    ) external onlyOwner {
        IERC20 usdcToken = IERC20(USDC);
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        if (usdcBalance == 0) revert InsufficientFunds();
        usdcToken.transfer(retireContract, usdcBalance);
        CarbonOffsetSettler(retireContract).retire(
            tco2,
            usdcBalance,
            entity,
            beneficiary,
            beneficiaryName,
            message
        );

        emit Offset(tco2, beneficiary, beneficiaryName, usdcBalance);
    }

    // --------------------------------- Permissionless bridging using Wormhole --------------------------------------- //
    function bridgeNFT(uint256 tokenId) external returns (uint256 sequence) {
        _bridgeNFT(tokenId);
    }

    /**
        * Convenience function to bridge a token to a specific address owned by the holding account owner
        * @param tokenId The token ID of the bridged token
        * @param solanaAccountAddress The Solana token account address of the recipient
        */
    function bridgeToAddress(uint256 tokenId, bytes32 solanaAccountAddress) external onlyOwner returns (uint256 sequence) {
        _setSolanaAccountAddress(solanaAccountAddress);
        _bridgeNFT(tokenId);
    }

    /**
     * @dev Necessary to receive ERC721 transfers
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @notice Set the Solana Account that receives the retirement certificate
     * @dev This is read out to calculate the associated token account for the Wormhole message
     * @param newSolanaAccountAddress address of the Solana Account
     */
    function _setSolanaAccountAddress(
        bytes32 newSolanaAccountAddress
    ) internal {
        SolanaAccountAddress = newSolanaAccountAddress;
    }

    function _bridgeNFT(uint256 tokenId) internal returns (uint256 sequence) {
        uint32 nonce = uint32(_nonce.current());
        _nonce.increment();
        IERC721Upgradeable(CERT).approve(BRIDGE, tokenId);
        INFTBridge(BRIDGE).transferNFT(
            CERT,
            tokenId,
            1, //Solana Chain ID
            SolanaAccountAddress, // recipient
            nonce
        );
    }
}
